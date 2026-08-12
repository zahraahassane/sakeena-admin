"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Eye, FileText, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import SubmissionsHeader from "../components/SubmissionsHeader";
import AssignmentDetailsModal from "../components/Modal/AssignmentDetailsModal";
import GradeAssignmentModal from "../components/Modal/GradeAssignmentModal";
import QuizDetailsModal from "../Admin/Submission/QuizDetailsModal";
import {
  useGetAssignmentSubmissionsQuery,
  useReviewAssignmentSubmissionMutation,
} from "../Api/adminApi";

// Map API status → display label + color
const STATUS_MAP = {
  pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approved", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
  superseded: { label: "Superseded", color: "bg-gray-100 text-gray-500" },
};

function toModalShape(sub, historyCount = 0) {
  const { label, color } = STATUS_MAP[sub.status] || STATUS_MAP.pending;
  return {
    id: sub.id,
    assignmentTitle: sub.assignment_title,
    studentName: `${sub.user_detail?.first_name ?? ""} ${sub.user_detail?.last_name ?? ""}`.trim(),
    studentEmail: sub.user_detail?.email ?? "",
    submittedDate: sub.created_at
      ? new Date(sub.created_at).toLocaleString()
      : "—",
    studentComments: sub.submission_text || "No text submitted.",
    files: sub.submission_file
      ? [{ name: "Submission File", url: sub.submission_file }]
      : [],
    status: label,
    statusColor: color,
    rawStatus: sub.status,
    mark: sub.mark,
    teacher_feedback: sub.teacher_feedback,
    submissionDate: sub.created_at
      ? new Date(sub.created_at).toLocaleDateString()
      : "—",
    submissionTime: sub.created_at
      ? new Date(sub.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    points: sub.mark != null ? `${sub.mark} pts` : "—",
    historyCount,
  };
}

export default function Submissions() {
  const [submissionType, setSubmissionType] = useState("assignment");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalType, setModalType] = useState(null);

  // Debounce search — wait 400 ms after the user stops typing
  const debounceTimer = useRef(null);
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  const {
    data: submissionsData,
    isLoading,
    isError,
  } = useGetAssignmentSubmissionsQuery(
    {
      status: statusFilter || undefined,
      courseId: courseId || undefined,
      moduleId: moduleId || undefined,
      search: debouncedSearch || undefined,
    },
    { skip: submissionType !== "assignment" }
  );

  const [reviewSubmission, { isLoading: isSaving }] =
    useReviewAssignmentSubmissionMutation();

  // Group submissions by assignment_title, then by student — only the
  // latest attempt per student is shown as a row; older attempts (from
  // resubmission while pending) are reachable via "View history" instead
  // of showing as separate, confusingly-duplicate-looking rows.
  const groupedAssignments = useMemo(() => {
    const results = submissionsData?.results ?? submissionsData ?? [];

    const byTitle = {};
    results.forEach((sub) => {
      const title = sub.assignment_title || "Untitled Assignment";
      if (!byTitle[title]) byTitle[title] = [];
      byTitle[title].push(sub);
    });

    return Object.entries(byTitle).map(([title, subs], i) => {
      const byStudent = {};
      subs.forEach((sub) => {
        const key = sub.user_detail?.id ?? sub.user_detail?.email ?? sub.id;
        if (!byStudent[key]) byStudent[key] = [];
        byStudent[key].push(sub);
      });
      const submissions = Object.values(byStudent).map((attempts) => {
        const sorted = [...attempts].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return toModalShape(sorted[0], sorted.length - 1);
      });
      return { id: i, number: String(i + 1).padStart(2, "0"), title, submissions };
    });
  }, [submissionsData]);

  // --- Quiz data (kept as mock for now) ---
  const quizData = [
    {
      id: 1,
      number: "01",
      title: "Quiz Title Here",
      submissions: [
        {
          id: 1,
          studentName: "Emily Rodriguez",
          studentEmail: "emily@email.com",
          status: "Failed",
          statusColor: "bg-red-100 text-red-700",
          submissionDate: "Jan 14, 2026",
          submissionTime: "12:30 AM",
          points: "20/30",
          percentage: "67%",
          score: "20/30 pts",
          date: "Jan 14, 2026",
          time: "12:30 AM",
          email: "emily@email.com",
          timeSpent: "18 minutes",
          assignmentTitle: "01 Quiz Title Here",
          questions: [],
        },
      ],
    },
  ];

  const openDetails = (submission) => {
    setSelectedSubmission(submission);
    setModalType("details");
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setModalType("grade");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSubmission(null);
  };

  const handleSaveGrade = async ({ status, mark, teacher_feedback }) => {
    try {
      await reviewSubmission({
        id: selectedSubmission.id,
        status,
        mark,
        teacher_feedback,
      }).unwrap();
      toast.success(status === "approved" ? "Assignment approved and graded" : "Assignment rejected");
      closeModal();
    } catch (err) {
      console.error("Failed to save grade:", err);
      toast.error("Failed to save review");
    }
  };

  const currentData =
    submissionType === "assignment" ? groupedAssignments : quizData;

  return (
    <div className="min-h-screen bg-gray-50">
      <SubmissionsHeader
        onTypeChange={setSubmissionType}
        onSearchChange={setSearchQuery}
        onCourseChange={(id) => { setCourseId(id); setModuleId(""); }}
        onModuleChange={setModuleId}
      />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {submissionType === "assignment"
              ? "Assignment Submissions"
              : "Quiz Submissions"}
          </h1>

          {/* Status filter — assignments only */}
          {submissionType === "assignment" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>

        {/* Loading */}
        {submissionType === "assignment" && isLoading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading submissions…</span>
          </div>
        )}

        {/* Error */}
        {submissionType === "assignment" && isError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Failed to load submissions. Make sure you're logged in.</span>
          </div>
        )}

        {/* Empty */}
        {submissionType === "assignment" &&
          !isLoading &&
          !isError &&
          currentData.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No submissions found</p>
              <p className="text-sm mt-1">
                {statusFilter
                  ? "Try clearing the status filter."
                  : "Submissions will appear here once students submit."}
              </p>
            </div>
          )}

        {/* Submissions List */}
        {!isLoading && !isError && (
          <div className="space-y-8">
            {currentData.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${submissionType === "assignment" ? "bg-orange-100" : "bg-purple-100"}`}
                  >
                    <FileText
                      className={`w-6 h-6 ${submissionType === "assignment" ? "text-orange-600" : "text-purple-600"}`}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {section.number} — {section.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {section.submissions.length} submission
                      {section.submissions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Submission Rows */}
                <div className="space-y-4">
                  {section.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      {/* Left */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="pt-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${submission.statusColor}`}
                          >
                            {submission.status}
                          </span>
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {submission.studentName}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {submission.studentEmail}
                          </p>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">📅</span>
                              <span>{submission.submissionDate}</span>
                              <span className="text-gray-400">
                                {submission.submissionTime}
                              </span>
                            </div>
                            {submission.mark != null && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">⭐</span>
                                <span>{submission.mark} pts</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openDetails(submission)}
                          className="flex items-center gap-2 px-3 py-2 text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>

                        {submission.historyCount > 0 && (
                          <button
                            onClick={() => openDetails(submission)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            View history ({submission.historyCount})
                          </button>
                        )}

                        {submissionType === "assignment" && (
                          <button
                            onClick={() => openGradeModal(submission)}
                            className="flex items-center gap-2 px-3 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-sm font-medium"
                          >
                            {submission.rawStatus === "pending"
                              ? "Grade"
                              : "Edit Grade"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType === "details" && submissionType === "assignment" && (
        <AssignmentDetailsModal
          submission={selectedSubmission}
          onClose={closeModal}
          onGrade={openGradeModal}
        />
      )}

      {modalType === "details" && submissionType === "quiz" && (
        <QuizDetailsModal
          isOpen={true}
          onClose={closeModal}
          submission={selectedSubmission}
        />
      )}

      {modalType === "grade" && (
        <GradeAssignmentModal
          submission={selectedSubmission}
          onClose={closeModal}
          onSave={handleSaveGrade}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
