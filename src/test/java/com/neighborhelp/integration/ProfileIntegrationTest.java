package com.neighborhelp.integration;

import com.neighborhelp.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProfileIntegrationTest extends AbstractIntegrationTest {

    @Test
    void authenticatedUserCanManageOwnAndPublicProfile() throws Exception {
        TestUserSession user = registerUser("profile", "Profile", "Tester", "+38970114010");
        String authorization = bearer(user);

        mockMvc.perform(get("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.userId()))
                .andExpect(jsonPath("$.email").value(user.email()))
                .andExpect(jsonPath("$.firstName").value("Profile"))
                .andExpect(jsonPath("$.reviewCount").value(0));

        mockMvc.perform(put("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": " Updated ",
                                  "lastName": " Person ",
                                  "phoneNumber": " +38970114011 ",
                                  "bio": " Helping nearby "
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.lastName").value("Person"))
                .andExpect(jsonPath("$.phoneNumber").value("+38970114011"))
                .andExpect(jsonPath("$.bio").value("Helping nearby"));

        MockMultipartFile avatar = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                "fake-png".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/users/me/avatar")
                        .file(avatar)
                        .header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePicture", startsWith("/uploads/avatars/")));

        mockMvc.perform(get("/api/profiles/{userId}", user.userId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.userId()))
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.lastName").value("Person"))
                .andExpect(jsonPath("$.bio").value("Helping nearby"))
                .andExpect(jsonPath("$.profilePicture", startsWith("/uploads/avatars/")))
                .andExpect(jsonPath("$.reviewCount").value(0));
    }

    @Test
    void invalidAvatarTypeIsRejected() throws Exception {
        TestUserSession user = registerUser("avatar", "Avatar", "Tester", "+38970114012");

        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "avatar.txt",
                "text/plain",
                "not-an-image".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/users/me/avatar")
                        .file(invalidFile)
                        .header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Avatar must be a JPG, PNG, or WEBP image"));
    }

    @Test
    void userCanChangeOwnPassword() throws Exception {
        TestUserSession user = registerUser("password", "Password", "Tester", "+38970114013");
        String authorization = bearer(user);
        String newPassword = "NewPassword456!";

        mockMvc.perform(put("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changePasswordBody("WrongPassword123!", newPassword, newPassword)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));

        mockMvc.perform(put("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changePasswordBody(PASSWORD, newPassword, "AnotherPassword789!")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Passwords do not match"));

        mockMvc.perform(put("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changePasswordBody(PASSWORD, PASSWORD, PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("New password must be different from the current password"));

        mockMvc.perform(put("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changePasswordBody(PASSWORD, newPassword, newPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", startsWith("Password changed successfully")));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(user.refreshCookie()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(user.email(), PASSWORD)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(user.email(), newPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(user.userId()));
    }

    @Test
    void shortNewPasswordIsRejected() throws Exception {
        TestUserSession user = registerUser("shortpassword", "Short", "Tester", "+38970114014");

        mockMvc.perform(put("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, bearer(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changePasswordBody(PASSWORD, "short", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.newPassword")
                        .value("Password must be between 8 and 72 characters"));
    }

    private String changePasswordBody(String currentPassword, String newPassword, String confirmPassword) {
        return """
                {
                  "currentPassword": "%s",
                  "newPassword": "%s",
                  "confirmPassword": "%s"
                }
                """.formatted(currentPassword, newPassword, confirmPassword);
    }

    private String loginBody(String email, String password) {
        return """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, password);
    }

    private String bearer(TestUserSession user) {
        return "Bearer " + user.accessToken();
    }
}
