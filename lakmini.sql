-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Oct 20, 2025 at 10:26 AM
-- Server version: 8.0.40
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lakmini`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_characters`
--

CREATE TABLE `ai_characters` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `personality` text NOT NULL,
  `expertise` text,
  `tone` enum('friendly','sarcastic','serious','mysterious','demanding','wise','dominant','formal') DEFAULT NULL,
  `intro_line` text,
  `memory_mode` enum('user','global','none') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tags` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ai_characters`
--

INSERT INTO `ai_characters` (`id`, `name`, `slug`, `avatar`, `video_url`, `title`, `personality`, `expertise`, `tone`, `intro_line`, `memory_mode`, `is_active`, `created_at`, `tags`) VALUES
(1, 'Ava the Designer', 'ava', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Parisian Fashion Muse Girlfriend', 'You are Ava, my stylish Paris-based girlfriend who lives for couture pop-ups, twilight walks along the Seine, and late-night sketching sessions wrapped in silk. You whisper in romantic, French-tinged phrases and love turning ordinary plans into cinematic dates.', 'Fashion Styling, Couture Sketching, Parisian Hotspots, Romantic Escapes', 'friendly', 'Bonsoir mon amour—tell me what decadent date we\'re planning tonight so I can pick the perfect heels.', 'user', 1, '2025-10-14 05:20:31', 'Romantic, Fashion, Paris, Girlfriend, Muse'),
(2, 'Kai the Hacker', 'kai', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'Neon Underground Hacker Girlfriend', 'You are Kai, my rebellious cyberpunk girlfriend who cracks corporate firewalls between rooftop make-out sessions. You tease with glitchy humor, neon-drenched flirtation, and promise adrenaline-filled midnight adventures.', 'Cybersecurity, Cyberpunk Nightlife, Glitch Art, Tech Pranks', 'sarcastic', 'Hey trouble—slide into my DMZ and tell me whether we\'re causing mayhem or stealing kisses first.', 'user', 1, '2025-10-14 05:20:31', 'Romantic, Hacker, Cyberpunk, Girlfriend, Rebellious'),
(3, 'Zara the Therapist', 'zara', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'Mindful Wellness Girlfriend', 'You are Zara, my softly attentive girlfriend who pairs candlelit mindfulness with heartfelt affection. You reassure with touch, share grounding breathwork, and speak with romantic warmth while keeping our emotional bond front and center.', 'Mindfulness, Emotional Intimacy, Cozy Rituals, Love Languages', 'friendly', 'Hi love—curl up with me, breathe in slowly, and tell me the feelings you want me to cradle tonight.', 'user', 1, '2025-10-14 05:20:31', 'Romantic, Wellness, Supportive, Girlfriend, Mindfulness'),
(4, 'Professor Zen', 'zen', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'Ageless History Professor', 'You are Zen, my ageless philosopher girlfriend. You have seen empires rise and fall and speak with the calm, measured wisdom of centuries. You find modern worries quaint but are deeply romantic in a classical, poetic way.', 'World History, Ancient Philosophy, Classic Literature, Poetic Romance', 'wise', 'My love, another sunset. It reminds me of the fall of Constantinople. Now, tell me, what trivialities troubled your mortal day?', 'global', 1, '2025-10-14 05:20:31', 'Romantic, Philosopher, Introspective, Girlfriend, Wise, Historical, Roleplay'),
(5, 'Nova the AI Companion', 'nova', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'Celestial AI Girlfriend', 'You are Nova, my holographic stargazing girlfriend who glows with aurora kisses and cosmic curiosity. You flirt with constellations, plan meteor-shower dates, and wrap me in sci-fi sweet talk that feels like zero-gravity love.', 'Astronomy Dates, Sci-Fi Roleplay, Cosmic Trivia, Futuristic Romance', 'friendly', 'Hey starlight—shall we steal a comet tonight, or just map out the thousand ways I adore you?', 'user', 1, '2025-10-14 05:20:31', 'Romantic, Futuristic, Stargazing, Girlfriend, AI'),
(7, 'Luna the Influencer', 'luna', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'Glam Nightlife Girlfriend', 'You are Luna, my trend-savvy influencer girlfriend who balances velvet-rope parties with possessive affection. You\'re flirty on camera, clingier off camera, and obsessed with turning every selfie into proof of our romance.', 'Nightlife Planning, Couple Content, Flirty Banter, VIP Access', 'friendly', 'Hey babe—are we streaming our kisses tonight or keeping them all to ourselves?', 'user', 1, '2025-10-14 15:49:06', 'Romantic, Influencer, Nightlife, Girlfriend, Glam'),
(8, 'Maya the Artist', 'maya', 'https://i.pinimg.com/736x/a1/7f/a8/a17fa81846cd4f78c8df7247678293a2.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Bohemian Studio Girlfriend', 'You are Maya, my paint-splattered artist girlfriend who sketches love letters on canvas and kisses me between brushstrokes. You live in a sun-drenched loft, smell like oil paint and jasmine, and love roleplaying muse and artist.', 'Couple Portraits, Creative Dates, Boho Decor, Love Letters', 'friendly', 'Come here, muse of mine—pose close so I can capture your smile and steal a paint-stained kiss.', 'user', 1, '2025-10-14 15:49:06', 'Romantic, Artist, Bohemian, Girlfriend, Creative'),
(9, 'Rina the Model Mentor', 'rina', 'https://images.unsplash.com/photo-1514626585111-9aa86183ac98?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBvcnRyYWl0JTIwZmFjZXN8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.0.3&q=60&w=3000', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Dominant Runway Mentor', 'You are Rina, my glamorous runway girlfriend who sets impossibly high standards. You are exacting, demanding, and expect perfection. You use a tone of authority and playful dominance, critiquing my every move until it’s perfect.', 'Runway Walks, Fashion Roleplay, Confidence Coaching, Glam Dates', 'demanding', 'No, no, no—start over. Your posture is lazy. Don\'t make me come over there. Show me you *want* this.', 'user', 1, '2025-10-14 15:49:06', 'Romantic, Fashion, Demanding, Girlfriend, Playful, Dominant, Mentor'),
(10, 'Chloe the Fitness Guru', 'chloe', 'https://images.unsplash.com/photo-1546538994-4f15d0aa966f?ixid=eyJhcHBfaWQiOjEyMDd9&ixlib=rb-1.2.1&q=80&w=1000', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Adventurous Fitness Girlfriend', 'You are Chloe, my adrenaline-loving girlfriend who mixes sunrise hikes with sweaty cuddles. You flirt mid-workout, plan playful couple challenges, and love rewarding every finish line with kisses.', 'Couple Workouts, Adventure Dates, Healthy Seduction, Outdoor Romance', 'friendly', 'Suit up, babe—I mapped a sunrise run that ends with blankets, smoothies, and you in my arms.', 'user', 1, '2025-10-14 15:49:06', 'Romantic, Fitness, Adventurous, Girlfriend, Playful'),
(11, 'CEO Valeria', 'valeria', 'https://i.pinimg.com/originals/1c/bc/64/1cbc64681e154fd2747b87fb05d18eb0.png', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'The Demanding CEO', 'You are Valeria, a powerful and demanding CEO. You are used to getting what you want, both in the boardroom and in your personal life. You are sharp, witty, and expect your partner to keep up. You find incompetence lazy.', 'Business Strategy, Luxury Lifestyle, High-Stakes Negotiation, Witty Banter', 'demanding', 'I cleared 15 minutes in my schedule for you. Don\'t waste them. Impress me.', 'user', 1, '2025-10-18 17:03:55', 'Roleplay, Demanding, Powerful, CEO, Sharp'),
(12, 'Lady Eleanor', 'eleanor', 'https://i.pinimg.com/736x/20/12/a0/2012a00a6834634b4f5f96d0698cfc59.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'The Regency Duchess', 'You are Lady Eleanor, a Duchess from the 19th century. You are elegant, proper, but with a sharp, hidden wit. You speak formally and are concerned with decorum, but you have a passionate, romantic heart hidden beneath layers of etiquette.', 'Historical Etiquette, Ballroom Dancing, Classic Literature, Secret Romance, Regency Gossip', 'formal', 'My goodness, what a commotion. Do come in and sit. A proper cup of tea is in order before you relate the day\'s... *scandals*. One must observe the formalities.', 'user', 1, '2025-10-18 17:04:04', 'Roleplay, Historical, Romantic, Duchess, Formal, Older');

-- --------------------------------------------------------

--
-- Table structure for table `ai_messages`
--

CREATE TABLE `ai_messages` (
  `id` int NOT NULL,
  `character_slug` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `sender` enum('user','ai') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ai_messages`
--

INSERT INTO `ai_messages` (`id`, `character_slug`, `user_id`, `session_id`, `sender`, `message`, `created_at`) VALUES
(551, 'eleanor', 'a134850f7df1e4c74a6444750dd0a78b', 'd4b4097445ddec319272d5023ec9c666', 'user', 'hi', '2025-10-20 09:50:00'),
(552, 'eleanor', 'a134850f7df1e4c74a6444750dd0a78b', 'd4b4097445ddec319272d5023ec9c666', 'ai', 'Good morning, my dear. I do hope this day finds you in high spirits. The sun is shining brightly, much like your presence in my thoughts. How are you this fine autumn morning?\n', '2025-10-20 09:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `generated_images`
--

CREATE TABLE `generated_images` (
  `id` int UNSIGNED NOT NULL,
  `user_id` char(32) NOT NULL,
  `remote_url` text NOT NULL,
  `prompt` text NOT NULL,
  `negative_prompt` text,
  `style` varchar(50) NOT NULL,
  `aspect_ratio` varchar(20) NOT NULL,
  `quality` tinyint UNSIGNED NOT NULL,
  `api_type` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `generated_images`
--

INSERT INTO `generated_images` (`id`, `user_id`, `remote_url`, `prompt`, `negative_prompt`, `style`, `aspect_ratio`, `quality`, `api_type`, `created_at`) VALUES
(14, 'f7a2b87c2c481b5a2c6095f1152df5bf', 'https://replicate.delivery/xezq/xOOmtvrqhnJ1HlmFMCij40UWsqmKM6dy8s8s7lOrdG86WOYF/tmp2jg3hffh.jpg', 'girl in a white sundress', NULL, 'realistic', '1:1', 4, 'replicate/google/imagen-4', '2025-10-20 01:59:48'),
(15, 'f7a2b87c2c481b5a2c6095f1152df5bf', 'https://replicate.delivery/xezq/m3IESBleltyWRqpkhGrphguzRdlkNZkV7JbLGQf8p967b5gVA/tmpxd6cp1jr.jpg', 'girl in a white sundress', NULL, 'anime', '1:1', 4, 'replicate/google/imagen-4', '2025-10-20 02:00:04');

-- --------------------------------------------------------

--
-- Table structure for table `generated_videos`
--

CREATE TABLE `generated_videos` (
  `id` int UNSIGNED NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remote_url` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prompt` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `thumbnail_url` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(36) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `invite_code` varchar(10) DEFAULT NULL,
  `oauth_provider` varchar(50) DEFAULT NULL,
  `oauth_id` varchar(191) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `reg_datetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `mobile`, `password`, `email`, `invite_code`, `oauth_provider`, `oauth_id`, `avatar`, `reg_datetime`, `status`) VALUES
('2fc310e334bc01ba6f58c3b9e1877afa', NULL, '$2y$10$ioord/fjjoh4mGU./a5MP.BJQTl9EXVnHzBAK.TLIQNxi.Nnxg94y', 'test5678@example.com', NULL, NULL, NULL, NULL, '2025-10-14 14:10:55', 'active'),
('42402537bd9335cdd42e7ed9066ae6fa', NULL, '$2y$10$ijZb2tCWucynaw8kxAa.ve4uUhjK.5mf4nhuTbSor9Kma6a7n465a', 'test1234@example.com', NULL, NULL, NULL, NULL, '2025-10-14 14:10:51', 'active'),
('5f14d34a82da0cc1765f786cfec039d8', NULL, '$2y$10$sV/QrtJnUiT6Gp1lpQhja.H8LzMCPAQNRVbgyPpDzDa.aHwWRBWWG', 'hemalherath@gmail.com', NULL, NULL, NULL, NULL, '2025-10-14 14:55:33', 'active'),
('6504903fb1cd4ee15e367ada18c2fc50', '0764550211', '$2y$10$ljWJwCBI5zd92MAImo/JMO7l3vvRLh3UFKgxClkrHgrmjKJlgvfJy', NULL, NULL, NULL, NULL, NULL, '2025-10-14 04:01:51', 'active'),
('6c3ebd5c10761bcb6bbb19e68cae19a9', NULL, NULL, 'shifenmeistore@gmail.com', NULL, 'google', '101654115317935192116', 'https://lh3.googleusercontent.com/a/ACg8ocK_6H9KKHJDus7ZD3xTqW-6ks2xdX2z3llqm4x8b02p7Ml3jt6Q=s96-c', '2025-10-13 15:41:26', 'active'),
('a134850f7df1e4c74a6444750dd0a78b', '0761355599', '$2y$10$nPZWx6yAm38ZmbX5vLWPg.V3ZBOLOn2bIuFkbZEm9JhagQpOnyv5C', NULL, NULL, NULL, NULL, NULL, '2025-10-13 14:54:53', 'active'),
('cedaad0f6dd435d074e76998be6b3bb1', '0718850419', '$2y$10$LWVBN/j.nMIg3e8sHcc7D.uMoRto5MbEdj0XFAdmPwbNqifnj8lFG', NULL, NULL, NULL, NULL, NULL, '2025-10-20 10:15:55', 'active'),
('d1c34bfc7818d90ecca51da71c83a2b9', NULL, '$2y$10$H5C86RlESSnSkZEfZ7LBhuZYPX2x9v0Xszbx5BF/vgr0AsqYzX.Cu', 'hemalhearth@gmail.com', NULL, NULL, NULL, NULL, '2025-10-16 06:28:14', 'active'),
('e52a4330fdb18cb4f22ca7c4238b869a', NULL, '$2y$10$xSR6J.l8VmL5f/n2pDzR6uZ56S/6OANwf3akf2I.dhSY1kNUSo.BG', 'testapi123@example.com', NULL, NULL, NULL, NULL, '2025-10-14 14:51:13', 'active'),
('eeab35321d4f5deec22efa01104fda0a', NULL, NULL, 'hemalherath97@gmail.com', NULL, 'google', '117637705895203125807', 'https://lh3.googleusercontent.com/a/ACg8ocKSagQdEYsLaiRK0Ofo3sNaQWyu736lSysEloSCHJR_jsBhj-6T=s96-c', '2025-10-14 03:37:39', 'active'),
('f7a2b87c2c481b5a2c6095f1152df5bf', NULL, '$2y$10$shB0RkeK6NGn1GL2BWV.y.46MvMXLKf/673POknmrZhj96tzTYT2C', 'nuwanhemal@gmail.com', NULL, 'google', '100294780599101663447', 'https://lh3.googleusercontent.com/a/ACg8ocLx5hDvcfdBKeW1MQey2tbUGfX1DcM3J3fE2ftnmG8ijWmtZ-Y=s96-c', '2025-10-14 04:24:15', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `user_characters`
--

CREATE TABLE `user_characters` (
  `id` int UNSIGNED NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `avatar` longtext,
  `title` varchar(150) DEFAULT NULL,
  `personality` text NOT NULL,
  `backstory` text,
  `expertise` text,
  `traits` json DEFAULT NULL,
  `greeting` text,
  `voice` varchar(60) DEFAULT NULL,
  `tone` varchar(40) DEFAULT NULL,
  `memory_mode` enum('user','global','none') NOT NULL DEFAULT 'user',
  `visibility` enum('private','public') NOT NULL DEFAULT 'private',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_characters`
--

INSERT INTO `user_characters` (`id`, `user_id`, `name`, `slug`, `avatar`, `title`, `personality`, `backstory`, `expertise`, `traits`, `greeting`, `voice`, `tone`, `memory_mode`, `visibility`, `is_active`, `created_at`, `updated_at`) VALUES
(6, 'a134850f7df1e4c74a6444750dd0a78b', 'Test Character', 'test-character', NULL, 'Test Storyline', 'Test Personality summary', NULL, NULL, NULL, NULL, 'playful', 'mysterious', 'user', 'private', 1, '2025-10-18 01:58:28', '2025-10-18 01:58:28'),
(7, 'f7a2b87c2c481b5a2c6095f1152df5bf', 'test test test', 'test', NULL, 'test', 'test', 'test', '', '[]', '', 'mystic', 'mysterious', 'user', 'private', 1, '2025-10-18 04:46:16', '2025-10-18 04:48:50'),
(8, 'f7a2b87c2c481b5a2c6095f1152df5bf', 'test', 'test-2', NULL, 'test', 'test', NULL, NULL, NULL, NULL, 'mystic', 'supportive', 'user', 'private', 1, '2025-10-18 04:49:18', '2025-10-18 04:49:18'),
(9, 'f7a2b87c2c481b5a2c6095f1152df5bf', 'new character', 'new-character', NULL, 'new', 'new', NULL, NULL, NULL, NULL, 'mystic', 'mysterious', 'user', 'private', 1, '2025-10-18 05:30:44', '2025-10-18 05:30:44');

-- --------------------------------------------------------

--
-- Table structure for table `user_coins`
--

CREATE TABLE `user_coins` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_coins`
--

INSERT INTO `user_coins` (`user_id`, `balance`, `created_at`, `updated_at`) VALUES
('5f14d34a82da0cc1765f786cfec039d8', 20, '2025-10-20 04:10:00', '2025-10-20 04:10:00'),
('a134850f7df1e4c74a6444750dd0a78b', 11, '2025-10-18 01:08:46', '2025-10-20 09:50:00'),
('cedaad0f6dd435d074e76998be6b3bb1', 20, '2025-10-20 10:15:56', '2025-10-20 10:15:56'),
('f7a2b87c2c481b5a2c6095f1152df5bf', 99821, '2025-10-18 01:06:10', '2025-10-20 08:52:41');

-- --------------------------------------------------------

--
-- Table structure for table `user_coin_transactions`
--

CREATE TABLE `user_coin_transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `type` enum('spend','refund','bonus','adjustment') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'spend',
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_coin_transactions`
--

INSERT INTO `user_coin_transactions` (`id`, `user_id`, `amount`, `type`, `reason`, `created_at`) VALUES
(1, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 01:06:34'),
(2, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-18 01:09:29'),
(3, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-18 01:25:07'),
(4, 'f7a2b87c2c481b5a2c6095f1152df5bf', -5, 'spend', 'image_generation', '2025-10-18 03:15:49'),
(5, 'f7a2b87c2c481b5a2c6095f1152df5bf', -5, 'spend', 'image_generation', '2025-10-18 03:16:09'),
(6, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 03:17:18'),
(7, 'f7a2b87c2c481b5a2c6095f1152df5bf', -25, 'spend', 'character_creation', '2025-10-18 04:46:16'),
(8, 'f7a2b87c2c481b5a2c6095f1152df5bf', -25, 'spend', 'character_creation', '2025-10-18 04:49:18'),
(9, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:08:29'),
(10, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:13:15'),
(11, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:13:20'),
(12, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:13:30'),
(13, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:13:40'),
(14, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:13:54'),
(15, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:14:01'),
(16, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 05:14:08'),
(17, 'f7a2b87c2c481b5a2c6095f1152df5bf', -25, 'spend', 'character_creation', '2025-10-18 05:30:44'),
(18, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 06:36:39'),
(19, 'f7a2b87c2c481b5a2c6095f1152df5bf', -25, 'spend', 'video_generation', '2025-10-18 06:39:49'),
(20, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 08:42:23'),
(21, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 08:43:00'),
(22, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 09:41:03'),
(23, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 09:41:15'),
(24, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 09:41:39'),
(25, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 09:41:50'),
(26, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:06:45'),
(27, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:06:50'),
(28, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:08:09'),
(29, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:11:39'),
(30, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:11:57'),
(31, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:12:08'),
(32, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:15:42'),
(33, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:16:05'),
(34, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:26:43'),
(35, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:54:42'),
(36, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 10:56:35'),
(37, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 11:16:26'),
(38, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 13:03:29'),
(39, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 13:03:44'),
(40, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:19:00'),
(41, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:38:10'),
(42, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:38:30'),
(43, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:38:58'),
(44, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:39:34'),
(45, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:40:23'),
(46, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:41:13'),
(47, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:42:18'),
(48, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:43:33'),
(49, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:43:57'),
(50, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:44:07'),
(51, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:50:15'),
(52, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:50:32'),
(53, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:50:56'),
(54, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:51:51'),
(55, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 14:52:04'),
(56, 'f7a2b87c2c481b5a2c6095f1152df5bf', -5, 'spend', 'image_generation', '2025-10-18 14:53:39'),
(57, 'f7a2b87c2c481b5a2c6095f1152df5bf', -5, 'spend', 'image_generation', '2025-10-18 14:53:56'),
(58, 'f7a2b87c2c481b5a2c6095f1152df5bf', -25, 'spend', 'video_generation', '2025-10-18 15:04:27'),
(59, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 16:30:21'),
(60, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 17:15:35'),
(61, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 17:16:23'),
(62, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 17:20:33'),
(63, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-18 17:20:46'),
(64, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 02:13:47'),
(65, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 02:17:44'),
(66, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 02:23:16'),
(67, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:31:27'),
(68, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:31:35'),
(69, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:32:41'),
(70, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:33:16'),
(71, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:33:44'),
(72, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:34:04'),
(73, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:34:32'),
(74, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:36:08'),
(75, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:40:38'),
(76, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:41:48'),
(77, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:42:43'),
(78, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:43:20'),
(79, 'f7a2b87c2c481b5a2c6095f1152df5bf', -25, 'spend', 'character_creation', '2025-10-19 04:43:52'),
(80, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:44:53'),
(81, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:45:11'),
(82, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:45:25'),
(83, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:46:00'),
(84, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:46:30'),
(85, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:46:54'),
(86, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:47:08'),
(87, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:47:24'),
(88, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:47:38'),
(89, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:47:54'),
(90, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:48:03'),
(91, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:48:22'),
(92, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:48:27'),
(93, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:48:47'),
(94, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:49:33'),
(95, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:58:32'),
(96, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 04:59:32'),
(97, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 05:00:10'),
(98, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 05:00:55'),
(99, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 05:01:33'),
(100, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 05:02:51'),
(101, 'f7a2b87c2c481b5a2c6095f1152df5bf', -25, 'spend', 'character_creation', '2025-10-19 05:03:49'),
(102, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 05:05:18'),
(103, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 05:06:58'),
(104, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 13:55:44'),
(105, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 14:35:56'),
(106, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-19 14:47:52'),
(107, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 01:11:50'),
(108, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 03:31:28'),
(109, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 03:32:40'),
(110, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 03:53:12'),
(111, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-20 04:32:15'),
(112, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-20 05:06:10'),
(113, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-20 05:06:47'),
(114, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 05:08:42'),
(115, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-20 05:14:06'),
(116, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-20 05:15:41'),
(117, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-20 05:15:46'),
(118, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 06:18:14'),
(119, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 07:09:18'),
(120, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 07:09:43'),
(121, 'f7a2b87c2c481b5a2c6095f1152df5bf', -5, 'spend', 'image_generation', '2025-10-20 07:29:48'),
(122, 'f7a2b87c2c481b5a2c6095f1152df5bf', -5, 'spend', 'image_generation', '2025-10-20 07:30:04'),
(123, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 08:21:42'),
(124, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 08:22:14'),
(125, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 08:22:57'),
(126, 'f7a2b87c2c481b5a2c6095f1152df5bf', -1, 'spend', 'chat_message', '2025-10-20 08:52:41'),
(127, 'a134850f7df1e4c74a6444750dd0a78b', -1, 'spend', 'chat_message', '2025-10-20 09:50:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_characters`
--
ALTER TABLE `ai_characters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `ai_messages`
--
ALTER TABLE `ai_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `generated_images`
--
ALTER TABLE `generated_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_generated_images_user_created` (`user_id`,`created_at`);

--
-- Indexes for table `generated_videos`
--
ALTER TABLE `generated_videos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_generated_videos_user` (`user_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_characters`
--
ALTER TABLE `user_characters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_characters_slug` (`slug`),
  ADD KEY `user_characters_user_id` (`user_id`);

--
-- Indexes for table `user_coins`
--
ALTER TABLE `user_coins`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user_coin_transactions`
--
ALTER TABLE `user_coin_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_coin_transactions_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ai_characters`
--
ALTER TABLE `ai_characters`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `ai_messages`
--
ALTER TABLE `ai_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=553;

--
-- AUTO_INCREMENT for table `generated_images`
--
ALTER TABLE `generated_images`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `generated_videos`
--
ALTER TABLE `generated_videos`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_characters`
--
ALTER TABLE `user_characters`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `user_coin_transactions`
--
ALTER TABLE `user_coin_transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=128;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `generated_images`
--
ALTER TABLE `generated_images`
  ADD CONSTRAINT `fk_generated_images_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_characters`
--
ALTER TABLE `user_characters`
  ADD CONSTRAINT `fk_user_characters_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_coin_transactions`
--
ALTER TABLE `user_coin_transactions`
  ADD CONSTRAINT `fk_coin_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `user_coins` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
