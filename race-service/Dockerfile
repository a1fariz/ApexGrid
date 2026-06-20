# Stage 1: Build
FROM maven:3.8.8-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY user-service/pom.xml user-service/
COPY api-gateway/pom.xml api-gateway/
COPY race-service/pom.xml race-service/
RUN mvn dependency:go-offline -B -pl race-service
COPY race-service/src race-service/src
RUN mvn package -DskipTests -pl race-service -am

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/race-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
