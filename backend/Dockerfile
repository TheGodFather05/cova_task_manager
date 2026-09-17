FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline
COPY src ./src
RUN ./mvnw -B -q clean package -DskipTests

FROM eclipse-temurin:21-jre AS runtime
RUN groupadd --system spring && useradd --system --gid spring spring
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
USER spring
EXPOSE 8080
# report date functions run in the JDBC session zone; the JVM must agree or aggregates shift
ENV TZ=UTC
ENTRYPOINT ["java", "-jar", "app.jar"]
