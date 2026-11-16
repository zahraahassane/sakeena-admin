// Helpers for courses that can have several teachers (lead first).

// Returns the ordered teachers array (lead first). Falls back to the single
// `teacher` field when the API response has no `teachers` array.
export const getCourseTeachers = (course) => {
  if (!course) return [];
  if (Array.isArray(course.teachers) && course.teachers.length > 0) {
    return course.teachers.filter(Boolean);
  }
  return course.teacher ? [course.teacher] : [];
};

// Display name for one teacher object (full shape or trimmed `full_name` shape).
export const getTeacherName = (teacher) => {
  if (!teacher) return "";
  if (teacher.full_name) return teacher.full_name.trim();
  const first = teacher.user?.first_name || "";
  const last = teacher.user?.last_name || "";
  return `${first} ${last}`.trim();
};

// ["A"] => "A", ["A","B"] => "A and B", ["A","B","C"] => "A, B and C"
export const joinNames = (names) => {
  const list = (names || []).filter(Boolean);
  if (list.length <= 1) return list[0] || "";
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
};

// All teacher names of a course joined for display. Empty string if none.
export const getCourseTeacherNames = (course) =>
  joinNames(getCourseTeachers(course).map(getTeacherName));
