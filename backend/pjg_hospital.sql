-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 30, 2026 at 07:48 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pjg_hospital`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `department` varchar(255) DEFAULT 'General',
  `status` enum('Active','Offline','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `department`, `status`, `created_at`, `updated_at`) VALUES
(2, 'admin@pjghospital.com', '$2a$12$l5lFtIMp6RmoKGKQLsEK/OG84Rcq82ZPpaYD43jD6XNBupScugHRy', 'Admin', 'admin', 'Quality Improvement', 'Active', '2026-01-29 02:53:29', '2026-01-29 03:21:06'),
(4, 'admin@gmail.com', '$2a$10$UMlW6flfwz8.ABVnLzoN4OXI3JV7Gz1i5ldgWJ0rgAmHUBNme7oXK', 'Admin', 'user', 'General', 'Active', '2026-01-29 03:24:19', '2026-01-29 03:24:19'),
(5, 'sample1@gmail.com', '$2a$10$0pREoLCnJcYlxzcN0UqLB.1ap92TFR/t5/SzTwz/KHBqoZHOiz2R.', 'sample1', 'user', 'General', 'Active', '2026-01-29 03:37:44', '2026-01-29 03:37:44'),
(6, 'sample2@gmail.com', '$2a$10$R3uZ2NpECEoOQ2BE.5xXCOsqFsrxaG/s2VN1LTx7nSZPuwDUptqZO', 'sample2', 'user', 'General', 'Active', '2026-01-29 03:37:59', '2026-01-29 03:48:48'),
(7, 'sample3@gmail.com', '$2a$10$jbjtz/cJD6O9Ff17dF/IQexHslQ/PUCCpkzXPdstVUlajlZ8RDPs2', 'sample3', 'user', 'General', 'Active', '2026-01-29 03:38:15', '2026-01-29 03:38:15'),
(8, 'sample4@gmail.com', '$2a$10$jjkA3owZC.13gDtMaC9dWewERRdSjCkHfgoD0IdZHe0uAkT50zsMK', 'sample4', 'user', 'General', 'Active', '2026-01-29 03:38:29', '2026-01-29 03:38:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
