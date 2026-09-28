CREATE TABLE `activity_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_key` text NOT NULL,
	`completed_at` integer NOT NULL
);
