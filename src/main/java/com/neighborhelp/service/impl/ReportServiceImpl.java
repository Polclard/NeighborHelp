package com.neighborhelp.service.impl;

import com.neighborhelp.dto.report.CreateReportRequest;
import com.neighborhelp.dto.report.ReportResponse;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.Report;
import com.neighborhelp.model.Review;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.repository.ReportRepository;
import com.neighborhelp.repository.ReviewRepository;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.ReportService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@Profile("!test")
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final ServicePostRepository servicePostRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReportServiceImpl(
            ReportRepository reportRepository,
            ServicePostRepository servicePostRepository,
            ReviewRepository reviewRepository,
            UserRepository userRepository
    ) {
        this.reportRepository = reportRepository;
        this.servicePostRepository = servicePostRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ReportResponse reportPost(UUID reporterId, UUID postId, CreateReportRequest request) {
        ensureActiveUser(reporterId);

        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (post.getUserId().equals(reporterId)) {
            throw new ConflictException("You cannot report your own post");
        }

        if (reportRepository.existsByReporterIdAndReportedPostIdAndResolvedFalse(reporterId, postId)) {
            throw new ConflictException("You already have an open report for this post");
        }

        Report report = new Report();
        report.setReporterId(reporterId);
        report.setReportedPostId(postId);
        report.setReason(normalizeReason(request.reason()));

        return toResponse(reportRepository.save(report));
    }

    @Override
    public ReportResponse reportReview(UUID reporterId, UUID reviewId, CreateReportRequest request) {
        ensureActiveUser(reporterId);

        Review review = reviewRepository.findByIdAndDeletedAtIsNull(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        if (review.getReviewerId().equals(reporterId)) {
            throw new ConflictException("You cannot report your own review");
        }

        if (reportRepository.existsByReporterIdAndReportedReviewIdAndResolvedFalse(reporterId, reviewId)) {
            throw new ConflictException("You already have an open report for this review");
        }

        Report report = new Report();
        report.setReporterId(reporterId);
        report.setReportedReviewId(reviewId);
        report.setReason(normalizeReason(request.reason()));

        return toResponse(reportRepository.save(report));
    }

    private void ensureActiveUser(UUID userId) {
        userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private String normalizeReason(String reason) {
        String trimmed = reason.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Report reason must not be blank");
        }
        return trimmed;
    }

    private ReportResponse toResponse(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReporterId(),
                report.getReportedPostId(),
                report.getReportedReviewId(),
                report.getReason(),
                report.getResolved(),
                report.getCreatedAt()
        );
    }
}