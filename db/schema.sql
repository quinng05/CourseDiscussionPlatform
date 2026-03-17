CREATE TABLE User (
    userId      INT          PRIMARY KEY AUTO_INCREMENT, -- arbitrary unique ID
    email       VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    createdAt   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    userType    ENUM('student', 'teacher', 'sysadmin') NOT NULL
);

CREATE TABLE Student (
    userId  INT         PRIMARY KEY,
    major   VARCHAR(100) NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE -- if a User is deleted, also delete their subtype
);

CREATE TABLE Teacher (
    userId      INT          PRIMARY KEY,
    department  VARCHAR(100) NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE
);

CREATE TABLE SysAdmin (
    userId  INT PRIMARY KEY,
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE
);

CREATE TABLE Course (
    courseCode  VARCHAR(10)  PRIMARY KEY, -- e.g. CS4604, MATH4184...
    title       VARCHAR(200) NOT NULL, -- e.g. "Int Data Base Mgt Sys"
    description TEXT         NOT NULL,
    credits     INT          NOT NULL
);

CREATE TABLE Semester (
    semesterId  INT PRIMARY KEY AUTO_INCREMENT,
    term        ENUM('Fall', 'Spring', 'Summer') NOT NULL,
    year        INT          NOT NULL,
    startDate   DATE         NOT NULL,
    endDate     DATE         NOT NULL,
    UNIQUE (term, year),
    CHECK (endDate > startDate),
    CHECK (year >= 2000)
);

CREATE TABLE CourseInstructor (
    courseInstructorId  INT PRIMARY KEY AUTO_INCREMENT,
    courseCode          VARCHAR(20) NOT NULL,
    teacherId           INT         NOT NULL,
    createdByUserId     INT         NOT NULL,
    UNIQUE (courseCode, teacherId),
    FOREIGN KEY (courseCode)      REFERENCES Course(courseCode)   ON DELETE CASCADE, -- delete course-instructor pair (forum) if course is removed
    FOREIGN KEY (teacherId)       REFERENCES Teacher(userId)      ON DELETE CASCADE, -- same behavior for teacher (instructor) deletion
    FOREIGN KEY (createdByUserId) REFERENCES SysAdmin(userId)     ON DELETE RESTRICT -- block deletion of admin who created a forum
);

CREATE TABLE Rating (
    ratingId            INT PRIMARY KEY AUTO_INCREMENT,
    score               INT       NOT NULL,
    comment             TEXT,
    createdAt           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    studentId           INT       NOT NULL,
    courseInstructorId  INT       NOT NULL,
    semesterId          INT       NOT NULL,
    UNIQUE (studentId, courseInstructorId, semesterId),
    CHECK (score BETWEEN 1 AND 5),
    FOREIGN KEY (studentId)          REFERENCES Student(userId)           ON DELETE CASCADE, -- delete rating if student deletion occurs
    FOREIGN KEY (courseInstructorId) REFERENCES CourseInstructor(courseInstructorId) ON DELETE CASCADE, -- delete rating if forum deletion occurs
    FOREIGN KEY (semesterId)         REFERENCES Semester(semesterId)       ON DELETE RESTRICT
);

CREATE TABLE DiscussionPost (
    postId              INT PRIMARY KEY AUTO_INCREMENT,
    postText            TEXT      NOT NULL,
    createdAt           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    courseInstructorId  INT       NOT NULL,
    semesterId          INT,
    authorId            INT       NOT NULL,
    parentPostId        INT,
    FOREIGN KEY (courseInstructorId) REFERENCES CourseInstructor(courseInstructorId) ON DELETE CASCADE,
    FOREIGN KEY (semesterId)         REFERENCES Semester(semesterId)  ON DELETE SET NULL,
    FOREIGN KEY (authorId)           REFERENCES User(userId)          ON DELETE CASCADE,
    FOREIGN KEY (parentPostId)       REFERENCES DiscussionPost(postId) ON DELETE CASCADE
);