package com.neighborhelp.service;

import com.neighborhelp.dto.admin.AdminDashboardStatsResponse;
import com.neighborhelp.dto.admin.AdminReportResponse;
import com.neighborhelp.dto.admin.AdminUserResponse;
import com.neighborhelp.dto.post.ServicePostSummaryResponse;

import java.util.List;
import java.util.UUID;

public interface AdminService {

    AdminDashboardStatsResponse getDashboardStats();

    List<AdminUserResponse> getUsers();

    AdminUserResponse banUser(UUID adminUserId, UUID targetUserId);

    AdminUserResponse unbanUser(UUID adminUserId, UUID targetUserId);

    void softDeleteUser(UUID adminUserId, UUID targetUserId);

    List<AdminReportResponse> getOpenReports();

    AdminReportResponse resolveReport(UUID adminUserId, UUID reportId);

    List<ServicePostSummaryResponse> getPosts();

    void deletePost(UUID adminUserId, UUID postId);
}