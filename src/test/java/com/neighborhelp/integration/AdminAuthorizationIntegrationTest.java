package com.neighborhelp.integration;

import com.neighborhelp.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminAuthorizationIntegrationTest extends AbstractIntegrationTest {

    @Test
    void seededAdminCanAccessDashboard() throws Exception {
        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin@neighborhelp.local",
                                  "password": "Admin123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String adminToken = readAccessToken(adminLogin);

        mockMvc.perform(get("/api/admin/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActiveUsers").isNumber())
                .andExpect(jsonPath("$.activePosts").isNumber())
                .andExpect(jsonPath("$.unresolvedReports").isNumber());
    }

    @Test
    void normalUserGetsForbiddenForDashboard() throws Exception {
        String email = uniqueEmail("nonadmin");

        String registerBody = """
                {
                  "firstName": "Regular",
                  "lastName": "User",
                  "email": "%s",
                  "password": "Password123!",
                  "confirmPassword": "Password123!",
                  "phoneNumber": "+38970114003"
                }
                """.formatted(email);

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();

        String token = readAccessToken(registerResult);

        mockMvc.perform(get("/api/admin/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access is denied"));
    }
}
