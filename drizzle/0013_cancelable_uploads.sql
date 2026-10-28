ALTER TABLE `object_storage` ADD `upload_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `object_storage` ADD `operation_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `object_storage` ADD `write_protocol` text DEFAULT 'legacy-put' NOT NULL;