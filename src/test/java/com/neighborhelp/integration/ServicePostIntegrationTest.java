package com.neighborhelp.integration;

import com.neighborhelp.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ServicePostIntegrationTest extends AbstractIntegrationTest {

    @Test
    void ownerCanCreateUploadFilterAndDeletePostPhotos() throws Exception {
        TestUserSession owner = registerUser("post-owner", "Post", "Owner", "+38970114020");
        TestUserSession otherUser = registerUser("post-other", "Other", "Owner", "+38970114021");

        String category = "Plumbing-" + UUID.randomUUID();
        String keyword = "Sink-" + UUID.randomUUID();

        MvcResult ownerPost = createPost(
                owner,
                """
                        {
                          "title": "%s",
                          "description": "Fix leaking kitchen sink",
                          "postType": "SERVICE_REQUEST",
                          "category": "%s",
                          "latitude": 41.9981,
                          "longitude": 21.4254,
                          "addressLabel": "Centar"
                        }
                        """.formatted(keyword, category)
        );

        String postId = readJson(ownerPost).get("id").asText();

        mockMvc.perform(post("/api/posts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Garden cleanup",
                                  "description": "Need help outside the city",
                                  "postType": "SERVICE_REQUEST",
                                  "category": "%s",
                                  "latitude": 41.2000,
                                  "longitude": 20.6000,
                                  "addressLabel": "Far away"
                                }
                                """.formatted(category)))
                .andExpect(status().isOk());

        MockMultipartFile photo = new MockMultipartFile(
                "file",
                "post.png",
                "image/png",
                "fake-post-photo".getBytes(StandardCharsets.UTF_8)
        );

        MvcResult uploadPhotoResult = mockMvc.perform(multipart("/api/posts/{postId}/photos", postId)
                        .file(photo)
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos", hasSize(1)))
                .andExpect(jsonPath("$.photos[0].filePath", startsWith("/uploads/posts/" + postId + "/")))
                .andReturn();

        String photoId = readJson(uploadPhotoResult).get("photos").get(0).get("id").asText();

        mockMvc.perform(get("/api/posts/{postId}", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REQUESTING"))
                .andExpect(jsonPath("$.contactPhone").value("+38970114020"))
                .andExpect(jsonPath("$.contactEmail").value(owner.email()))
                .andExpect(jsonPath("$.photos", hasSize(1)));

        mockMvc.perform(get("/api/posts")
                        .param("category", category))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(get("/api/posts/search")
                        .param("keyword", keyword))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(postId));

        mockMvc.perform(get("/api/posts/markers")
                        .param("category", category)
                        .param("latitude", "41.9981")
                        .param("longitude", "21.4254")
                        .param("radiusKm", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(postId));

        mockMvc.perform(get("/api/users/me/posts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(postId));

        mockMvc.perform(delete("/api/posts/{postId}/photos/{photoId}", postId, photoId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/posts/{postId}", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos", hasSize(0)));
    }

    @Test
    void requestLifecycleAndOwnershipRulesAreEnforced() throws Exception {
        TestUserSession requester = registerUser("requester", "Request", "Owner", "+38970114022");
        TestUserSession helper = registerUser("helper", "Helping", "Person", "+38970114023");

        MvcResult createResult = createPost(
                requester,
                """
                        {
                          "title": "Need furniture moved",
                          "description": "Looking for help with a sofa",
                          "postType": "SERVICE_REQUEST",
                          "category": "Moving",
                          "latitude": 41.9960,
                          "longitude": 21.4310,
                          "addressLabel": "Karpos"
                        }
                        """
        );

        String postId = readJson(createResult).get("id").asText();

        mockMvc.perform(post("/api/posts/{postId}/accept", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You cannot accept your own request"));

        mockMvc.perform(patch("/api/posts/{postId}/status", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "SERVICE_DONE"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Invalid status transition for service request"));

        mockMvc.perform(post("/api/posts/{postId}/accept", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(helper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SERVICE_ACCEPTED"))
                .andExpect(jsonPath("$.acceptedUserId").value(helper.userId()));

        mockMvc.perform(put("/api/posts/{postId}", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Updated title",
                                  "description": "Updated description",
                                  "category": "Moving",
                                  "latitude": 41.9960,
                                  "longitude": 21.4310,
                                  "addressLabel": "Karpos"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This request can no longer be modified"));

        mockMvc.perform(patch("/api/posts/{postId}/status", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(helper))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "SERVICE_DONE"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You can only modify your own posts"));

        mockMvc.perform(patch("/api/posts/{postId}/status", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "SERVICE_DONE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SERVICE_DONE"))
                .andExpect(jsonPath("$.acceptedUserId").value(helper.userId()));
    }

    private MvcResult createPost(TestUserSession user, String requestBody) throws Exception {
        return mockMvc.perform(post("/api/posts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andReturn();
    }

    private String bearer(TestUserSession user) {
        return "Bearer " + user.accessToken();
    }
}
