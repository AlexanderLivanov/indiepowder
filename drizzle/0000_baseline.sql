-- ═══════════════════════════════════════════════════════════════
--  BASELINE. Таблица `users` УЖЕ СУЩЕСТВУЕТ (её создал старый сайт)
--  и здесь НЕ создаётся. Мы только фиксируем её структуру в снимке
--  drizzle/meta/, чтобы будущие миграции считали разницу правильно.
--
--  Создаём только то, чего в базе ещё нет.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `user_identities` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`provider` varchar(32) NOT NULL,
	`provider_uid` varchar(190) NOT NULL,
	`email` varchar(190),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_identities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_identity_provider` ON `user_identities` (`provider`,`provider_uid`);
--> statement-breakpoint
CREATE INDEX `idx_identity_user` ON `user_identities` (`user_id`);
