import React, { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useReviewAssignmentSubmissionMutation } from "../../Api/adminApi";
import toast from "react-hot-toast";

const GradeAssignmentModal = ({ isOpen, onClose, submission }) => {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewAssignmentSubmission, { isLoading: isSaving }] =
    useReviewAssignmentSubmissionMutation();

  useEffect(() => {
    if (submission) {
      // If editing, you might want to pre-fill the score if it exists in the submission object
      // For now, let's assume submission.score is something like "45/50" or just a number
      if (submission.score && typeof submission.score === "string") {
        const currentScore = submission.score.split("/")[0];
        setScore(currentScore);
      } else if (submission.score) {
        setScore(submission.score);
      }
      setFeedback(
        submission.teacherFeedback ||
          submission.rawSubmission?.teacher_feedback ||
          "",
      );
    }
  }, [submission, isOpen]);

  if (!isOpen || !submission) return null;

  const totalPoints = submission.maxPoints ?? 100;

  const percentage = score
    ? Math.round((Number(score) / totalPoints) * 100)
    : 0;

  const handleSaveReview = async (status) => {
    if (!feedback.trim()) {
      return toast.error("Please provide feedback.");
    }
    if (status === "approved" && !score) {
      return toast.error("Please provide a score for approval.");
    }

    try {
      await reviewAssignmentSubmission({ 
        id: submission.id, 
        status, 
        teacher_feedback: feedback, 
        mark: status === "approved" ? Number(score) : null 
      }).unwrap();
      toast.success(status === "approved" ? "Assignment approved and graded" : "Assignment rejected");
      onClose();
    } catch (error) {
      console.error("Failed to save review:", error);
      toast.error("Failed to save review");
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[672px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-[#7AA4A5] to-[#8eb3b4] text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-['Arimo'] mb-1">
              Review Assignment
            </h2>
            <p className="text-white/90 text-base font-normal font-['Arimo']">
              {submission.assignmentTitle || "Build a Custom Hook"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Student Info Card */}
          <div className="p-4 bg-neutral-50 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-[#7AA4A5] rounded-full flex items-center justify-center text-white font-bold text-lg">
              {getInitials(submission.studentName)}
            </div>
            <div>
              <h4 className="text-base font-bold text-neutral-800 font-['Arimo']">
                {submission.studentName}
              </h4>
              <p className="text-sm font-normal text-neutral-500 font-['Arimo']">
                {submission.email}
              </p>
            </div>
          </div>

          {/* Score Input */}
          <div className="space-y-3">
            <label className="text-sm font-normal text-neutral-700 font-['Arimo'] flex items-center gap-1">
              Score <span className="text-xs text-neutral-400 font-normal">(Required for Approval)</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="w-32">
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-lg font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20 focus:border-[#7AA4A5] transition-all"
                />
              </div>
              <span className="text-neutral-600 text-base font-normal font-['Arimo']">
                / {totalPoints} points
              </span>
              <div className="flex-1 text-right">
                <span
                  className={`text-3xl font-bold font-['Arimo'] ${percentage > 0 ? "text-[#7AA4A5]" : "text-neutral-300"}`}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Input */}
          <div className="space-y-2">
            <label className="text-sm font-normal text-neutral-700 font-['Arimo'] flex items-center gap-1">
              Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback to help the student improve..."
              className="w-full h-44 px-4 py-3 bg-white border border-neutral-300 rounded-xl text-base font-normal text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20 focus:border-[#7AA4A5] transition-all resize-none"
            />
            <p className="text-xs text-neutral-500 font-normal font-['Arimo']">
              Be specific and constructive in your feedback
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-8 py-2.5 border border-neutral-300 rounded-xl text-neutral-700 font-medium hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-3">
             <button
              onClick={() => handleSaveReview("rejected")}
              disabled={isSaving}
              className="px-8 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => handleSaveReview("approved")}
              disabled={isSaving}
              className="px-8 py-2.5 bg-[#7AA4A5] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#6b9192] transition-colors shadow-lg shadow-[#7AA4A5]/20 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : <><CheckCircle2 className="w-5 h-5 font-bold" /> Approve & Score</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeAssignmentModal;
