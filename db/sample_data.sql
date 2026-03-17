# Used to delete existing entries
# SET FOREIGN_KEY_CHECKS = 0;
# TRUNCATE TABLE user;
# TRUNCATE TABLE course;
# TRUNCATE TABLE student;
# TRUNCATE TABLE teacher
# TRUNCATE TABLE sysadmin;
# TRUNCATE TABLE semester;
# TRUNCATE TABLE courseinstructor;
# TRUNCATE TABLE discussionpost;
# TRUNCATE TABLE rating;
# SET FOREIGN_KEY_CHECKS = 1;

# This is adding to user
INSERT INTO user
VALUES (1, "mmle04@vt.edu", "Michael", NOW(), "student"),
(2, "gvwilson@vt.edu", "Grant", NOW(), "student"),
(3, "quinng05@vt.edu", "Quinn", NOW(), "student"),
(4, "rohanchodapunedi@vt.edu", "Rohan", NOW(), "student"),
(5, "bobbysmith@vt.edu", "Bobby", NOW(), "student"),
(6, "professorjohndoe@vt.edu", "John", NOW(), "teacher"),
(7, "professorjanedoe@vt.edu", "Jane", NOW(), "teacher"),
(8, "emilydavis@vt.edu", "Emily", NOW(), "teacher"),
(9, "RobertBrown@vt.edu", "Robert", NOW(), "teacher"),
(10, "marythomas@vt.edu", "Mary", NOW(), "teacher"),
(11, "sysadmin1@vt.edu", "sysadmin1", NOW(), "sysadmin"),
(12, "sysadmin2@vt.edu", "sysadmin2", NOW(), "sysadmin"),
(13, "sysadmin3@vt.edu", "sysadmin3", NOW(), "sysadmin"),
(14, "sysadmin4@vt.edu", "sysadmin4", NOW(), "sysadmin"),
(15, "sysadmin5@vt.edu", "sysadmin5", NOW(), "sysadmin");


# This is adding to courses
INSERT INTO course
VALUES ("CHEM1035", "General Chemistry", "Course on General Chemistry", 3),
("ENGL1105", "First-Year Writing", "Course on First-Year Writing", 3),
("MATH1226", "Calculus of a Single Variable", "Course on Calculus", 3),
("CS3214", "Computer Systems", "Computer System Course", 3),
("CS4604", "Int Data Base Mgt Sys", "Database Course", 3);

# This is adding to student
INSERT INTO student
VALUES (1, "ENGL"), (2, "MATH"), (3, "CS"), (4, "CS"), (5, "CHEM");

# This is adding to teacher
INSERT INTO teacher
VALUES (6, "CS"), (7, "CS"), (8, "MATH"), (9, "ENGL"), (10, "CHEM");

# This is adding to sysadmin
INSERT INTO sysadmin
VALUES (11), (12), (13), (14), (15);

# This is adding to semester
INSERT INTO semester
VALUES (1, "Fall", 2025, "2025-08-24", "2025-12-09"),
(2, "Spring", 2025, "2025-01-20", "2025-05-06"),
(3, "Spring", 2026, "2026-01-20", "2026-05-06"),
(4, "Summer", 2026, "2026-05-26", "2026-07-06"),
(5, "Fall", 2026, "2026-08-24", "2026-12-09");

# This is adding to courseinstructor
INSERT INTO courseinstructor
VALUES (1, "CHEM1035", 10, 11),
(2, "ENGL1105", 9, 11),
(3, "MATH1226", 8, 12),
(4, "CS3214", 6, 13),
(5, "CS4604", 7, 14);

# This is adding to discussionpost
INSERT INTO discussionpost
VALUES (1, "This class sucks", "2025-12-02", 1, 1, 1, 1),
(2, "I loved the way this class was taught", NOW(), 5, 3, 2, 2),
(3, "This class was too difficult", "2025-02-28", 4, 2, 1, 3),
(4, "I enjoyed learning in this class", "2025-11-28", 5, 1, 3, 4),
(5, "I found the class to be boring", "2026-03-16", 3, 3, 4, 5);

# This is adding to discussionpost
INSERT INTO rating
VALUES (1, 1, "Hate this class", "2025-12-02", 1, 1, 1),
(2, 5, "Great Class", NOW(), 2, 5, 3),
(3, 3, "Too hard", "2025-02-28", 1, 2, 4),
(4, 4, "It was enjoyable", "2025-11-28", 3, 1, 5),
(5, 2, "Boring", "2026-03-16", 4, 3, 3);

SELECT * FROM user;
