CREATE TABLE `slide_decks` (
	`chapter_id` text PRIMARY KEY NOT NULL,
	`draft_json` text DEFAULT '[]' NOT NULL,
	`published_json` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL,
	`published_at` text
);
