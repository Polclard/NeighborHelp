package com.neighborhelp.repository;

import com.neighborhelp.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    List<Report> findAllByResolvedFalseOrderByCreatedAtAsc();
}