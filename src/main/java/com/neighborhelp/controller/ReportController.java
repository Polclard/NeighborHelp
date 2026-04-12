package com.neighborhelp.controller;

import com.neighborhelp.dto.report.CreateReportRequest;
import com.neighborhelp.dto.report.ReportResponse;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/api/posts/{postId}/report")
    public ResponseEntity<ReportResponse> reportPost(
            Authentication authentication,
            @PathVariable UUID postId,
            @Valid @RequestBody CreateReportRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.reportPost(user.getId(), postId, request));
    }

    @PostMapping("/api/reviews/{reviewId}/report")
    public ResponseEntity<ReportResponse> reportReview(
            Authentication authentication,
            @PathVariable UUID reviewId,
            @Valid @RequestBody CreateReportRequest request
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.reportReview(user.getId(), reviewId, request));
    }
}