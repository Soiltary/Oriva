ALTER TABLE `items` ADD `kind` text DEFAULT 'link' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `file_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `file_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `file_size` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `file_type` text DEFAULT '' NOT NULL;