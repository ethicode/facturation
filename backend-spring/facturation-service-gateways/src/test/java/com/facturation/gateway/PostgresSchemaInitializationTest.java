package com.facturation.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import com.facturation.gateway.outbound.entity.UserEntity;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.UUID;
import liquibase.integration.spring.SpringLiquibase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** À exécuter uniquement sur une base de test PostgreSQL dédiée et initialement vide. */
@DataJpaTest
@ActiveProfiles("postgres")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIfEnvironmentVariable(named = "FACTURATION_TEST_POSTGRES_URL", matches = ".+")
class PostgresSchemaInitializationTest {

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("FACTURATION_TEST_POSTGRES_URL"));
        registry.add("spring.datasource.username",
                () -> System.getenv().getOrDefault("FACTURATION_TEST_POSTGRES_USERNAME", "postgres"));
        registry.add("spring.datasource.password",
                () -> System.getenv().getOrDefault("FACTURATION_TEST_POSTGRES_PASSWORD", ""));
    }

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private SpringLiquibase liquibase;

    @Test
    void createsApplicationTablesAndReferenceDataBeforeJpa() {
        var tables = jdbc.queryForList(
                "select tablename from pg_tables where schemaname = current_schema()", String.class);
        assertThat(tables).contains(
                "system_meta", "roles", "users", "user_roles", "directions",
                "workflow_assignments", "status_catalog", "factures", "facture_attachments",
                "facture_history", "facture_history_attachments", "appro_budgets",
                "appro_budget_items", "appro_domains", "appro_subdomains", "appro_tickets",
                "appro_ticket_history", "appro_ticket_history_attachments", "dirfin_history",
                "missions", "mission_attachments", "mission_history", "kpi_metrics",
                "trace_events", "budget_lines", "databasechangelog", "databasechangeloglock");
        assertThat(jdbc.queryForObject("select count(*) from roles", Integer.class)).isPositive();
    }

    @Test
    void doesNotReplayMigrationsOrDuplicateReferenceData() throws Exception {
        int migrations = jdbc.queryForObject("select count(*) from databasechangelog", Integer.class);
        int roles = jdbc.queryForObject("select count(*) from roles", Integer.class);

        liquibase.afterPropertiesSet();

        assertThat(jdbc.queryForObject("select count(*) from databasechangelog", Integer.class))
                .isEqualTo(migrations);
        assertThat(jdbc.queryForObject("select count(*) from roles", Integer.class)).isEqualTo(roles);
    }

    @Test
    void persistsAndReadsInstantsWithExistingJpaConverter() {
        var id = UUID.randomUUID().toString();
        var now = Instant.parse("2026-11-02T12:34:56.123456789Z");
        var user = new UserEntity();
        user.setId(id);
        user.setUsername("schema-test-" + id);
        user.setFullName("Schema test");
        user.setEmail(id + "@example.invalid");
        user.setRole(jdbc.queryForObject("select code from roles order by position limit 1", String.class));
        user.setPasswordHash("not-a-login-password");
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        entityManager.persist(user);
        entityManager.flush();
        entityManager.clear();

        assertThat(entityManager.find(UserEntity.class, id).getCreatedAt()).isEqualTo(now);
    }
}