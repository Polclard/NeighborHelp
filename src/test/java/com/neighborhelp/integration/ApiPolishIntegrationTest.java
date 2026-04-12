package com.neighborhelp.integration;

import com.neighborhelp.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApiPolishIntegrationTest extends AbstractIntegrationTest {

    @Test
    void unauthorizedRequestsReturnStructuredErrorPayload() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication is required"))
                .andExpect(jsonPath("$.path").value("/api/users/me"));
    }

    @Test
    void bodyValidationReturnsReadableFieldMessages() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "",
                                  "lastName": "",
                                  "email": "not-an-email",
                                  "password": "short",
                                  "confirmPassword": "short",
                                  "phoneNumber": "abc@"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.validationErrors.firstName").value("First name is required"))
                .andExpect(jsonPath("$.validationErrors.lastName").value("Last name is required"))
                .andExpect(jsonPath("$.validationErrors.email").value("Email must be valid"))
                .andExpect(jsonPath("$.validationErrors.password").value("Password must be between 8 and 72 characters"))
                .andExpect(jsonPath("$.validationErrors.confirmPassword").value("Confirm password must be between 8 and 72 characters"))
                .andExpect(jsonPath("$.validationErrors.phoneNumber").value("Phone number contains invalid characters"));
    }

    @Test
    void requestParameterValidationUsesParameterNamesInErrorPayload() throws Exception {
        TestUserSession user = registerUser("constraint", "Constraint", "Tester", "+38970114060");

        mockMvc.perform(get("/api/conversations/{conversationId}/messages", UUID.randomUUID())
                        .header(HttpHeaders.AUTHORIZATION, bearer(user))
                        .param("page", "-1")
                        .param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Constraint validation failed"))
                .andExpect(jsonPath("$.validationErrors.page").value("Page must be 0 or greater"))
                .andExpect(jsonPath("$.validationErrors.size").value("Size must be between 1 and 100"));
    }

    @Test
    void malformedJsonReturnsConsistentBadRequestPayload() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Malformed request body"))
                .andExpect(jsonPath("$.path").value("/api/auth/login"));
    }

    @Test
    void corsPreflightAllowsConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type,authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }

    @Test
    void oversizedAvatarUploadIsRejectedWithReadableMessage() throws Exception {
        TestUserSession user = registerUser("oversized-avatar", "Big", "Avatar", "+38970114061");

        MockMultipartFile oversizedAvatar = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                new byte[5 * 1024 * 1024 + 1]
        );

        mockMvc.perform(multipart("/api/users/me/avatar")
                        .file(oversizedAvatar)
                        .header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Avatar file must be 5 MB or smaller"));
    }

    private String bearer(TestUserSession user) {
        return "Bearer " + user.accessToken();
    }
}
