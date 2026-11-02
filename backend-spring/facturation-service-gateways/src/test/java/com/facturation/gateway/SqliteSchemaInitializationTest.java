package com.facturation.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@DataJpaTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SqliteSchemaInitializationTest {

    @TempDir
    static Path databaseDirectory;

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> "jdbc:sqlite:" + databaseDirectory.resolve("schema-test.sqlite3") + "?foreign_keys=on");
    }

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void createsLocalSchemaWithoutApplyingPostgresMigration() {
        assertThat(jdbc.queryForList("select name from sqlite_master where type = 'table'", String.class))
                .contains("users", "factures", "appro_budgets", "missions", "mission_history");
        assertThat(jdbc.queryForObject("select count(*) from roles", Integer.class)).isPositive();
        assertThat(jdbc.queryForObject(
                "select count(*) from databasechangelog where id = '010-postgres-instant-storage'", Integer.class))
                .isZero();
    }
}