import React, { useState } from "react";
import { Search, Filter, BookOpen, FileText } from "lucide-react";
import AssignmentSection from "./AssignmentSection";
import QuizSection from "./QuizSection";
import { 
  useGetAssignmentSubmissionsQuery,
  useGetQuizAttemptsQuery,
  useGetCoursesDataQuery
} from "../../Api/adminApi";

const Submission = () => {
  const [activeTab, setActiveTab] = useState("assignment");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const queryParams = selectedStatus ? { status: selectedStatus } : {};

  const {
    data: assignmentSubmissionsData = [],
    isLoading: isAssignmentsLoading,
    isError: assignmentError,
  } = useGetAssignmentSubmissionsQuery(queryParams, { skip: activeTab !== "assignment" });

  const { data: coursesData } = useGetCoursesDataQuery({ page: 1 }, { skip: activeTab !== "quiz" });
  const courses = coursesData?.results || coursesData || [];

  const {
    data: quizAttemptsData = [],
    isLoading: isQuizLoading,
    isError: quizError,
  } = useGetQuizAttemptsQuery({ courseId: selectedCourseId, page: 1 }, { skip: activeTab !== "quiz" });
  const assignmentSubmissions = assignmentSubmissionsData.map((submission) => {
    const studentName =
      `${submission.user_detail?.first_name || ""} ${submission.user_detail?.last_name || ""}`.trim();
    const email = submission.user_detail?.email || "Unknown email";
    const createdAt = submission.created_at;
    const markValue = submission.mark != null ? Number(submission.mark) : null;
    const totalPoints = 50;

    const isGraded =
      markValue != null ||
      Boolean(submission.teacher_feedback) ||
      submission.status === "approved" ||
      submission.status === "rejected";

    return {
      id: submission.id,
      userId: submission.user_detail?.id ?? null,
      studentName: studentName || email,
      email,
      date: formatDate(createdAt),
      time: formatTime(createdAt),
      score:
        markValue != null && !Number.isNaN(markValue)
          ? `${markValue}/${totalPoints} pts`
          : "—",
      percentage:
        markValue != null && !Number.isNaN(markValue)
          ? `${Math.round((markValue / totalPoints) * 100)}%`
          : "Pending",
      status:
        submission.status === "pending"
          ? "Pending"
          : submission.status === "approved"
            ? "Approved"
            : submission.status === "rejected"
              ? "Rejected"
              : submission.status,
      type: "Assignment",
      assignmentTitle: submission.assignment_title || "Untitled Assignment",
      submissionText: submission.submission_text,
      submissionFile: submission.submission_file,
      teacherFeedback: submission.teacher_feedback,
      reviewedAt: submission.reviewed_at,
      isGraded,
      rawSubmission: submission,
    };
  });

  // Map real quiz data
  const quizSubmissions = quizAttemptsData.map((quiz) => {
    return {
      id: quiz.id,
      studentName: quiz.student_name,
      email: quiz.student_email,
      date: formatDate(quiz.created_at),
      time: formatTime(quiz.created_at),
      timeSpent: "", // Not provided by API list endpoint
      score: `${Number(quiz.score)}% Score`, 
      percentage: `Passing: ${Number(quiz.passing_score)}%`,
      status: quiz.passed ? "Passed" : "Failed",
      type: "Quiz",
      assignmentTitle: quiz.course_title || "Course Quiz",
      questions: [], 
      rawSubmission: quiz,
    };
  });

  // Filter submissions based on search term
  const filteredAssignments = assignmentSubmissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredQuizzes = quizSubmissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Grouping titles for UI categories based on filtered data
  const assignmentCategories = [
    ...new Set(filteredAssignments.map((s) => s.assignmentTitle)),
  ];
  const quizCategories = [
    ...new Set(filteredQuizzes.map((s) => s.assignmentTitle)),
  ];

  return (
    <div className="p-6 bg-[#FAFAFA] min-h-screen arimo-font">
      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-neutral-200">
        <button
          className={`pb-3 px-2 font-bold flex items-center gap-2 ${
            activeTab === "assignment"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
          onClick={() => setActiveTab("assignment")}
        >
          <BookOpen className="w-5 h-5" /> Assignments
        </button>
        <button
          className={`pb-3 px-2 font-bold flex items-center gap-2 ${
            activeTab === "quiz"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
          onClick={() => setActiveTab("quiz")}
        >
          <FileText className="w-5 h-5" /> Quizzes
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-neutral-200 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by student name or content title..."
            className="w-full pl-12 pr-4 py-2.5 rounded-[10px] border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "quiz" && (
            <div className="relative">
              <select
                className="px-4 py-2.5 w-[250px] rounded-[10px] border border-neutral-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none pr-10 text-neutral-950/50"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">Select Course for Quizzes...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          <button className="p-2.5 rounded-[10px] border border-neutral-300 hover:bg-neutral-50 transition-colors">
            <Filter className="w-5 h-5 text-neutral-500" />
          </button>

          {activeTab === "assignment" && (
            <div className="relative">
              <select
                className="px-4 py-2.5 w-[180px] rounded-[10px] border border-neutral-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none pr-10 text-neutral-950/50"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-stone-500 flex items-center justify-between">
        <div>
          {activeTab === "assignment" && isAssignmentsLoading && "Loading assignment submissions..."}
          {activeTab === "quiz" && isQuizLoading && "Loading quiz attempts..."}
          {activeTab === "assignment" && assignmentError && (
            <span className="text-red-500">Unable to load assignment submissions. Please refresh.</span>
          )}
          {activeTab === "quiz" && quizError && (
            <span className="text-red-500">Unable to load quiz attempts. Please refresh.</span>
          )}
        </div>
      </div>

      {/* Conditional Rendering of Sections */}
      {activeTab === "assignment" && (
        <AssignmentSection
          categories={assignmentCategories}
          submissions={filteredAssignments}
        />
      )}
      
      {activeTab === "quiz" && (
        selectedCourseId ? (
          filteredQuizzes.length > 0 ? (
            <QuizSection
              categories={quizCategories}
              submissions={filteredQuizzes}
            />
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-stone-200 rounded-[2rem] bg-white mt-10">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-stone-700">No attempts found</h3>
              <p className="text-stone-500 mt-2">There are no quiz attempts matching your search criteria.</p>
            </div>
          )
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-stone-200 rounded-[2rem] bg-white mt-10">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-700">Select a Course</h3>
            <p className="text-stone-500 mt-2">Please select a course from the dropdown above to view its quiz attempts.</p>
          </div>
        )
      )}
    </div>
  );
};

export default Submission;
