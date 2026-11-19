CREATE TABLE `editor_drafts` (
	`target_id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `editor_history` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`target_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`action` text NOT NULL,
	`created` text NOT NULL
);
