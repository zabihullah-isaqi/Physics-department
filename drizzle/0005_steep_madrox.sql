CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text,
	`profile_type` text DEFAULT 'student' NOT NULL,
	`role` text DEFAULT 'learner' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`can_publish` integer DEFAULT 0 NOT NULL,
	`email_verified` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`required` integer DEFAULT 1 NOT NULL,
	`pass_percent` integer DEFAULT 70 NOT NULL,
	`attempt_limit` integer DEFAULT 0 NOT NULL,
	`due_at` text,
	`questions` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` text NOT NULL,
	`revision` integer NOT NULL,
	`answers` text NOT NULL,
	`score` integer NOT NULL,
	`passed` integer NOT NULL,
	`feedback` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `discussions` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`parent_id` text,
	`deleted` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lesson_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`complete` integer DEFAULT 0 NOT NULL,
	`reason` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`read_done` integer DEFAULT 0 NOT NULL,
	`watched` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`last_ping` text,
	`completed` text
);
--> statement-breakpoint
CREATE TABLE `media_links` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`content_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bio` text NOT NULL,
	`subjects` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`feedback` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `video_parts` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text NOT NULL,
	`part_number` integer NOT NULL,
	`etag` text NOT NULL,
	`size` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `video_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`lesson_id` text,
	`storage_key` text NOT NULL,
	`upload_id` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`fingerprint` text NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `content` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `files` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `files` ADD `storage_key` text;