import React from "react";
import { getCourseTeacherNames } from "../../utils/courseTeachers";
import { X, BookOpen } from "lucide-react";
import {
  useGetStudentProfileQuery,
  useGetEnrollmentsQuery,
} from "../../Api/adminApi";

const StudentDetailsModal = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;

  const { data: studentDetails } = useGetStudentProfileQuery(student.id);
  const { data: enrollments } = useGetEnrollmentsQuery(
    studentDetails?.user.id,
    { skip: !studentDetails },
  );

  const courses = enrollments?.results || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[600px] bg-white rounded-[10px] shadow-2xl outline outline-1 outline-black/10 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-black/5 relative">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 p-1 rounded-sm hover:bg-gray-100 transition-colors opacity-70"
          >
            <X className="w-4 h-4 text-neutral-950" />
          </button>
          <h2 className="text-neutral-950 text-xl font-bold arimo-font leading-none mb-2">
            Student Details
          </h2>
          <p className="text-gray-500 text-sm font-normal arimo-font">
            View detailed information about the student
          </p>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-8">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-950 text-sm font-normal arimo-font">
                Full Name
              </label>
              <div className="px-3 py-3.5 bg-gray-50 rounded-lg text-neutral-950 text-base arimo-font border border-black/5">
                {studentDetails
                  ? `${studentDetails.user.first_name} ${studentDetails.user.last_name}`.trim() ||
                  studentDetails.user.email.split("@")[0]
                  : student.name}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-neutral-950 text-sm font-normal arimo-font">
                Email Address
              </label>
              <div className="px-3 py-3.5 bg-gray-50 rounded-lg text-neutral-950 text-base arimo-font border border-black/5">
                {studentDetails?.user.email || student.email}
              </div>
            </div>

          </div>

          {/* Enrolled Courses Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-blue-50">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-neutral-950 text-base font-normal arimo-font">
                Enrolled Courses ({courses.length})
              </h3>
            </div>

            <div className="rounded-[10px] border border-black/10 overflow-hidden max-h-[250px] overflow-y-auto">
              <table className="w-full text-sm text-left arimo-font">
                <thead className="border-b border-black/10 sticky top-0 bg-white">
                  <tr>
                    <th className="py-2.5 px-4 font-normal text-neutral-950">
                      Course Name
                    </th>
                    <th className="py-2.5 px-4 font-normal text-neutral-950">
                      Teacher
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {courses.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-neutral-950">
                        {enrollment?.course?.title}
                      </td>
                      <td className="py-3 px-4 text-neutral-950">
                        {getCourseTeacherNames(enrollment?.course) || "No teacher assign yet"}
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td
                        colSpan="2"
                        className="py-8 text-center text-gray-400 italic"
                      >
                        No courses enrolled
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 border-t border-black/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-black/10 rounded-lg hover:bg-gray-50 text-neutral-950 text-sm arimo-font transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
