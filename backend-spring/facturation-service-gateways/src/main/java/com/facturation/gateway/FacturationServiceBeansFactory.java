package com.facturation.gateway;

import com.facturation.gateway.inbound.RequestContextArgumentResolver;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EntityScan(basePackages = "com.facturation.gateway.outbound.entity")
@EnableJpaRepositories(basePackages = "com.facturation.gateway.outbound.repository")
public class FacturationServiceBeansFactory implements WebMvcConfigurer {

    private final String uploadsLocation;

    public FacturationServiceBeansFactory(@Value("${app.storage.uploads-dir}") String uploadsDir) {
        this.uploadsLocation = Paths.get(uploadsDir).toAbsolutePath().normalize().toUri().toString();
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new RequestContextArgumentResolver());
    }

    /** Pièces jointes déposées, exposées sous /uploads comme dans le backend Python. */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**").addResourceLocations(uploadsLocation);
    }
}
