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
-- Dumping data for table `course`
--

LOCK TABLES `course` WRITE;
/*!40000 ALTER TABLE `course` DISABLE KEYS */;
INSERT INTO `course` VALUES ('CHEM1035','General Chemistry','Course on General Chemistry',3),('CHEM1045','General Chemistry Lab','Chem Lab',1),('CS1114','Intro to Software Design','Course on Software Design',3),('CS2104','Intro to Problem Solving','Course on Intro to Problem Solving',3),('CS2505','Intro to Computer Organization','Course on Computer Organization',3),('CS2506','Intro to Computer Organization II','Course on Computer Organization',3),('CS3114','Data Structures and Algorithms','Course on Data Structures and Algorithms',3),('CS3214','Computer Systems','Computer System Course',3),('CS3304','Comparative Languages','Course on Comparative Languages',3),('CS3604','Professionalism in Computing','Course on Professionalism in Computing',3),('CS4604','Int Data Base Mgt Sys','Database Course',3),('ENGE1215','Foundations of Engineering','Course on Foundations of Engineering',2),('ENGE1216','Foundations of Engineering','Course on Foundations of Engineering',2),('ENGL1105','First-Year Writing','Course on First-Year Writing',3),('MATH1225','Calculus of a Single Variable','Course on Calculus of a Single Variable',3),('MATH1226','Calculus of a Single Variable','Course on Calculus',3),('MATH2114','Introduction to Linear Algebra','Course on Linear Algebra',3),('MATH2204','Intro to Multivariable Calculus','Course on Multivariable Calculus',3),('MATH2534','Intro to Discrete Math','Course on Discrete Math',3),('PHYS2305','Foundations of Physics I w/lab','Course on Physics',4);
/*!40000 ALTER TABLE `course` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-31 17:57:44
