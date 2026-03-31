-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: coursediscussionplatform
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `userType` enum('student','teacher','sysadmin') NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'mmle04@vt.edu','Michael','2026-03-17 20:10:33','student'),(2,'gvwilson@vt.edu','Grant','2026-03-17 20:10:33','student'),(3,'quinng05@vt.edu','Quinn','2026-03-17 20:10:33','student'),(4,'rohanchodapunedi@vt.edu','Rohan','2026-03-17 20:10:33','student'),(5,'bobbysmith@vt.edu','Bobby','2026-03-17 20:10:33','student'),(6,'professorjohndoe@vt.edu','John','2026-03-17 20:10:33','teacher'),(7,'professorjanedoe@vt.edu','Jane','2026-03-17 20:10:33','teacher'),(8,'emilydavis@vt.edu','Emily','2026-03-17 20:10:33','teacher'),(9,'RobertBrown@vt.edu','Robert','2026-03-17 20:10:33','teacher'),(10,'marythomas@vt.edu','Mary','2026-03-17 20:10:33','teacher'),(11,'sysadmin1@vt.edu','sysadmin1','2026-03-17 20:10:33','sysadmin'),(12,'sysadmin2@vt.edu','sysadmin2','2026-03-17 20:10:33','sysadmin'),(13,'sysadmin3@vt.edu','sysadmin3','2026-03-17 20:10:33','sysadmin'),(14,'sysadmin4@vt.edu','sysadmin4','2026-03-17 20:10:33','sysadmin'),(15,'sysadmin5@vt.edu','sysadmin5','2026-03-17 20:10:33','sysadmin');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-31 17:29:14
