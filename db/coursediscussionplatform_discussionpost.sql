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
-- Table structure for table `discussionpost`
--

DROP TABLE IF EXISTS `discussionpost`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discussionpost` (
  `postId` int NOT NULL AUTO_INCREMENT,
  `postText` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `courseInstructorId` int NOT NULL,
  `semesterId` int DEFAULT NULL,
  `authorId` int NOT NULL,
  `parentPostId` int DEFAULT NULL,
  PRIMARY KEY (`postId`),
  KEY `courseInstructorId` (`courseInstructorId`),
  KEY `semesterId` (`semesterId`),
  KEY `authorId` (`authorId`),
  KEY `parentPostId` (`parentPostId`),
  CONSTRAINT `discussionpost_ibfk_1` FOREIGN KEY (`courseInstructorId`) REFERENCES `courseinstructor` (`courseInstructorId`) ON DELETE CASCADE,
  CONSTRAINT `discussionpost_ibfk_2` FOREIGN KEY (`semesterId`) REFERENCES `semester` (`semesterId`) ON DELETE SET NULL,
  CONSTRAINT `discussionpost_ibfk_3` FOREIGN KEY (`authorId`) REFERENCES `user` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `discussionpost_ibfk_4` FOREIGN KEY (`parentPostId`) REFERENCES `discussionpost` (`postId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discussionpost`
--

LOCK TABLES `discussionpost` WRITE;
/*!40000 ALTER TABLE `discussionpost` DISABLE KEYS */;
INSERT INTO `discussionpost` VALUES (1,'This class sucks','2025-12-02 05:00:00',1,1,1,1),(2,'I loved the way this class was taught','2026-03-17 20:10:34',5,3,2,2),(3,'This class was too difficult','2025-02-28 05:00:00',4,2,1,3),(4,'I enjoyed learning in this class','2025-11-28 05:00:00',5,1,3,4),(5,'I found the class to be boring','2026-03-16 04:00:00',3,3,4,5);
/*!40000 ALTER TABLE `discussionpost` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-31 17:29:13
