package com.neighborhelp.service.impl;

import com.neighborhelp.dto.admin.AdminDashboardStatsResponse;
import com.neighborhelp.dto.admin.AdminReportResponse;
import com.neighborhelp.dto.admin.AdminUserResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.exception.ConflictException;
import com.neighborhelp.exception.NotFoundException;
import com.neighborhelp.model.Report;
import com.neighborhelp.model.Review;
import com.neighborhelp.model.Role;
import com.neighborhelp.model.ServicePost;
import com.neighborhelp.model.User;
import com.neighborhelp.repository.ReportRepository;
import com.neighborhelp.repository.ReviewRepository;
import com.neighborhelp.repository.ServicePostRepository;
import com.neighborhelp.repository.UserRepository;
import com.neighborhelp.service.AdminService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ServicePostRepository servicePostRepository;
    private final ReviewRepository reviewRepository;
    private final ReportRepository reportRepository;

    public AdminServiceImpl(
            UserRepository userRepository,
            ServicePostRepository servicePostRepository,
            ReviewRepository reviewRepository,
            ReportRepository reportRepository
    ) {
        this.userRepository = userRepository;
        this.servicePostRepository = servicePostRepository;
        this.reviewRepository = reviewRepository;
        this.reportRepository = reportRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats() {
        return new AdminDashboardStatsResponse(
                userRepository.countByDeletedAtIsNull(),
                userRepository.countByIsBannedTrueAndDeletedAtIsNull(),
                servicePostRepository.countByDeletedAtIsNull(),
                reviewRepository.countByDeletedAtIsNull(),
                reportRepository.countByResolvedFalse()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        return userRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream()
                .map(this::toAdminUserResponse)
                .toList();
    }

    @Override
    public AdminUserResponse banUser(UUID adminUserId, UUID targetUserId) {
        User targetUser = getActiveUser(targetUserId);
        validateAdminAction(adminUserId, targetUser);

        targetUser.setIsBanned(true);
        return toAdminUserResponse(targetUser);
    }

    @Override
    public AdminUserResponse unbanUser(UUID adminUserId, UUID targetUserId) {
        User targetUser = getActiveUser(targetUserId);
        validateAdminAction(adminUserId, targetUser);

        targetUser.setIsBanned(false);
        return toAdminUserResponse(targetUser);
    }

    @Override
    public void softDeleteUser(UUID adminUserId, UUID targetUserId) {
        User targetUser = getActiveUser(targetUserId);
        validateAdminAction(adminUserId, targetUser);

        targetUser.setDeletedAt(OffsetDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminReportResponse> getOpenReports() {
        return reportRepository.findAllByResolvedFalseOrderByCreatedAtAsc()
                .stream()
                .map(this::toAdminReportResponse)
                .toList();
    }

    @Override
    public AdminReportResponse resolveReport(UUID adminUserId, UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found"));

        if (Boolean.TRUE.equals(report.getResolved())) {
            throw new ConflictException("Report is already resolved");
        }

        report.setResolved(true);
        report.setResolvedBy(adminUserId);
        report.setResolvedAt(OffsetDateTime.now());

        return toAdminReportResponse(report);
    }

    @Override
    @Transactional
    public List<ServicePostSummaryResponse> getPosts() {
        return servicePostRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream()
                .map(this::toPostSummaryResponse)
                .toList();
    }

    @Override
    public void deletePost(UUID adminUserId, UUID postId) {
        getActiveUser(adminUserId);

        ServicePost post = servicePostRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        post.setDeletedAt(OffsetDateTime.now());
    }

    private ServicePostSummaryResponse toPostSummaryResponse(ServicePost post) {
        return new ServicePostSummaryResponse(
                post.getId(),
                post.getUserId(),
                post.getTitle(),
                post.getDescription(),
                post.getPostType(),
                post.getStatus(),
                post.getCategory(),
                post.getLatitude(),
                post.getLongitude(),
                post.getAddressLabel(),
                post.getCreatedAt()
        );
    }

    private AdminReportResponse toAdminReportResponse(Report report) {
        return new AdminReportResponse(
                report.getId(),
                report.getReporterId(),
                resolveReporterEmail(report.getReporterId()),
                report.getReportedPostId(),
                resolveReportedPostTitle(report.getReportedPostId()),
                report.getReportedReviewId(),
                resolveReportedReviewRating(report.getReportedReviewId()),
                resolveReportedReviewComment(report.getReportedReviewId()),
                report.getReason(),
                report.getResolved(),
                report.getResolvedBy(),
                report.getResolvedAt(),
                report.getCreatedAt()
        );
    }

    private String resolveReporterEmail(UUID reporterId) {
        return userRepository.findById(reporterId)
                .map(User::getEmail)
                .orElse(null);
    }

    private String resolveReportedPostTitle(UUID reportedPostId) {
        if (reportedPostId == null) {
            return null;
        }

        return servicePostRepository.findById(reportedPostId)
                .map(ServicePost::getTitle)
                .orElse(null);
    }

    private Integer resolveReportedReviewRating(UUID reportedReviewId) {
        if (reportedReviewId == null) {
            return null;
        }

        return reviewRepository.findById(reportedReviewId)
                .map(Review::getRating)
                .orElse(null);
    }

    private String resolveReportedReviewComment(UUID reportedReviewId) {
        if (reportedReviewId == null) {
            return null;
        }

        return reviewRepository.findById(reportedReviewId)
                .map(Review::getComment)
                .orElse(null);
    }

    private User getActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void validateAdminAction(UUID adminUserId, User targetUser) {
        if (adminUserId.equals(targetUser.getId())) {
            throw new ConflictException("You cannot perform this action on your own account");
        }

        if (targetUser.getRole() == Role.ROLE_ADMIN) {
            throw new ConflictException("Admin accounts cannot be moderated by this endpoint");
        }
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getIsBanned(),
                user.getCreatedAt(),
                user.getDeletedAt()
        );
    }
}