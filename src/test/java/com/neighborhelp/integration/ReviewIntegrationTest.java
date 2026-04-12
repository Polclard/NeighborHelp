package com.neighborhelp.integration;

import com.neighborhelp.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReviewIntegrationTest extends AbstractIntegrationTest {

    @Test
    void requesterCanReviewCompletedServiceAndSeeItOnHelperProfile() throws Exception {
        TestUserSession requester = registerUser("review-requester", "Review", "Requester", "+38970114030");
        TestUserSession helper = registerUser("review-helper", "Helpful", "Neighbor", "+38970114031");

        String postId = createAcceptedRequest(requester, helper);

        completeRequest(requester, postId);

        mockMvc.perform(post("/api/posts/{postId}/reviews", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 5,
                                  "comment": "Arrived on time and finished everything"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.postId").value(postId))
                .andExpect(jsonPath("$.reviewerId").value(requester.userId()))
                .andExpect(jsonPath("$.reviewedUserId").value(helper.userId()))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Arrived on time and finished everything"));

        mockMvc.perform(get("/api/profiles/{userId}", helper.userId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(5.0))
                .andExpect(jsonPath("$.reviewCount").value(1));

        mockMvc.perform(get("/api/profiles/{userId}/reviews", helper.userId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].reviewerId").value(requester.userId()))
                .andExpect(jsonPath("$[0].reviewerFirstName").value("Review"))
                .andExpect(jsonPath("$[0].rating").value(5))
                .andExpect(jsonPath("$[0].comment").value("Arrived on time and finished everything"));
    }

    @Test
    void reviewRulesRejectPrematureUnauthorizedAndDuplicateReviews() throws Exception {
        TestUserSession requester = registerUser("review-rules", "Rules", "Requester", "+38970114032");
        TestUserSession helper = registerUser("review-rules-helper", "Rules", "Helper", "+38970114033");

        String postId = createAcceptedRequest(requester, helper);

        mockMvc.perform(post("/api/posts/{postId}/reviews", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 4,
                                  "comment": "Too early"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You can only review after the service is marked done"));

        completeRequest(requester, postId);

        mockMvc.perform(post("/api/posts/{postId}/reviews", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(helper))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 4,
                                  "comment": "Wrong person"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only the requester can leave a review"));

        mockMvc.perform(post("/api/posts/{postId}/reviews", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 4,
                                  "comment": "Solid help"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/posts/{postId}/reviews", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 4,
                                  "comment": "Second review"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You have already reviewed this completed service"));
    }

    private String createAcceptedRequest(TestUserSession requester, TestUserSession helper) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/posts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Need help carrying boxes",
                                  "description": "Second floor apartment move",
                                  "postType": "SERVICE_REQUEST",
                                  "category": "Moving",
                                  "latitude": 42.0000,
                                  "longitude": 21.4300,
                                  "addressLabel": "Debar Maalo"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String postId = readJson(createResult).get("id").asText();

        mockMvc.perform(post("/api/posts/{postId}/accept", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(helper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SERVICE_ACCEPTED"))
                .andExpect(jsonPath("$.acceptedUserId").value(helper.userId()));

        return postId;
    }

    private void completeRequest(TestUserSession requester, String postId) throws Exception {
        mockMvc.perform(patch("/api/posts/{postId}/status", postId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(requester))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "SERVICE_DONE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SERVICE_DONE"));
    }

    private String bearer(TestUserSession user) {
        return "Bearer " + user.accessToken();
    }
}
