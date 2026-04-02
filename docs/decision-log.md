# Decision Log

## 2026-04-01

### Spring Boot baseline
- Decision: keep Spring Boot 4.0.5 as the project baseline.
- Reason: the current project scaffold already uses it and we decided not to downgrade.
- Consequence: whenever README examples differ from Spring Boot 4 behavior, implementation and docs must follow Spring Boot 4.

### Base package
- Decision: use `com.neighborhelp` as the base package and Maven groupId.
- Reason: it matches the project name and is cleaner than `com.application`.
- Consequence: all future Java packages should start from `com.neighborhelp`.

### Configuration format
- Decision: use YAML configuration files instead of `.properties`.
- Reason: profile-based configuration is easier to read and maintain in YAML.
- Consequence: environment-specific settings will live in `application-<profile>.yml`.

### Current startup strategy
- Decision: temporarily exclude datasource and JPA auto-configuration in `dev` and `test`.
- Reason: PostgreSQL and Flyway are not configured yet, but the app must still compile, test, and boot cleanly.
- Consequence: these exclusions must be removed once database infrastructure and datasource config are added.

### Local development infrastructure
- Decision: use Docker Compose for PostgreSQL and Mailpit in local development.
- Reason: it gives a reproducible setup without requiring manual local installation.
- Consequence: the `dev` profile now expects Docker-managed infrastructure to be available.

### Local PostgreSQL port
- Decision: use host port `5433` for the Docker PostgreSQL service in development.
- Reason: this machine already has another PostgreSQL instance listening on `5432`, which causes the app to connect to the wrong server.
- Consequence: local Docker-based development must use `localhost:5433` unless overridden explicitly.
