# Stage 1: Build
FROM maven:3.8.8-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY user-service/pom.xml user-service/
COPY api-gateway/pom.xml api-gateway/
COPY race-service/pom.xml race-service/
RUN mvn dependency:go-offline -B -pl user-service
COPY user-service/src user-service/src
RUN mvn package -DskipTests -pl user-service -am

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/user-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
