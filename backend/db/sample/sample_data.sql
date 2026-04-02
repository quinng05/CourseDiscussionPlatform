-- Disable checks for clean import
SET FOREIGN_KEY_CHECKS = 0;

-- Course
INSERT INTO Course (courseCode, title, description, credits) VALUES
('CHEM1035', 'General Chemistry', 'Course on General Chemistry', 3),
('CHEM1045', 'General Chemistry Lab', 'Chem Lab', 1),
('CS1114', 'Intro to Software Design', 'Course on Software Design', 3),
('CS2104', 'Intro to Problem Solving', 'Course on Intro to Problem Solving', 3),
('CS2505', 'Intro to Computer Organization', 'Course on Computer Organization', 3),
('CS2506', 'Intro to Computer Organization II', 'Course on Computer Organization', 3),
('CS3114', 'Data Structures and Algorithms', 'Course on Data Structures and Algorithms', 3),
('CS3214', 'Computer Systems', 'Computer System Course', 3),
('CS3304', 'Comparative Languages', 'Course on Comparative Languages', 3),
('CS3604', 'Professionalism in Computing', 'Course on Professionalism in Computing', 3),
('CS4604', 'Int Data Base Mgt Sys', 'Database Course', 3),
('ENGE1215', 'Foundations of Engineering', 'Course on Foundations of Engineering', 2),
('ENGE1216', 'Foundations of Engineering', 'Course on Foundations of Engineering', 2),
('ENGL1105', 'First-Year Writing', 'Course on First-Year Writing', 3),
('MATH1225', 'Calculus of a Single Variable', 'Course on Calculus of a Single Variable', 3),
('MATH1226', 'Calculus of a Single Variable', 'Course on Calculus', 3),
('MATH2114', 'Introduction to Linear Algebra', 'Course on Linear Algebra', 3),
('MATH2204', 'Intro to Multivariable Calculus', 'Course on Multivariable Calculus', 3),
('MATH2534', 'Intro to Discrete Math', 'Course on Discrete Math', 3),
('PHYS2305', 'Foundations of Physics I w/lab', 'Course on Physics', 4);

-- User
INSERT INTO User (userId, email, name, passwordHash, createdAt, userType) VALUES
(1,  'mmle04@vt.edu',            'Michael',  'Sunrise#42',      '2026-03-17 20:10:33', 'student'),
(2,  'gvwilson@vt.edu',          'Grant',    'BlueMoon$17',     '2026-03-17 20:10:33', 'student'),
(3,  'quinng05@vt.edu',          'Quinn',    'FireFly!88',      '2026-03-17 20:10:33', 'student'),
(4,  'rohanchodapunedi@vt.edu',  'Rohan',    'RainDrop@55',     '2026-03-17 20:10:33', 'student'),
(5,  'bobbysmith@vt.edu',        'Bobby',    'StarLight#73',    '2026-03-17 20:10:33', 'student'),
(6,  'professorjohndoe@vt.edu',  'John',     'OceanWave$31',    '2026-03-17 20:10:33', 'teacher'),
(7,  'professorjanedoe@vt.edu',  'Jane',     'ThunderBolt!64',  '2026-03-17 20:10:33', 'teacher'),
(8,  'emilydavis@vt.edu',        'Emily',    'MoonRise@29',     '2026-03-17 20:10:33', 'teacher'),
(9,  'RobertBrown@vt.edu',       'Robert',   'SilverFox#91',    '2026-03-17 20:10:33', 'teacher'),
(10, 'marythomas@vt.edu',        'Mary',     'GoldenEagle$47',  '2026-03-17 20:10:33', 'teacher'),
(11, 'sysadmin1@vt.edu',         'sysadmin1','CrimsonTide!83',  '2026-03-17 20:10:33', 'sysadmin'),
(12, 'sysadmin2@vt.edu',         'sysadmin2','IronClad@56',     '2026-03-17 20:10:33', 'sysadmin'),
(13, 'sysadmin3@vt.edu',         'sysadmin3','NightOwl#38',     '2026-03-17 20:10:33', 'sysadmin'),
(14, 'sysadmin4@vt.edu',         'sysadmin4','SwiftWind$72',    '2026-03-17 20:10:33', 'sysadmin'),
(15, 'sysadmin5@vt.edu',         'sysadmin5','BlazeRunner!15',  '2026-03-17 20:10:33', 'sysadmin'),
(16, 'alicejohnson@vt.edu',      'Alice',    'FrostBite@44',    '2026-03-17 20:10:33', 'student'),
(17, 'bobsmith@vt.edu',          'Bob',      'EmberGlow#67',    '2026-03-17 20:10:33', 'student'),
(18, 'charliewilson@vt.edu',     'Charlie',  'CobraStrike$22',  '2026-03-17 20:10:33', 'student'),
(19, 'professormarkdoe@vt.edu',  'Mark',     'PhoenixRise!79',  '2026-03-17 20:10:33', 'teacher'),
(20, 'professorguydos@vt.edu',   'Guy',      'TigerClaw@93',    '2026-03-17 20:10:33', 'teacher');

