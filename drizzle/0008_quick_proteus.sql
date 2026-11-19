CREATE TABLE `translation_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `translations` ADD `origin` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `translations` ADD `published` integer DEFAULT 0 NOT NULL;