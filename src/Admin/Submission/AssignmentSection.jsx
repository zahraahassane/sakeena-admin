import React from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
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
// confusingly-duplicate-looking rows.
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

function buildRows(submissions) {
  // Bucket by the real assignment id, not the title — two different
  // Assignment records can coincidentally share a title (e.g. a duplicated
  // lesson), and grouping by title alone would wrongly treat those as the
  // same assignment's resubmission history.
  const assignmentIds = [...new Set(submissions.map((s) => s.assignmentId ?? s.assignmentTitle))];
  return assignmentIds.flatMap((id) =>
    groupByStudent(submissions.filter((s) => (s.assignmentId ?? s.assignmentTitle) === id))
  );
}

const StatusBadge = ({ status }) => (
  <div
    className={`px-3 py-1 rounded-[32px] text-xs font-bold inline-flex items-center gap-1.5 border whitespace-nowrap ${
      status === "Approved"
        ? "bg-green-50 text-green-700 border-green-200"
        : status === "Rejected"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-yellow-50 text-yellow-700 border-yellow-200"
    }`}
  >
    {status === "Approved" ? (
      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
    ) : status === "Rejected" ? (
      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
    ) : (
      <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
    )}
    {status}
  </div>
);

const CourseGroup = ({ group, defaultExpanded, onViewDetails, onGrade }) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const rows = buildRows(group.submissions);
  const pendingCount = rows.filter(({ latest }) => latest.status === "Pending").length;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-6 py-5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
          isExpanded ? "bg-orange-50/60" : "bg-white hover:bg-neutral-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="text-neutral-400">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <div className="w-11 h-11 bg-orange-100 rounded-[10px] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-800 leading-tight">
              {group.courseTitle}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {rows.length} submission{rows.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-[32px] text-xs font-bold shrink-0">
            {pendingCount} pending
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="overflow-x-auto border-t border-neutral-100">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap">
                  Assignment
                </th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap">
                  Student
                </th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap">
                  Score
                </th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap">
                  Submitted
                </th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map(({ latest: submission, history }) => (
                <tr key={submission.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-800 max-w-[220px] truncate">
                    {submission.assignmentTitle}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-neutral-800">
                      {submission.studentName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{submission.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={submission.status} />
                      {history.length > 0 && (
                        <button
                          onClick={() => onViewDetails(submission)}
                          title={`${history.length} earlier attempt(s)`}
                          className="p-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-neutral-800">{submission.score}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{submission.percentage}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-neutral-700">{submission.date}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{submission.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetails(submission)}
                        title="View Details"
                        className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-4 h-4 stroke-[1.5]" />
                      </button>
                      {submission.isGraded ? (
                        <button
                          onClick={() => onGrade(submission)}
                          title="Edit Grade"
                          className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 stroke-[1.5]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onGrade(submission)}
                          title="Grade Now"
                          className="px-3 py-2 rounded-lg bg-[#7AA4A5] text-white text-xs font-medium hover:bg-[#6b9192] transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Grade Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AssignmentSection = ({ courseGroups }) => {
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
    <div className="space-y-4">
      {courseGroups.map((group) => (
        <CourseGroup
          key={group.courseId ?? group.courseTitle}
          group={group}
          defaultExpanded={courseGroups.length === 1}
          onViewDetails={handleViewDetails}
          onGrade={handleGrade}
        />
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
