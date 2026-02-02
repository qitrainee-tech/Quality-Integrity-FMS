-- Migration: add uploaded_by column and foreign key to documents_tbl
-- Backup your DB before running.

ALTER TABLE documents_tbl
  ADD COLUMN `uploaded_by` INT NULL AFTER `document_type`;

ALTER TABLE documents_tbl
  ADD CONSTRAINT `fk_documents_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- You may want to create an index as well:
CREATE INDEX idx_documents_uploaded_by ON documents_tbl (uploaded_by);
