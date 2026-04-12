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

    private String bearer(TestUserSession user) {
        return "Bearer " + user.accessToken();
    }
}
