import React from "react";
import {
  BookOpen,
  User,
  Calendar,
  Award,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  History,
  X,
} from "lucide-react";
import AssignmentDetailsModal from "./AssignmentDetailsModal";
import GradeAssignmentModal from "./GradeAssignmentModal";

// Groups a title's submissions by student, keeping only the latest attempt
// as the row to render — older attempts (from resubmission while pending)
// are surfaced via "View history" instead of showing as separate,
// confusingly-duplicate-looking cards.
function groupByStudent(forTitle) {
  const byStudent = {};
  forTitle.forEach((s) => {
    const key = s.userId ?? s.email;
    if (!byStudent[key]) byStudent[key] = [];
    byStudent[key].push(s);
  });

  return Object.values(byStudent).map((attempts) => {
    const sorted = [...attempts].sort(
      (a, b) => new Date(b.rawSubmission.created_at) - new Date(a.rawSubmission.created_at)
    );
    return { latest: sorted[0], history: sorted.slice(1) };
  });
}

const AssignmentSection = ({ categories, submissions }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = React.useState(false);
  const [selectedSubmission, setSelectedSubmission] = React.useState(null);

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleGrade = (submission) => {
    setSelectedSubmission(submission);
    setIsGradeModalOpen(true);
  };

  return (
    <div className="space-y-10">
      {categories.map((title, catIdx) => (
        <div key={catIdx} className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-orange-100 rounded-[10px] flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-orange-600" strokeWidth={1.5} />
            </div>
            <h2 className="text-[28px] font-bold text-neutral-800 leading-[28px]">
              {title}
            </h2>
          </div>

          {/* Submission Cards */}
          <div className="space-y-4">
            {groupByStudent(submissions.filter((s) => s.assignmentTitle === title)).map(
              ({ latest: submission, history }) => (
                <div
                  key={submission.id}
                  className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex-1 space-y-5">
                    {/* Tags */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-4 py-1 rounded-[32px] text-xs font-bold inline-flex items-center gap-1.5 border ${
                          submission.status === "Approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : submission.status === "Rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {submission.status === "Approved" ? (
                          <CheckCircle2
                            className="w-3.5 h-3.5"
                            strokeWidth={2.5}
                          />
                        ) : submission.status === "Rejected" ? (
                          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        ) : (
                          <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                        )}
                        {submission.status}
                      </div>
                      <div className="px-4 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-[32px] text-xs font-bold">
                        {submission.type}
                      </div>
                      {history.length > 0 && (
                        <button
                          onClick={() => handleViewDetails(submission)}
                          className="px-4 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-[32px] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" strokeWidth={2.5} />
                          View history ({history.length})
                        </button>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-[40px] h-[40px] rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {submission.studentName}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {submission.email}
                          </p>
                        </div>
                      </div>

                      {/* Submission Date */}
                      <div className="flex items-center gap-3">
                        <div className="w-[40px] h-[40px] rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {submission.date}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {submission.time}
                          </p>
                        </div>
                      </div>

                      {/* Grade Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-[40px] h-[40px] rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                          <Award className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-800">
                            {submission.score}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {submission.percentage}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleViewDetails(submission)}
                      className="flex-1 md:flex-none px-6 py-2.5 rounded-[10px] border border-slate-300 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4 stroke-[1.5]" />
                      <span>View Details</span>
                    </button>

                    {submission.isGraded ? (
                      <button
                        onClick={() => handleGrade(submission)}
                        className="flex-1 md:flex-none px-6 py-2.5 rounded-[10px] border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4 stroke-[1.5]" />
                        Edit Grade
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrade(submission)}
                        className="flex-1 md:flex-none px-6 py-2.5 rounded-[10px] bg-[#7AA4A5] text-white text-sm font-medium hover:bg-[#6b9192] transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                        Grade Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
      <AssignmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submission={selectedSubmission}
        onGrade={() => {
          setIsModalOpen(false);
          setIsGradeModalOpen(true);
        }}
      />
      <GradeAssignmentModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        submission={selectedSubmission}
      />
    </div>
  );
};

export default AssignmentSection;
