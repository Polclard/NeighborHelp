# Local Setup Checklist

## Required tools
- Java 21
- Maven Wrapper (`./mvnw`)
- Node.js 20+
- npm or pnpm
- Docker
- Docker Compose

## Verify locally
- `java -version`
- `./mvnw -v`
- `node -v`
- `npm -v`
- `docker --version`
- `docker compose version`

## Project baseline decisions
- Spring Boot 4.0.5
- Java 21
- PostgreSQL as primary database
- Flyway for all schema changes
- JWT for authentication
- Spring WebSocket + STOMP for real-time chat
- OpenAPI via springdoc
- Frontend will later live in `/frontend`

## Secrets and config we will need soon
- Database host, port, name, username, password
- JWT secret
- Access token lifetime
- Refresh token lifetime
- Upload directory
- Allowed CORS origins
- Allowed WebSocket origins
- OpenRouteService API key