spring boot

backend cree: backend-spring/

microservice (multi-modules maven):
- api
- core
- gateways

stack:
- java 21
- liquibase
- swagger
- sqlite

run:
cd backend-spring
mvn -pl api -am spring-boot:run

swagger:
http://localhost:8080/swagger-ui.html

