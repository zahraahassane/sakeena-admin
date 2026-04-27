import React, { useState } from "react";
import { User, Calendar, CheckCircle2, XCircle, Search, Mail, Loader2, Award } from "lucide-react";
import { useGetCourseEnrollmentsQuery } from "../../Api/adminApi";
import Pagination from "../../components/Pagination";

const CourseEnrollments = ({ courseId }) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useGetCourseEnrollmentsQuery({
    courseId,
    page,
    pageSize: 10,
  });

  const enrollments = data?.results || [];
  const totalPages = data?.total_pages || 1;

  // Search filtering locally if API doesn't support search param for enrollments
  // This will apply to current page only. If global search is needed, backend should support ?search=
  const filteredEnrollments = enrollments.filter(
    (e) =>
      e.student?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.student?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-6 md:p-8 flex flex-col min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-stone-900 arimo-font tracking-tight mb-1">
            Student Enrollments
          </h2>
          <p className="text-stone-500 text-sm font-medium">
            Manage and view all students currently enrolled in this course
          </p>
        </div>

        <div className="flex items-center w-full md:w-auto relative max-w-sm">
          <Search className="w-5 h-5 text-stone-400 absolute left-4" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-stone-400"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
            <p className="text-stone-500 font-medium">Loading enrollments...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-stone-800 font-bold mb-1">Failed to load data</p>
            <p className="text-stone-500 text-sm">Please try refreshing the page.</p>
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-2xl border border-stone-100 mb-6">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-stone-400 inter-font whitespace-nowrap">
                      Student Details
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-stone-400 inter-font whitespace-nowrap">
                      Enrolled Date
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-stone-400 inter-font whitespace-nowrap text-center">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-stone-400 inter-font whitespace-nowrap text-center">
                      Completion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredEnrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="group hover:bg-teal-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden shrink-0 border border-stone-200">
                          {enrollment.student?.profile_picture ? (
                            <img
                              src={enrollment.student.profile_picture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 group-hover:text-teal-700 transition-colors truncate">
                            {enrollment.student?.first_name || "Unknown"}{" "}
                            {enrollment.student?.last_name || ""}
                          </p>
                          <div className="flex items-center gap-1.5 text-stone-500 mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-xs truncate">
                              {enrollment.student?.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-stone-600 font-medium text-sm">
                          <Calendar className="w-4 h-4 text-stone-400" />
                          {formatDate(enrollment.enrolled_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                            enrollment.is_completed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {enrollment.is_completed ? "Completed" : "In Progress"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {enrollment.is_completed ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Finished</span>
                            </div>
                            <span className="text-[10px] text-stone-400 font-medium">
                              {formatDate(enrollment.completed_at)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-stone-400 font-medium text-sm">
                            <Loader2 className="w-4 h-4 animate-spin-slow" />
                            <span>Learning</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-auto pt-4 border-t border-stone-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[400px] bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-stone-100">
              <Award className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">
              {searchQuery ? "No matching students found" : "No Enrollments Yet"}
            </h3>
            <p className="text-stone-500 max-w-sm">
              {searchQuery
                ? `No students matching "${searchQuery}" are enrolled in this course.`
                : "When students enroll in this course, they will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseEnrollments;
