CREATE TABLE `restore_admissions` (
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`hash` text NOT NULL,
	`metadata_bytes` integer NOT NULL,
	`blob_bytes` integer NOT NULL,
	PRIMARY KEY(`session_id`, `sequence`)
);
--> statement-breakpoint
CREATE INDEX `restore_admissions_owner` ON `restore_admissions` (`user_id`);--> statement-breakpoint
ALTER TABLE `restore_sessions` ADD `cleanup_state` text DEFAULT '' NOT NULL;