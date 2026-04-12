package com.neighborhelp.controller;

import com.neighborhelp.dto.admin.AdminDashboardStatsResponse;
import com.neighborhelp.dto.admin.AdminReportResponse;
import com.neighborhelp.dto.admin.AdminUserResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;
import com.neighborhelp.security.AuthenticatedUser;
import com.neighborhelp.service.AdminService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@Profile("!test")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/api/admin/dashboard")
    public AdminDashboardStatsResponse getDashboardStats() {
        return adminService.getDashboardStats();
    }

    @GetMapping("/api/admin/users")
    public List<AdminUserResponse> getUsers() {
        return adminService.getUsers();
    }

    @GetMapping("/api/admin/reports")
    public List<AdminReportResponse> getOpenReports() {
        return adminService.getOpenReports();
    }

    @PatchMapping("/api/admin/users/{userId}/ban")
    public AdminUserResponse banUser(Authentication authentication, @PathVariable UUID userId) {
        AuthenticatedUser admin = (AuthenticatedUser) authentication.getPrincipal();
        return adminService.banUser(admin.getId(), userId);
    }

    @PatchMapping("/api/admin/users/{userId}/unban")
    public AdminUserResponse unbanUser(Authentication authentication, @PathVariable UUID userId) {
        AuthenticatedUser admin = (AuthenticatedUser) authentication.getPrincipal();
        return adminService.unbanUser(admin.getId(), userId);
    }

    @DeleteMapping("/api/admin/users/{userId}")
    public ResponseEntity<Void> softDeleteUser(Authentication authentication, @PathVariable UUID userId) {
        AuthenticatedUser admin = (AuthenticatedUser) authentication.getPrincipal();
        adminService.softDeleteUser(admin.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/admin/reports/{reportId}/resolve")
    public AdminReportResponse resolveReport(Authentication authentication, @PathVariable UUID reportId) {
        AuthenticatedUser admin = (AuthenticatedUser) authentication.getPrincipal();
        return adminService.resolveReport(admin.getId(), reportId);
    }

    @GetMapping("/api/admin/posts")
    public List<ServicePostSummaryResponse> getPosts() {
        return adminService.getPosts();
    }

    @DeleteMapping("/api/admin/posts/{postId}")
    public ResponseEntity<Void> deletePost(Authentication authentication, @PathVariable UUID postId) {
        AuthenticatedUser admin = (AuthenticatedUser) authentication.getPrincipal();
        adminService.deletePost(admin.getId(), postId);
        return ResponseEntity.noContent().build();
    }
}