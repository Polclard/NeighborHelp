FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./

RUN chmod +x mvnw
RUN ./mvnw -q -DskipTests dependency:go-offline

COPY src src

RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -g 1001 -S neighborhelp \
    && adduser -u 1001 -S neighborhelp -G neighborhelp \
    && mkdir -p /var/neighborhelp/uploads \
    && chown -R neighborhelp:neighborhelp /app /var/neighborhelp

COPY --from=build /workspace/target/NeighborHelp-0.0.1-SNAPSHOT.jar /app/app.jar

ENV APP_UPLOAD_DIR=/var/neighborhelp/uploads

EXPOSE 8080

USER neighborhelp:neighborhelp

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
