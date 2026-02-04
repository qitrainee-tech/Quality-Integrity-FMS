-- Migration 005: add access_level to documents_tbl
ALTER TABLE `documents_tbl`
  ADD COLUMN `access_level` ENUM('Admin Only','Public') NOT NULL DEFAULT 'Admin Only' AFTER `description`;
