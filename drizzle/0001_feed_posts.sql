-- ═══════════════════════════════════════════════════════════════
--  Раздел /feed (лента вдохновения, порт из StayInspired).
--  Новая таблица только для v3 — старый сайт о ней не знает.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `feed_posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`kind` varchar(16) NOT NULL DEFAULT 'note',
	`author_id` int,
	`author_name` varchar(190) NOT NULL,
	`author_handle` varchar(190) NOT NULL,
	`title` varchar(200),
	`body` text,
	`content` text,
	`media_type` varchar(16),
	`media_label` varchar(190),
	`up` int NOT NULL DEFAULT 0,
	`replies` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `feed_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_feed_created` ON `feed_posts` (`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_feed_author` ON `feed_posts` (`author_id`);
