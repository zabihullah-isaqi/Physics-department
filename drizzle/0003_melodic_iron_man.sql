CREATE TABLE `translation_segments` (
	`id` text PRIMARY KEY NOT NULL,
	`translated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `translation_usage` (
	`day` text PRIMARY KEY NOT NULL,
	`characters` integer DEFAULT 0 NOT NULL,
	`retry_after` text
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` text PRIMARY KEY NOT NULL,
	`target_id` text NOT NULL,
	`field` text NOT NULL,
	`lang` text NOT NULL,
	`source_hash` text NOT NULL,
	`translated` text DEFAULT '' NOT NULL,
	`locked` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
