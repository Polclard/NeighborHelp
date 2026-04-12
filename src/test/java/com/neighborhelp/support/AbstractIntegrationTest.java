package com.neighborhelp.support;

import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    protected static final String PASSWORD = "Password123!";

    private static final String DB_HOST = System.getenv().getOrDefault("DB_HOST", "localhost");
    private static final String DB_PORT = System.getenv().getOrDefault("DB_PORT", "5433");
    private static final String DB_USERNAME = System.getenv().getOrDefault("DB_USERNAME", "postgres");
    private static final String DB_PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", "postgres");
    private static final String TEST_DB_NAME = "neighborhelp_test_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        ensureTestDatabaseExists();

        registry.add("spring.datasource.url", () -> "jdbc:postgresql://%s:%s/%s".formatted(DB_HOST, DB_PORT, TEST_DB_NAME));
        registry.add("spring.datasource.username", () -> DB_USERNAME);
        registry.add("spring.datasource.password", () -> DB_PASSWORD);
        registry.add("app.upload.dir", () -> "./var/uploads-test/" + TEST_DB_NAME);
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected String uniqueEmail(String prefix) {
        return prefix + "." + UUID.randomUUID() + "@example.com";
    }

    protected TestUserSession registerUser(
            String prefix,
            String firstName,
            String lastName,
            String phoneNumber
    ) throws Exception {
        String email = uniqueEmail(prefix);

        String registerBody = """
                {
                  "firstName": "%s",
                  "lastName": "%s",
                  "email": "%s",
                  "password": "%s",
                  "confirmPassword": "%s",
                  "phoneNumber": "%s"
                }
                """.formatted(firstName, lastName, email, PASSWORD, PASSWORD, phoneNumber);

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();

        return new TestUserSession(
                email,
                readAccessToken(registerResult),
                readUserId(registerResult),
                readRefreshCookie(registerResult)
        );
    }

    protected JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    protected String readAccessToken(MvcResult result) throws Exception {
        JsonNode body = readJson(result);
        return body.get("accessToken").asText();
    }

    protected String readUserId(MvcResult result) throws Exception {
        JsonNode body = readJson(result);
        return body.get("user").get("id").asText();
    }

    protected Cookie readRefreshCookie(MvcResult result) {
        return result.getResponse().getCookie("neighborhelp_refresh_token");
    }

    private static void ensureTestDatabaseExists() {
        String adminJdbcUrl = "jdbc:postgresql://%s:%s/postgres".formatted(DB_HOST, DB_PORT);

        try (
                Connection connection = DriverManager.getConnection(adminJdbcUrl, DB_USERNAME, DB_PASSWORD);
                Statement statement = connection.createStatement()
        ) {
            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT 1 FROM pg_database WHERE datname = '" + TEST_DB_NAME + "'"
            )) {
                if (!resultSet.next()) {
                    statement.executeUpdate("CREATE DATABASE " + TEST_DB_NAME);
                }
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to create integration test database", exception);
        }
    }

    protected record TestUserSession(
            String email,
            String accessToken,
            String userId,
            Cookie refreshCookie
    ) {
    }
}
