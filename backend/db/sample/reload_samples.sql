DELETE FROM DiscussionPost;
DELETE FROM Rating;
DELETE FROM CourseInstructor;
DELETE FROM Student;
DELETE FROM Teacher;
DELETE FROM SysAdmin;
DELETE FROM User;
DELETE FROM Course;
DELETE FROM Semester;

SOURCE backend/db/sample/coursediscussionplatform_user.sql;
SOURCE backend/db/sample/coursediscussionplatform_student.sql;
SOURCE backend/db/sample/coursediscussionplatform_teacher.sql;
SOURCE backend/db/sample/coursediscussionplatform_sysadmin.sql;
SOURCE backend/db/sample/coursediscussionplatform_course.sql;
SOURCE backend/db/sample/coursediscussionplatform_semester.sql;
SOURCE backend/db/sample/coursediscussionplatform_courseinstructor.sql;
SOURCE backend/db/sample/coursediscussionplatform_rating.sql;
SOURCE backend/db/sample/coursediscussionplatform_discussionpost.sql;