-- Student
INSERT INTO Student (userId, major) VALUES
(1,  'ENGL'),
(2,  'MATH'),
(3,  'CS'),
(4,  'CS'),
(5,  'CHEM'),
(16, 'PHYS'),
(17, 'ENGE'),
(18, 'ENGL');

-- Teacher
INSERT INTO Teacher (userId, department) VALUES
(6,  'CS'),
(7,  'CS'),
(8,  'MATH'),
(9,  'ENGL'),
(10, 'CHEM'),
(19, 'PHYS'),
(20, 'ENGE');

-- SysAdmin
INSERT INTO SysAdmin (userId) VALUES
(11),
(12),
(13),
(14),
(15);

-- Semester
INSERT INTO Semester (semesterId, term, year, startDate, endDate) VALUES
(1, 'Fall',   2025, '2025-08-24', '2025-12-09'),
(2, 'Spring', 2025, '2025-01-20', '2025-05-06'),
(3, 'Spring', 2026, '2026-01-20', '2026-05-06'),
(4, 'Summer', 2026, '2026-05-26', '2026-07-06'),
(5, 'Fall',   2026, '2026-08-24', '2026-12-09');

-- CourseInstructor
INSERT INTO CourseInstructor (courseInstructorId, courseCode, teacherId, createdByUserId) VALUES
(1, 'CHEM1035', 10, 11),
(2, 'ENGL1105',  9, 11),
(3, 'MATH1226',  8, 12),
(4, 'CS3214',    6, 13),
(5, 'CS4604',    7, 14);

-- Rating
INSERT INTO Rating (ratingId, score, createdAt, studentId, courseInstructorId, semesterId) VALUES
(1,  1,  '2025-12-02 05:00:00', 1, 1, 1),
(2,  5,  '2026-03-17 20:10:34', 2, 5, 3),
(3,  3,  '2025-02-28 05:00:00', 1, 2, 2),
(4,  4,  '2025-11-28 05:00:00', 3, 1, 1),
(5,  2,  '2026-03-16 04:00:00', 4, 3, 3),
(10, 10, '2026-04-02 06:02:44', 1, 3, 3),
(14, 2,  '2026-04-02 06:26:37', 2, 1, 3),
(15, 10, '2026-04-02 06:27:51', 2, 4, 1);

-- DiscussionPost
INSERT INTO DiscussionPost (postId, postText, createdAt, courseInstructorId, semesterId, authorId, parentPostId, ratingId) VALUES
(1,  'This class sucks',                      '2025-12-02 05:00:00', 1, 1,    1, NULL, 1),
(2,  'I loved the way this class was taught', '2026-03-17 20:10:34', 5, 3,    2, NULL, 2),
(3,  'This class was too difficult',          '2025-02-28 05:00:00', 2, 2,    1, NULL, 3),
(4,  'I enjoyed learning in this class',      '2025-11-28 05:00:00', 1, 1,    3, NULL, 4),
(5,  'I found the class to be boring',        '2026-03-16 04:00:00', 3, 3,    4, NULL, 5),

-- Re-enable checks
SET FOREIGN_KEY_CHECKS = 1;