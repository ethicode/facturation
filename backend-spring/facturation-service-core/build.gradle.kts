plugins {
    `java-library`
}

dependencies {
    api(project(":facturation-service-api"))
    implementation("org.springframework:spring-context")
    implementation("org.springframework:spring-tx")
}
