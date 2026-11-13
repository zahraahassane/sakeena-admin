import YouTubePreview, { extractYouTubeId } from "../../components/YouTubePreview";
import { X, Download, ExternalLink, Clock, Award, FileText, Radio, AlertCircle } from "lucide-react";
import { useGetLessonQuizzesQuery, useGetLessonAssignmentsQuery } from "../../Api/adminApi";

// ─── Video ────────────────────────────────────────────────────────────────────
function VideoViewer({ lesson }) {
  const src = lesson.video_content || lesson.bunny_embed_url;
  return (
    <div className="space-y-4">
      {src ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
          <iframe
            src={src}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen"
            title={lesson.title}
          />
        </div>
      ) : (
        <div className="aspect-video w-full rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 gap-2">
          <AlertCircle size={32} />
          <p className="text-sm">Video not available yet.</p>
          {lesson.bunny_video_status && (
            <p className="text-xs capitalize">Status: {lesson.bunny_video_status}</p>
          )}
        </div>
      )}
      {lesson.content && (
        <div
          className="prose prose-gray max-w-none text-gray-700 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}
    </div>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────
function DocumentViewer({ lesson }) {
  return (
    <div className="space-y-4">
      {lesson.file_content ? (
        <div className="border border-gray-200 rounded-xl p-5 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <FileText size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{lesson.title}</p>
              <p className="text-xs text-gray-400">Document</p>
            </div>
          </div>
          <a
            href={lesson.file_content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Download size={15} />
            Download
          </a>
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-8 text-center text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No document uploaded yet.</p>
        </div>
      )}
      {lesson.content && (
        <div
          className="prose prose-gray max-w-none text-gray-700 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}
    </div>
  );
}

// ─── YouTube Video ────────────────────────────────────────────────────────────
function ExternalLinkViewer({ lesson }) {
  const videoId = extractYouTubeId(lesson.content);
  return videoId ? (
    <YouTubePreview videoId={videoId} />
  ) : (
    <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-8 text-center text-gray-400">
      <p className="text-sm">No valid YouTube video ID.</p>
    </div>
  );
}

// ─── Live Session ─────────────────────────────────────────────────────────────
function LiveViewer({ lesson }) {
  const statusColor = {
    upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    live: "bg-green-50 text-green-700 border-green-200",
    completed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const status = lesson.live_status || "upcoming";
  const colorClass = statusColor[status] || statusColor.upcoming;

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
            <Radio size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Live Session</p>
            <span className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${colorClass}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {lesson.scheduled_at && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Scheduled At</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(lesson.scheduled_at).toLocaleString()}
              </p>
            </div>
          )}
          {lesson.duration_in_minutes > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="text-sm font-medium text-gray-700">{lesson.duration_in_minutes} min</p>
            </div>
          )}
          {lesson.zoom_meeting_id && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Meeting ID</p>
              <p className="text-sm font-medium text-gray-700 font-mono">{lesson.zoom_meeting_id}</p>
            </div>
          )}
          {lesson.zoom_host_email && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Host</p>
              <p className="text-sm font-medium text-gray-700">{lesson.zoom_host_email}</p>
            </div>
          )}
        </div>

        {lesson.zoom_start_url && (
          <a
            href={lesson.zoom_start_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Radio size={16} />
            Start Meeting
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
function QuizViewer({ lesson, courseId }) {
  const { data, isLoading } = useGetLessonQuizzesQuery(
    { courseId, moduleId: lesson.module, lessonId: lesson.id },
    { skip: !courseId }
  );
  const quizzes = Array.isArray(data) ? data : data?.results || [];

  if (isLoading) return <QuizSkeleton />;
  if (!quizzes.length)
    return (
      <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-8 text-center text-gray-400">
        <p className="text-sm">No quiz details available.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <div key={quiz.id} className="space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            {quiz.time_limit > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Clock size={14} className="text-gray-400" />
                {quiz.time_limit} min time limit
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Award size={14} className="text-gray-400" />
              {quiz.passing_score}% to pass
            </div>
          </div>

          {quiz.description && (
            <div
              className="prose prose-gray max-w-none text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: quiz.description }}
            />
          )}

          {/* Questions */}
          {quiz.questions?.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">
                {quiz.questions.length} Question{quiz.questions.length !== 1 ? "s" : ""}
              </h4>
              {quiz.questions.map((q, qi) => (
                <div key={q.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    <span className="text-gray-400 mr-2">Q{qi + 1}.</span>
                    {q.text}
                  </p>
                  {q.options?.length > 0 && (
                    <ul className="space-y-2">
                      {q.options.map((opt) => (
                        <li
                          key={opt.id}
                          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                            opt.is_correct
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-gray-50 border-gray-200 text-gray-700"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${opt.is_correct ? "bg-green-500" : "bg-gray-300"}`} />
                          {opt.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.points > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{q.points} pt{q.points !== 1 ? "s" : ""}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuizSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-9 w-28 bg-gray-100 animate-pulse rounded-lg" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Assignment ───────────────────────────────────────────────────────────────
function AssignmentViewer({ lesson, courseId }) {
  const { data, isLoading } = useGetLessonAssignmentsQuery(
    { courseId, moduleId: lesson.module, lessonId: lesson.id },
    { skip: !courseId }
  );
  const assignments = Array.isArray(data) ? data : data?.results || [];

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );

  if (!assignments.length)
    return (
      <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-8 text-center text-gray-400">
        <p className="text-sm">No assignment details available.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {assignments.map((a) => (
        <div key={a.id} className="border border-gray-200 rounded-xl p-5 bg-white space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-3">
            {a.max_points > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Award size={14} className="text-gray-400" />
                {a.max_points} points
              </div>
            )}
            {a.due_date && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Clock size={14} className="text-gray-400" />
                Due: {new Date(a.due_date).toLocaleString()}
              </div>
            )}
            {a.allowed_file_types && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <FileText size={14} className="text-gray-400" />
                Accepts: {a.allowed_file_types}
              </div>
            )}
          </div>

          {a.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <div
                className="prose prose-gray max-w-none text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: a.description }}
              />
            </div>
          )}

          {a.instructions && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Instructions</p>
              <div
                className="prose prose-gray max-w-none text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: a.instructions }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main LessonViewer ────────────────────────────────────────────────────────
const CONTENT_TYPE_LABEL = {
  video: "Video Lesson",
  document: "Document",
  quiz: "Quiz",
  assignment: "Assignment",
  external_link: "YouTube Video",
  live: "Live Session",
};

export default function LessonViewer({ lesson, courseId, onClose }) {
  if (!lesson) return null;

  const renderContent = () => {
    switch (lesson.content_type) {
      case "video":       return <VideoViewer lesson={lesson} />;
      case "document":    return <DocumentViewer lesson={lesson} />;
      case "external_link": return <ExternalLinkViewer lesson={lesson} />;
      case "live":        return <LiveViewer lesson={lesson} />;
      case "quiz":        return <QuizViewer lesson={lesson} courseId={courseId} />;
      case "assignment":  return <AssignmentViewer lesson={lesson} courseId={courseId} />;
      default:            return <p className="text-sm text-gray-400">No preview available.</p>;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="pr-4">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
              {CONTENT_TYPE_LABEL[lesson.content_type] || lesson.content_type}
            </p>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">{lesson.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </>
  );
}
