import React from "react";
import { X, FileText, Download, CheckCircle2, History } from "lucide-react";
import { useGetAssignmentSubmissionHistoryQuery } from "../../Api/adminApi";

const HISTORY_BADGE = {
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  superseded: "bg-gray-100 text-gray-500 border-gray-200",
};

const AssignmentDetailsModal = ({ isOpen, onClose, submission, onGrade }) => {
  const { data: historyData } = useGetAssignmentSubmissionHistoryQuery(submission?.id, {
    skip: !isOpen || !submission?.id,
  });
  const pastAttempts = (historyData || []).filter((row) => row.id !== submission?.id);

  if (!isOpen || !submission) return null;

  const isGraded = submission.status === "Graded";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[881px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-[#7AA4A5] to-[#8eb3b4] text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-['Arimo'] mb-1">
              {submission.assignmentTitle || "Assignment Title Here"}
            </h2>
            <p className="text-white/90 text-base font-normal font-['Arimo']">
              Advanced React Patterns
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Student Information */}
          <div className="p-6 bg-neutral-50 rounded-xl space-y-4">
            <h3 className="text-lg font-bold text-neutral-800 font-['Arimo']">
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-normal text-neutral-500 font-['Arimo'] mb-1">
                  Student Name
                </p>
                <p className="text-sm font-medium text-neutral-800 font-['Arimo']">
                  {submission.studentName}
                </p>
              </div>
              <div>
                <p className="text-sm font-normal text-neutral-500 font-['Arimo'] mb-1">
                  Email
                </p>
                <p className="text-sm font-medium text-neutral-800 font-['Arimo']">
                  {submission.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-normal text-neutral-500 font-['Arimo'] mb-1">
                  Submitted Date
                </p>
                <p className="text-sm font-medium text-neutral-800 font-['Arimo']">
                  {submission.date} at {submission.time}
                </p>
              </div>
            </div>
          </div>

          {/* Student Comments */}
          <div className="p-6 bg-neutral-50 rounded-xl space-y-3">
            <h3 className="text-lg font-bold text-neutral-800 font-['Arimo']">
              Student Comments
            </h3>
            <p className="text-sm font-normal text-neutral-700 leading-relaxed font-['Arimo']">
              {submission.submissionText ||
                submission.rawSubmission?.submission_text ||
                "No student comments were provided."}
            </p>
          </div>

          {/* Submitted Files */}
          <div className="p-6 bg-neutral-50 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#7AA4A5]" />
              <h3 className="text-lg font-bold text-neutral-800 font-['Arimo']">
                Submitted File
              </h3>
            </div>

            <div className="space-y-4">
              {submission.submissionFile ||
              submission.rawSubmission?.submission_file ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:border-[#7AA4A5] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#7AA4A5]/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#7AA4A5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">
                          {(submission.submissionFile || submission.rawSubmission?.submission_file)?.split("/").pop()}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {submission.submissionFile || submission.rawSubmission?.submission_file}
                        </p>
                      </div>
                    </div>
                    <a
                      href={submission.submissionFile || submission.rawSubmission?.submission_file}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#7AA4A5] text-white text-sm font-medium hover:bg-[#6b9192] transition-colors"
                    >
                      Download
                    </a>
                  </div>

                  {/* Video Preview for mp4 */}
                  {(submission.submissionFile || submission.rawSubmission?.submission_file)?.toLowerCase().endsWith('.mp4') && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-neutral-200 bg-black aspect-video flex items-center justify-center">
                       <video 
                        src={submission.submissionFile || submission.rawSubmission?.submission_file} 
                        controls 
                        className="max-h-full max-w-full"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl">
                  <p className="text-sm text-neutral-500">
                    No submitted file attached.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Previous Attempts */}
          {pastAttempts.length > 0 && (
            <div className="p-6 bg-neutral-50 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#7AA4A5]" />
                <h3 className="text-lg font-bold text-neutral-800 font-['Arimo']">
                  Previous Attempts ({pastAttempts.length})
                </h3>
              </div>
              <div className="space-y-3">
                {pastAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-800 font-['Arimo']">
                        {attempt.created_at
                          ? new Date(attempt.created_at).toLocaleString()
                          : "—"}
                      </p>
                      {attempt.teacher_feedback && (
                        <p className="text-xs text-neutral-500 mt-1">{attempt.teacher_feedback}</p>
                      )}
                      {attempt.mark != null && (
                        <p className="text-xs text-neutral-500 mt-1">Mark: {attempt.mark}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        HISTORY_BADGE[attempt.status] || HISTORY_BADGE.pending
                      }`}
                    >
                      {attempt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-8 py-2.5 border border-neutral-300 rounded-xl text-neutral-700 font-medium hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>

          <button
            onClick={onGrade}
            className="px-8 py-2.5 bg-[#7AA4A5] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#6b9192] transition-colors shadow-lg shadow-[#7AA4A5]/20"
          >
            <CheckCircle2 className="w-5 h-5" />
            {isGraded ? "Edit Grade" : "Grade Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailsModal;
