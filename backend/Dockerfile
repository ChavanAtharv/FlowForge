# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy Maven descriptor and resolve dependencies to leverage layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and package the Spring Boot JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jdk-alpine

VOLUME /tmp

ARG JAR_FILE=/build/target/*.jar
COPY --from=builder ${JAR_FILE} app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]

