package com.facturation.api;

import com.facturation.gateways.GatewaysMarker;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackageClasses = {FacturationApiApplication.class, GatewaysMarker.class})
public class FacturationApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(FacturationApiApplication.class, args);
    }
}
