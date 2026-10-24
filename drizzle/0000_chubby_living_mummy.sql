CREATE TABLE `attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`collection` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'inbox' NOT NULL,
	`favorite` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `items_owner` ON `items` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `items_owner_url` ON `items` (`user_id`,`url`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`recovery_hash` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);