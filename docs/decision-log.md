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