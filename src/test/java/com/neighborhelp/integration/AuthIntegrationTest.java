package com.neighborhelp.integration;

import com.neighborhelp.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void registerRefreshLogoutFlowWorks() throws Exception {
        String email = uniqueEmail("auth");

        String registerBody = """
                {
                  "firstName": "Auth",
                  "lastName": "Tester",
                  "email": "%s",
                  "password": "Password123!",
                  "confirmPassword": "Password123!",
                  "phoneNumber": "+38970114001"
                }
                """.formatted(email);

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(cookie().exists("neighborhelp_refresh_token"))
                .andReturn();

        Cookie refreshCookie = readRefreshCookie(registerResult);

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(cookie().exists("neighborhelp_refresh_token"))
                .andReturn();

        Cookie refreshedCookie = readRefreshCookie(refreshResult);

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(refreshedCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshedCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginReturnsJwtAndRefreshCookie() throws Exception {
        String email = uniqueEmail("login");

        String registerBody = """
                {
                  "firstName": "Login",
                  "lastName": "Tester",
                  "email": "%s",
                  "password": "Password123!",
                  "confirmPassword": "Password123!",
                  "phoneNumber": "+38970114002"
                }
                """.formatted(email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated());

        String loginBody = """
                {
                  "email": "%s",
                  "password": "Password123!"
                }
                """.formatted(email);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(cookie().exists("neighborhelp_refresh_token"));
    }
}
