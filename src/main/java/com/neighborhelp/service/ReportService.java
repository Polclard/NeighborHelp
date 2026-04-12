package com.neighborhelp.service;

import com.neighborhelp.dto.report.CreateReportRequest;
import com.neighborhelp.dto.report.ReportResponse;

import java.util.UUID;

public interface ReportService {

    ReportResponse reportPost(UUID reporterId, UUID postId, CreateReportRequest request);

    ReportResponse reportReview(UUID reporterId, UUID reviewId, CreateReportRequest request);
}