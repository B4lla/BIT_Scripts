SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `bit_phone`;
DROP TABLE IF EXISTS `bit_phone_notes`;
DROP TABLE IF EXISTS `bit_phone_photos`;
DROP TABLE IF EXISTS `bit_phone_music_playlists`;
DROP TABLE IF EXISTS `bit_phone_music_songs`;
DROP TABLE IF EXISTS `bit_phone_music_playlist_songs`;
DROP TABLE IF EXISTS `bit_phone_music_recent_plays`;
DROP TABLE IF EXISTS `bit_phone_contacts`;
DROP TABLE IF EXISTS `bit_phone_call_history`;
DROP TABLE IF EXISTS `bit_phone_voicemails`;
DROP TABLE IF EXISTS `bit_phone_blocked_numbers`;
DROP TABLE IF EXISTS `bit_phone_news_articles`;
DROP TABLE IF EXISTS `bit_phone_news`;
DROP TABLE IF EXISTS `bit_phone_bitlove_profiles`;
DROP TABLE IF EXISTS `bit_phone_bitlove_swipes`;
DROP TABLE IF EXISTS `bit_phone_bitlove_matches`;
DROP TABLE IF EXISTS `bit_phone_bitlove_messages`;
DROP TABLE IF EXISTS `bit_phone_bitlove_reports`;
DROP TABLE IF EXISTS `bit_phone_business_listings`;
DROP TABLE IF EXISTS `bit_phone_business_reviews`;
DROP TABLE IF EXISTS `bit_phone_crypto_holdings`;
DROP TABLE IF EXISTS `bit_phone_crypto_watchlist`;
DROP TABLE IF EXISTS `bit_phone_crypto_transactions`;
DROP TABLE IF EXISTS `bit_phone_bank_pending`;
DROP TABLE IF EXISTS `bit_phone_bank_transactions`;
DROP TABLE IF EXISTS `bit_phone_instagram_accounts`;
DROP TABLE IF EXISTS `bit_phone_instagram_profiles`;
DROP TABLE IF EXISTS `bit_phone_instagram_posts`;
DROP TABLE IF EXISTS `bit_phone_instagram_follows`;
DROP TABLE IF EXISTS `bit_phone_instagram_comments`;
DROP TABLE IF EXISTS `bit_phone_instagram_likes`;
DROP TABLE IF EXISTS `bit_phone_darkweb_users`;
DROP TABLE IF EXISTS `bit_phone_darkweb_rooms`;
DROP TABLE IF EXISTS `bit_phone_darkweb_room_members`;
DROP TABLE IF EXISTS `bit_phone_darkweb_messages`;
DROP TABLE IF EXISTS `bit_phone_darkweb_marketplace`;
DROP TABLE IF EXISTS `bit_phone_darkweb_purchases`;
DROP TABLE IF EXISTS `bit_phone_darkweb_reviews`;
DROP TABLE IF EXISTS `bit_phone_contact_list`;
DROP TABLE IF EXISTS `bit_phone_chats`;
DROP TABLE IF EXISTS `bit_phone_chat_participants`;
DROP TABLE IF EXISTS `bit_phone_messages`;
DROP TABLE IF EXISTS `bit_phone_message_reactions`;
DROP TABLE IF EXISTS `bit_phone_message_status`;
DROP TABLE IF EXISTS `bit_phone_calendar_events`;
DROP TABLE IF EXISTS `bit_phone_tuister_users`;
DROP TABLE IF EXISTS `bit_phone_tuister_tweets`;
DROP TABLE IF EXISTS `bit_phone_tuister_follows`;
DROP TABLE IF EXISTS `bit_phone_tuister_likes`;
DROP TABLE IF EXISTS `bit_phone_tuister_comments`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `bit_phone` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `setup_completed` BOOLEAN DEFAULT FALSE,
  `profile_name` VARCHAR(50) DEFAULT NULL,
  `profile_picture` TEXT DEFAULT NULL,
  `pin_code` CHAR(4) DEFAULT NULL,
  `battery_level` TINYINT UNSIGNED DEFAULT 100,
  `desktop_layout` JSON DEFAULT NULL,
  `installed_apps` JSON DEFAULT NULL,
  `dock_apps` JSON DEFAULT NULL,
  `folders` JSON DEFAULT NULL,
  `wallpaper` TEXT DEFAULT NULL,
  `theme_mode` ENUM('light', 'dark') DEFAULT 'light',
  `lockscreen_widgets` JSON DEFAULT NULL,
  `lockscreen_font_family` VARCHAR(50) DEFAULT NULL,
  `lockscreen_font_size` VARCHAR(20) DEFAULT NULL,
  `lockscreen_font_color` VARCHAR(20) DEFAULT NULL,
  `lockscreen_date_style` VARCHAR(50) DEFAULT NULL,
  `lockscreen_date_color` VARCHAR(20) DEFAULT NULL,
  `lockscreen_date_size` VARCHAR(20) DEFAULT NULL,
  `call_sound` TEXT,
  `notification_sound` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user` (`user`),
  INDEX `idx_phone_number` (`phone_number`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `note` LONGTEXT NOT NULL,
  `color` VARCHAR(20) DEFAULT '#FEF3C7',
  `is_pinned` BOOLEAN DEFAULT FALSE,
  `last_edited` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user`),
  INDEX `idx_pinned` (`user`, `is_pinned`),
  INDEX `idx_last_edited` (`user`, `last_edited` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `url` TEXT NOT NULL,
  `metadata` JSON DEFAULT NULL,
  `thumbnail_url` TEXT DEFAULT NULL,
  `caption` VARCHAR(500) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `file_size` BIGINT DEFAULT NULL,
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user`),
  INDEX `idx_created` (`user`, `created_at` DESC),
  INDEX `idx_favorite` (`user`, `is_favorite`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_music_playlists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `cover_image` TEXT DEFAULT NULL,
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_music_songs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `artist` VARCHAR(200) NOT NULL,
  `album` VARCHAR(200) DEFAULT NULL,
  `duration` VARCHAR(10) NOT NULL,
  `file_url` TEXT NOT NULL,
  `cover_image` TEXT DEFAULT NULL,
  `genre` VARCHAR(50) DEFAULT NULL,
  `year` INT DEFAULT NULL,
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `play_count` INT DEFAULT 0,
  `last_played` DATETIME DEFAULT NULL,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user`),
  INDEX `idx_favorite` (`user`, `is_favorite`),
  INDEX `idx_artist` (`artist`),
  INDEX `idx_genre` (`genre`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_music_playlist_songs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `playlist_id` INT NOT NULL,
  `song_id` INT NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`playlist_id`) REFERENCES `bit_phone_music_playlists`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`song_id`) REFERENCES `bit_phone_music_songs`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_playlist_song` (`playlist_id`, `song_id`),
  INDEX `idx_playlist` (`playlist_id`),
  INDEX `idx_song` (`song_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_music_recent_plays` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `song_id` INT NOT NULL,
  `played_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`song_id`) REFERENCES `bit_phone_music_songs`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_played` (`user`, `played_at` DESC),
  INDEX `idx_song` (`song_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `number` VARCHAR(20) NOT NULL,
  `avatar` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `blocked` BOOLEAN DEFAULT FALSE,
  `favorite` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user`),
  INDEX `idx_number` (`number`),
  INDEX `idx_favorite` (`user`, `favorite`),
  INDEX `idx_blocked` (`user`, `blocked`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_call_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `contact_name` VARCHAR(100) DEFAULT NULL,
  `number` VARCHAR(20) NOT NULL,
  `call_type` ENUM('audio', 'video') DEFAULT 'audio',
  `type` ENUM('incoming', 'outgoing', 'missed') NOT NULL,
  `duration` INT DEFAULT 0,
  `call_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('completed', 'missed', 'rejected') DEFAULT 'completed',
  INDEX `idx_user_time` (`user`, `call_time` DESC),
  INDEX `idx_number` (`number`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_voicemails` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `from_name` VARCHAR(100) DEFAULT NULL,
  `from_number` VARCHAR(20) NOT NULL,
  `message_url` TEXT DEFAULT NULL,
  `duration` INT DEFAULT 0,
  `listened` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_time` (`user`, `created_at` DESC),
  INDEX `idx_listened` (`user`, `listened`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_blocked_numbers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `number` VARCHAR(20) NOT NULL,
  `blocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_number` (`user`, `number`),
  INDEX `idx_user` (`user`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_news_articles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT DEFAULT NULL,
  `content` LONGTEXT NOT NULL,
  `image_url` TEXT DEFAULT NULL,
  `category` VARCHAR(50) DEFAULT 'General',
  `author` VARCHAR(100) NOT NULL,
  `author_identifier` VARCHAR(50) DEFAULT NULL,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `is_published` BOOLEAN DEFAULT TRUE,
  `tags` JSON DEFAULT NULL,
  `read_time` VARCHAR(10) DEFAULT '5 min',
  `views_count` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_published` (`is_published`, `published_at` DESC),
  INDEX `idx_featured` (`is_featured`),
  INDEX `idx_category` (`category`),
  INDEX `idx_author` (`author_identifier`),
  INDEX `idx_created` (`created_at` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `identifier` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `age` INT NOT NULL,
  `bio` TEXT DEFAULT NULL,
  `location` VARCHAR(100) DEFAULT NULL,
  `interests` TEXT DEFAULT NULL,
  `photos` JSON DEFAULT NULL,
  `job` VARCHAR(100) DEFAULT NULL,
  `looking_for` ENUM('casual', 'serious', 'friends', 'anything') DEFAULT 'anything',
  `distance_range` INT DEFAULT 50,
  `age_min` INT DEFAULT 18,
  `age_max` INT DEFAULT 99,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_premium` BOOLEAN DEFAULT FALSE,
  `super_likes_left` INT DEFAULT 5,
  `boost_expires_at` DATETIME DEFAULT NULL,
  `last_active` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_profile` (`identifier`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_location` (`location`),
  INDEX `idx_age` (`age`),
  INDEX `idx_last_active` (`last_active` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_swipes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_identifier` VARCHAR(50) NOT NULL,
  `target_identifier` VARCHAR(50) NOT NULL,
  `liked` BOOLEAN NOT NULL,
  `is_super_like` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_swipe` (`user_identifier`, `target_identifier`),
  INDEX `idx_user` (`user_identifier`),
  INDEX `idx_target` (`target_identifier`),
  INDEX `idx_liked` (`liked`),
  INDEX `idx_created` (`created_at` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_matches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user1_identifier` VARCHAR(50) NOT NULL,
  `user2_identifier` VARCHAR(50) NOT NULL,
  `matched_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_message_at` DATETIME DEFAULT NULL,
  `user1_unmatched` BOOLEAN DEFAULT FALSE,
  `user2_unmatched` BOOLEAN DEFAULT FALSE,
  INDEX `idx_user1` (`user1_identifier`),
  INDEX `idx_user2` (`user2_identifier`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_matched` (`matched_at` DESC),
  UNIQUE KEY `unique_match_pair` (`user1_identifier`, `user2_identifier`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


CREATE TABLE `bit_phone_bitlove_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `match_id` INT NOT NULL,
  `sender_identifier` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `message_type` ENUM('text', 'image', 'gif', 'sticker') DEFAULT 'text',
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`match_id`) REFERENCES `bit_phone_bitlove_matches`(`id`) ON DELETE CASCADE,
  INDEX `idx_match` (`match_id`),
  INDEX `idx_sender` (`sender_identifier`),
  INDEX `idx_created` (`created_at` DESC),
  INDEX `idx_unread` (`is_read`, `match_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reporter_identifier` VARCHAR(50) NOT NULL,
  `reported_identifier` VARCHAR(50) NOT NULL,
  `reason` ENUM(
    'inappropriate_content',
    'harassment',
    'spam',
    'fake_profile',
    'other'
  ) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME DEFAULT NULL,
  INDEX `idx_reporter` (`reporter_identifier`),
  INDEX `idx_reported` (`reported_identifier`),
  INDEX `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_business_listings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `image_url` TEXT DEFAULT NULL,
  `rating` DECIMAL(2, 1) DEFAULT 0.0,
  `review_count` INT DEFAULT 0,
  `is_open` BOOLEAN DEFAULT TRUE,
  `opening_hours` JSON DEFAULT NULL,
  `coordinates` JSON DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_rating` (`rating` DESC),
  INDEX `idx_name` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_business_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `user_identifier` VARCHAR(50) NOT NULL,
  `rating` TINYINT NOT NULL,
  `review` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `bit_phone_business_listings`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_review` (`business_id`, `user_identifier`),
  INDEX `idx_business` (`business_id`),
  INDEX `idx_rating` (`rating`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_crypto_holdings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `crypto_id` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(20, 8) NOT NULL DEFAULT 0.00000000,
  `average_buy_price` DECIMAL(20, 8) DEFAULT 0.00000000,
  `last_updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_crypto` (`user`, `crypto_id`),
  INDEX `idx_user` (`user`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_crypto_watchlist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `crypto_id` VARCHAR(50) NOT NULL,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_crypto` (`user`, `crypto_id`),
  INDEX `idx_user` (`user`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_crypto_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `crypto_id` VARCHAR(50) NOT NULL,
  `transaction_type` ENUM('buy', 'sell') NOT NULL,
  `amount` DECIMAL(20, 8) NOT NULL,
  `price_per_unit` DECIMAL(20, 8) NOT NULL,
  `total_value` DECIMAL(20, 2) NOT NULL,
  `fee` DECIMAL(20, 8) DEFAULT 0.00000000,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user`),
  INDEX `idx_crypto` (`crypto_id`),
  INDEX `idx_type` (`transaction_type`),
  INDEX `idx_created` (`created_at` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bit_phone_bank_pending` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `to_identifier` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(20,2) NOT NULL,
  `from_identifier` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `processed` BOOLEAN DEFAULT FALSE,
  INDEX `idx_to` (`to_identifier`),
  INDEX `idx_processed` (`processed`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bit_phone_bank_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `from_identifier` VARCHAR(50) NOT NULL,
  `to_identifier` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(20,2) NOT NULL,
  `concept` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_from` (`from_identifier`),
  INDEX `idx_to` (`to_identifier`),
  INDEX `idx_created` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_instagram_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `identifier` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(100) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `bio` TEXT DEFAULT NULL,
  `profile_picture` TEXT DEFAULT NULL,
  `is_private` BOOLEAN DEFAULT FALSE,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `followers_count` INT DEFAULT 0,
  `following_count` INT DEFAULT 0,
  `posts_count` INT DEFAULT 0,
  `website` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_identifier` (`identifier`),
  UNIQUE KEY `unique_username` (`username`),
  INDEX `idx_username` (`username`),
  INDEX `idx_verified` (`is_verified`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_instagram_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `identifier` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `display_name` VARCHAR(100) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `avatar` TEXT DEFAULT NULL,
  `follower_count` INT DEFAULT 0,
  `following_count` INT DEFAULT 0,
  `post_count` INT DEFAULT 0,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `is_private` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_profile` (`identifier`),
  INDEX `idx_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_instagram_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_identifier` VARCHAR(50) NOT NULL,
  `caption` TEXT DEFAULT NULL,
  `image_url` TEXT NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `likes_count` INT DEFAULT 0,
  `comments_count` INT DEFAULT 0,
  `is_pinned` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_identifier`),
  INDEX `idx_created` (`created_at` DESC),
  INDEX `idx_likes` (`likes_count` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_instagram_follows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `follower_identifier` VARCHAR(50) NOT NULL,
  `following_identifier` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_follow` (`follower_identifier`, `following_identifier`),
  INDEX `idx_follower` (`follower_identifier`),
  INDEX `idx_following` (`following_identifier`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_instagram_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `user_identifier` VARCHAR(50) NOT NULL,
  `comment` TEXT NOT NULL,
  `parent_comment_id` INT DEFAULT NULL,
  `likes_count` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`post_id`) REFERENCES `bit_phone_instagram_posts`(`id`) ON DELETE CASCADE,
  INDEX `idx_post` (`post_id`),
  INDEX `idx_user` (`user_identifier`),
  INDEX `idx_parent` (`parent_comment_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_instagram_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `user_identifier` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`post_id`) REFERENCES `bit_phone_instagram_posts`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_like` (`post_id`, `user_identifier`),
  INDEX `idx_post` (`post_id`),
  INDEX `idx_user` (`user_identifier`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_darkweb_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_identifier` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `reputation` INT DEFAULT 100,
  `total_purchases` INT DEFAULT 0,
  `total_sales` INT DEFAULT 0,
  `is_banned` BOOLEAN DEFAULT FALSE,
  `ban_reason` TEXT DEFAULT NULL,
  `last_active` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_identifier` (`user_identifier`),
  UNIQUE KEY `unique_username` (`username`),
  INDEX `idx_identifier` (`user_identifier`),
  INDEX `idx_username` (`username`),
  INDEX `idx_reputation` (`reputation`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_darkweb_rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `creator` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_darkweb_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bit_phone_darkweb_room_members` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `room_id` int(11) NOT NULL,
    `member_identifier` varchar(60) NOT NULL,
    `is_admin` tinyint(1) DEFAULT 0,
    `joined_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_room_member` (`room_id`, `member_identifier`),
    INDEX `idx_member` (`member_identifier`),
    FOREIGN KEY (`room_id`) REFERENCES `bit_phone_darkweb_rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bit_phone_darkweb_messages` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `room_id` int(11) NOT NULL,
    `sender_identifier` varchar(60) NOT NULL,
    `message` text NOT NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_room_id` (`room_id`),
    INDEX `idx_sender` (`sender_identifier`),
    INDEX `idx_created_at` (`created_at`),
    FOREIGN KEY (`room_id`) REFERENCES `bit_phone_darkweb_rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `bit_phone_darkweb_marketplace` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `seller_identifier` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM(
    'weapons',
    'drugs',
    'services',
    'documents',
    'other'
  ) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(20) DEFAULT 'USD',
  `stock_quantity` INT DEFAULT 1,
  `is_active` BOOLEAN DEFAULT TRUE,
  `rating` DECIMAL(2, 1) DEFAULT 0.0,
  `review_count` INT DEFAULT 0,
  `image_urls` JSON DEFAULT NULL,
  `shipping_info` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_seller` (`seller_identifier`),
  INDEX `idx_category` (`category`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_price` (`price`),
  INDEX `idx_rating` (`rating` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_darkweb_purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `buyer_identifier` VARCHAR(50) NOT NULL,
  `seller_identifier` VARCHAR(50) NOT NULL,
  `item_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(20) NOT NULL,
  `status` ENUM(
    'pending',
    'confirmed',
    'delivered',
    'cancelled',
    'disputed'
  ) DEFAULT 'pending',
  `delivery_location` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `bit_phone_darkweb_marketplace`(`id`) ON DELETE CASCADE,
  INDEX `idx_buyer` (`buyer_identifier`),
  INDEX `idx_seller` (`seller_identifier`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_darkweb_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` INT NOT NULL,
  `reviewer_identifier` VARCHAR(50) NOT NULL,
  `item_id` INT NOT NULL,
  `rating` TINYINT NOT NULL,
  `review` TEXT DEFAULT NULL,
  `is_anonymous` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`purchase_id`) REFERENCES `bit_phone_darkweb_purchases`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `bit_phone_darkweb_marketplace`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_purchase_review` (`purchase_id`),
  INDEX `idx_item` (`item_id`),
  INDEX `idx_reviewer` (`reviewer_identifier`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_contact_list` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_identifier` VARCHAR(50) NOT NULL,
  `contact_identifier` VARCHAR(50) NOT NULL,
  `contact_name` VARCHAR(100) NOT NULL,
  `contact_avatar` TEXT DEFAULT NULL,
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `is_blocked` BOOLEAN DEFAULT FALSE,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_contact` (`user_identifier`, `contact_identifier`),
  INDEX `idx_user` (`user_identifier`),
  INDEX `idx_contact` (`contact_identifier`),
  INDEX `idx_favorite` (`user_identifier`, `is_favorite`),
  INDEX `idx_blocked` (`user_identifier`, `is_blocked`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_chats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `chat_type` ENUM('personal', 'group') DEFAULT 'personal',
  `chat_name` VARCHAR(100) DEFAULT NULL,
  `chat_avatar` TEXT DEFAULT NULL,
  `created_by` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_type` (`chat_type`),
  INDEX `idx_updated` (`updated_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_chat_participants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `chat_id` INT NOT NULL,
  `user_identifier` VARCHAR(50) NOT NULL,
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_admin` BOOLEAN DEFAULT FALSE,
  `is_muted` BOOLEAN DEFAULT FALSE,
  `is_pinned` BOOLEAN DEFAULT FALSE,
  `last_read_message_id` INT DEFAULT 0,
  FOREIGN KEY (`chat_id`) REFERENCES `bit_phone_chats`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_participant` (`chat_id`, `user_identifier`),
  INDEX `idx_chat` (`chat_id`),
  INDEX `idx_user` (`user_identifier`),
  INDEX `idx_pinned` (`user_identifier`, `is_pinned`),
  INDEX `idx_muted` (`user_identifier`, `is_muted`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `chat_id` INT NOT NULL,
  `sender_identifier` VARCHAR(50) NOT NULL,
  `message_type` ENUM('text', 'image', 'voice', 'location', 'file') DEFAULT 'text',
  `content` LONGTEXT NOT NULL,
  `file_url` TEXT DEFAULT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_size` BIGINT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `reply_to_message_id` INT DEFAULT NULL,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`chat_id`) REFERENCES `bit_phone_chats`(`id`) ON DELETE CASCADE,
  INDEX `idx_chat` (`chat_id`),
  INDEX `idx_sender` (`sender_identifier`),
  INDEX `idx_created` (`created_at`),
  INDEX `idx_type` (`message_type`),
  INDEX `idx_reply` (`reply_to_message_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_message_reactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` INT NOT NULL,
  `user_identifier` VARCHAR(50) NOT NULL,
  `emoji` VARCHAR(10) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`message_id`) REFERENCES `bit_phone_messages`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_reaction` (`message_id`, `user_identifier`, `emoji`),
  INDEX `idx_message` (`message_id`),
  INDEX `idx_user` (`user_identifier`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_message_status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` INT NOT NULL,
  `user_identifier` VARCHAR(50) NOT NULL,
  `status` ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  `status_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`message_id`) REFERENCES `bit_phone_messages`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_status` (`message_id`, `user_identifier`),
  INDEX `idx_message` (`message_id`),
  INDEX `idx_user` (`user_identifier`),
  INDEX `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_calendar_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `all_day` BOOLEAN DEFAULT FALSE,
  `recurring` ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT 'none',
  `color` VARCHAR(20) DEFAULT '#3B82F6',
  `location` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user`, `start_date`),
  INDEX `idx_recurring` (`recurring`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_tuister_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `identifier` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `bio` TEXT DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT 'assets/avatars/default.png',
  `banner` TEXT DEFAULT NULL,
  `verified` BOOLEAN DEFAULT FALSE,
  `followers_count` INT DEFAULT 0,
  `following_count` INT DEFAULT 0,
  `tweets_count` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_identifier` (`identifier`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_tuister_tweets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` TEXT DEFAULT NULL,
  `likes_count` INT DEFAULT 0,
  `retweets_count` INT DEFAULT 0,
  `comments_count` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `bit_phone_tuister_users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_tuister_follows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `follower_id` INT NOT NULL,
  `following_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`follower_id`) REFERENCES `bit_phone_tuister_users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`following_id`) REFERENCES `bit_phone_tuister_users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_follow` (`follower_id`, `following_id`),
  INDEX `idx_follower` (`follower_id`),
  INDEX `idx_following` (`following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_tuister_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tweet_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tweet_id`) REFERENCES `bit_phone_tuister_tweets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `bit_phone_tuister_users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_like` (`tweet_id`, `user_id`),
  INDEX `idx_tweet` (`tweet_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_tuister_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tweet_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tweet_id`) REFERENCES `bit_phone_tuister_tweets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `bit_phone_tuister_users`(`id`) ON DELETE CASCADE,
  INDEX `idx_tweet` (`tweet_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_news` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT,
  `content` LONGTEXT NOT NULL,
  `image_url` VARCHAR(500),
  `category` VARCHAR(100) DEFAULT 'General',
  `author` VARCHAR(255) NOT NULL,
  `author_identifier` VARCHAR(100) NOT NULL,
  `created_at` INT NOT NULL,
  `updated_at` INT DEFAULT NULL,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `tags` JSON DEFAULT NULL,
  `read_time` VARCHAR(20) DEFAULT '2 min',
  `views` INT DEFAULT 0,
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'published',
  INDEX `idx_author` (`author_identifier`),
  INDEX `idx_category` (`category`),
  INDEX `idx_created` (`created_at`),
  INDEX `idx_featured` (`is_featured`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_crypto_holdings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `crypto_symbol` VARCHAR(20) NOT NULL,
  `amount` DECIMAL(20, 8) NOT NULL DEFAULT 0,
  `total_invested` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_crypto` (`user_id`, `crypto_symbol`),
  INDEX `idx_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_crypto_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `crypto_symbol` VARCHAR(20) NOT NULL,
  `transaction_type` ENUM('buy', 'sell') NOT NULL,
  `amount` DECIMAL(20, 8) NOT NULL,
  `price_per_unit` DECIMAL(15, 2) NOT NULL,
  `total_value` DECIMAL(15, 2) NOT NULL,
  `payment_method` ENUM('bank', 'cash') NOT NULL DEFAULT 'bank',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_created` (`created_at` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `identifier` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `bio` TEXT,
  `age` INT,
  `gender` ENUM('male', 'female', 'other') NOT NULL,
  `interested_in` ENUM('male', 'female', 'both') NOT NULL DEFAULT 'both',
  `profile_picture` TEXT,
  `photos` JSON,
  `location` VARCHAR(100),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_identifier` (`identifier`),
  INDEX `idx_gender` (`gender`),
  INDEX `idx_active` (`is_active`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_swipes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_identifier` VARCHAR(50) NOT NULL,
  `target_identifier` VARCHAR(50) NOT NULL,
  `liked` BOOLEAN NOT NULL,
  `super_like` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_swipe` (`user_identifier`, `target_identifier`),
  INDEX `idx_user` (`user_identifier`),
  INDEX `idx_target` (`target_identifier`),
  FOREIGN KEY (`user_identifier`) REFERENCES `bit_phone_bitlove_profiles`(`identifier`) ON DELETE CASCADE,
  FOREIGN KEY (`target_identifier`) REFERENCES `bit_phone_bitlove_profiles`(`identifier`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_matches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user1_identifier` VARCHAR(50) NOT NULL,
  `user2_identifier` VARCHAR(50) NOT NULL,
  `matched_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_message_at` DATETIME,
  `is_active` BOOLEAN DEFAULT TRUE,
  UNIQUE KEY `unique_match` (`user1_identifier`, `user2_identifier`),
  INDEX `idx_user1` (`user1_identifier`),
  INDEX `idx_user2` (`user2_identifier`),
  INDEX `idx_active` (`is_active`),
  FOREIGN KEY (`user1_identifier`) REFERENCES `bit_phone_bitlove_profiles`(`identifier`) ON DELETE CASCADE,
  FOREIGN KEY (`user2_identifier`) REFERENCES `bit_phone_bitlove_profiles`(`identifier`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `match_id` INT NOT NULL,
  `sender_identifier` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `message_type` ENUM('text', 'photo', 'emoji') DEFAULT 'text',
  `read_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_match` (`match_id`),
  INDEX `idx_sender` (`sender_identifier`),
  INDEX `idx_created` (`created_at`),
  FOREIGN KEY (`match_id`) REFERENCES `bit_phone_bitlove_matches`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `bit_phone_bitlove_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reporter_identifier` VARCHAR(50) NOT NULL,
  `reported_identifier` VARCHAR(50) NOT NULL,
  `reason` ENUM('inappropriate_content', 'harassment', 'fake_profile', 'spam', 'other') NOT NULL,
  `description` TEXT,
  `status` ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reporter` (`reporter_identifier`),
  INDEX `idx_reported` (`reported_identifier`),
  INDEX `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;