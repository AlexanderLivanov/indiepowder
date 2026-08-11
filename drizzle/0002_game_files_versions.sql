-- ═══════════════════════════════════════════════════════════════
--  Доп-файлы игры (саундтрек/артбук/README) и версии сборок.
--  Новые v3-таблицы — старый сайт о них не знает.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `game_files` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`game_id` int NOT NULL,
	`kind` varchar(16) NOT NULL DEFAULT 'extra',
	`title` varchar(190) NOT NULL,
	`url` varchar(500) NOT NULL,
	`size` int,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `game_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_gamefiles_game` ON `game_files` (`game_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `game_versions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`game_id` int NOT NULL,
	`version` varchar(64) NOT NULL,
	`channel` varchar(16) NOT NULL DEFAULT 'stable',
	`url` varchar(500) NOT NULL,
	`size` int,
	`notes` text,
	`is_current` tinyint NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `game_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_gameversions_game` ON `game_versions` (`game_id`);
