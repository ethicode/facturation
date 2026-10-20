rootProject.name = "facturation-service"

listOf(
    "facturation-service-gateways",
    "facturation-service-api",
    "facturation-service-core"
).forEach {
    include(":${it}")
}
