-- Migration: create documents_tbl
-- Creates table to store uploaded documents and metadata
-- Backup your DB before running.

CREATE TABLE IF NOT EXISTS `documents_tbl` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `document_name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `department` VARCHAR(255) DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `document_size` BIGINT DEFAULT NULL,
  `document_type` VARCHAR(100) DEFAULT NULL,
  `document_blob` LONGBLOB DEFAULT NULL,
  `uploaded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Notes:
-- - `document_type` is intended for MIME type (e.g. application/pdf).
-- - `document_blob` holds the binary file (optional if you plan to store files on disk instead).
