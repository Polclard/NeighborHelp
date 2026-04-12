package com.neighborhelp.dto.admin;

public record AdminDashboardStatsResponse(
        long totalActiveUsers,
        long bannedUsers,
        long activePosts,
        long activeReviews,
        long unresolvedReports
) {
}
