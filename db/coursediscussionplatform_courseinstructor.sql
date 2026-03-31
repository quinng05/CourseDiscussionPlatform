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
-- Table structure for table `courseinstructor`
--

DROP TABLE IF EXISTS `courseinstructor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courseinstructor` (
  `courseInstructorId` int NOT NULL AUTO_INCREMENT,
  `courseCode` varchar(20) NOT NULL,
  `teacherId` int NOT NULL,
  `createdByUserId` int NOT NULL,
  PRIMARY KEY (`courseInstructorId`),
  UNIQUE KEY `courseCode` (`courseCode`,`teacherId`),
  KEY `teacherId` (`teacherId`),
  KEY `createdByUserId` (`createdByUserId`),
  CONSTRAINT `courseinstructor_ibfk_1` FOREIGN KEY (`courseCode`) REFERENCES `course` (`courseCode`) ON DELETE CASCADE,
  CONSTRAINT `courseinstructor_ibfk_2` FOREIGN KEY (`teacherId`) REFERENCES `teacher` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `courseinstructor_ibfk_3` FOREIGN KEY (`createdByUserId`) REFERENCES `sysadmin` (`userId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courseinstructor`
--

LOCK TABLES `courseinstructor` WRITE;
/*!40000 ALTER TABLE `courseinstructor` DISABLE KEYS */;
INSERT INTO `courseinstructor` VALUES (1,'CHEM1035',10,11),(2,'ENGL1105',9,11),(3,'MATH1226',8,12),(4,'CS3214',6,13),(5,'CS4604',7,14);
/*!40000 ALTER TABLE `courseinstructor` ENABLE KEYS */;
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
