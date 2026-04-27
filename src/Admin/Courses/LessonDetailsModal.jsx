import React from "react";
import toast from "react-hot-toast";
import {
  X,
  Video as VideoIcon,
  FileText,
  HelpCircle,
  BookOpen,
  Clock,
  Target,
  FileDown,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Loader2,
} from "lucide-react";

const LessonDetailsModal = ({ lesson, isOpen, onClose }) => {
  if (!isOpen || !lesson) return null;

  const renderIcon = () => {
    switch (lesson.content_type) {
      case "video":
        return <VideoIcon className="w-8 h-8 text-blue-600" />;
      case "document":
        return <FileText className="w-8 h-8 text-amber-600" />;
      case "quiz":
        return <HelpCircle className="w-8 h-8 text-purple-600" />;
      case "assignment":
        return <BookOpen className="w-8 h-8 text-orange-600" />;
      case "live":
        return <VideoIcon className="w-8 h-8 text-red-600" />;
      case "external_link":
        return <ExternalLink className="w-8 h-8 text-teal-600" />;
      default:
        return <FileText className="w-8 h-8 text-stone-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[1.25rem] bg-stone-50 flex items-center justify-center">
              {renderIcon()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 block mb-1 inter-font">
                Lesson Type: {lesson.content_type}
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {lesson.is_preview && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                    Free Preview
                  </span>
                )}
                {!lesson.is_released && (
                  <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                    Draft / Unreleased
                  </span>
                )}
                {lesson.is_released && (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                    Published
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-2xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Video / Document / External Link Details */}
          {(lesson.content_type === "video" || lesson.content_type === "document" || lesson.content_type === "external_link") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(lesson.file_content || lesson.content || lesson.video_content || lesson.bunny_embed_url) && (
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{lesson.content_type === "video" ? "Video Resource" : lesson.content_type === "document" ? "Document File" : "URL / Resource"}</span>
                  </div>
                  <a
                    href={lesson.file_content || lesson.content || lesson.video_content || lesson.bunny_embed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-blue-700 hover:underline break-all truncate block"
                  >
                    {lesson.file_content || lesson.content || lesson.video_content || lesson.bunny_embed_url}
                  </a>
                </div>
              )}
              {lesson.fileName && (
                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Attached File</span>
                  </div>
                  <span className="text-sm font-bold text-amber-700 block truncate">
                    {lesson.fileName}
                  </span>
                </div>
              )}
              {lesson.duration_in_minutes && (
                <div className="p-5 bg-stone-50 border border-stone-100 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration</span>
                  </div>
                  <span className="text-sm font-black text-stone-800">
                    {lesson.duration_in_minutes} mins
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Live Session Details */}
          {lesson.content_type === "live" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lesson.zoom_join_url && (
                <div className="p-5 bg-red-50/50 border border-red-100 rounded-3xl space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Zoom Join URL</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lesson.zoom_join_url);
                        toast.success("Zoom URL copied to clipboard!");
                      }}
                      className="px-3 py-1 bg-white text-red-600 rounded-full border border-red-200 text-xs font-bold hover:bg-red-50 transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>
                  <a
                    href={lesson.zoom_join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-red-700 hover:underline break-all block mt-2"
                  >
                    {lesson.zoom_join_url}
                  </a>
                </div>
              )}
              {lesson.duration_in_minutes > 0 && (
                <div className="p-5 bg-stone-50 border border-stone-100 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration</span>
                  </div>
                  <span className="text-sm font-black text-stone-800">
                    {lesson.duration_in_minutes} mins
                  </span>
                </div>
              )}
              {lesson.scheduled_at && (
                <div className="p-5 bg-stone-50 border border-stone-100 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Scheduled Time</span>
                  </div>
                  <span className="text-sm font-black text-stone-800">
                    {new Date(lesson.scheduled_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quiz Details */}
          {lesson.content_type === "quiz" && lesson.quiz_details && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-3xl text-center">
                  <Clock className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">
                    Time Limit
                  </span>
                  <span className="text-lg font-black text-purple-700">
                    {lesson.quiz_details.time_limit}m
                  </span>
                </div>
                <div className="p-5 bg-teal-50/50 border border-teal-100 rounded-3xl text-center">
                  <Target className="w-5 h-5 text-teal-600 mx-auto mb-2" />
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                    Passing
                  </span>
                  <span className="text-lg font-black text-teal-700">
                    {lesson.quiz_details.passing_score}%
                  </span>
                </div>
              </div>

              {lesson.duration_in_minutes > 0 && (
                <div className="p-4 bg-stone-50 border border-stone-100 rounded-[1.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Duration</span>
                  </div>
                  <span className="text-sm font-black text-stone-800">{lesson.duration_in_minutes} mins</span>
                </div>
              )}

              {lesson.quiz_details.description && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-stone-800 uppercase tracking-widest">
                    Quiz Description
                  </h4>
                  <div 
                    className="text-stone-600 text-sm leading-relaxed font-medium rich-text-content"
                    dangerouslySetInnerHTML={{ __html: lesson.quiz_details.description }}
                  />
                </div>
              )}

              {/* Mini Questions List */}
              {lesson.quiz_details.questions && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-stone-800 uppercase tracking-widest">
                    Questions Overview ({lesson.quiz_details.questions.length})
                  </h4>
                  <div className="space-y-3">
                    {lesson.quiz_details.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-6 h-6 rounded-lg bg-stone-200 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-stone-700 truncate max-w-[300px]">
                            {q.text}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-stone-400 uppercase">
                          {q.points} Points
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignment Details */}
          {lesson.content_type === "assignment" && lesson.assignment_details && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-3xl">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">
                    Maximum Points
                  </span>
                  <span className="text-xl font-black text-orange-700">
                    {lesson.assignment_details.max_points} pts
                  </span>
                </div>
                <div className="p-5 bg-stone-50 border border-stone-100 rounded-3xl">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
                    Due Date
                  </span>
                  <span className="text-lg font-black text-stone-800">
                    {lesson.assignment_details.due_date ? new Date(lesson.assignment_details.due_date).toLocaleDateString() : "No deadline"}
                  </span>
                </div>
              </div>

              {lesson.assignment_details.description && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-stone-800 uppercase tracking-widest">
                    Description
                  </h4>
                  <div 
                    className="text-stone-600 text-sm leading-relaxed font-medium rich-text-content"
                    dangerouslySetInnerHTML={{ __html: lesson.assignment_details.description }}
                  />
                </div>
              )}

              {lesson.assignment_details.instructions && (
                <div className="p-6 bg-stone-50 border border-stone-100 rounded-[2rem] space-y-3">
                  <h4 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Instructions
                  </h4>
                  <div 
                    className="text-stone-600 text-sm leading-relaxed font-medium rich-text-content"
                    dangerouslySetInnerHTML={{ __html: lesson.assignment_details.instructions }}
                  />
                </div>
              )}

              {/* Submission Limits */}
              {(lesson.assignment_details.allowed_file_types || lesson.assignment_details.max_file_size) && (
                <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Allowed:</span>
                    <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-lg uppercase">
                      {lesson.assignment_details.allowed_file_types || "Any file"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Max Size:</span>
                    <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-lg uppercase">
                      {lesson.assignment_details.max_file_size ? `${lesson.assignment_details.max_file_size} MB` : "No limit"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback for missing details */}
          {(lesson.content_type === "quiz" || lesson.content_type === "assignment") && !lesson.quiz_details && !lesson.assignment_details && (
            <div className="p-10 bg-stone-50 border border-stone-100 rounded-[2rem] text-center space-y-2">
              <p className="text-sm font-bold text-stone-500 inter-font">
                No additional details provided.
              </p>
              <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">
                The configuration for this {lesson.content_type} is empty.
              </p>
            </div>
          )}

          {/* Live Session Details */}
          {lesson.content_type === "live" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-red-50/50 border border-red-100 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Scheduled At</span>
                  </div>
                  <span className="text-sm font-black text-red-800">
                    {lesson.scheduled_at ? new Date(lesson.scheduled_at).toLocaleString() : "Not scheduled"}
                  </span>
                </div>
                {lesson.duration_in_minutes > 0 && (
                  <div className="p-5 bg-stone-50 border border-stone-100 rounded-3xl space-y-2">
                    <div className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Duration</span>
                    </div>
                    <span className="text-sm font-black text-stone-800">
                      {lesson.duration_in_minutes} mins
                    </span>
                  </div>
                )}
              </div>

              {/* Zoom & Direct Links */}
              {(lesson.zoom_join_url || lesson.zoom_start_url) && (
                <div className="grid grid-cols-1 gap-4">
                  {lesson.zoom_start_url && (
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 rounded-xl">
                            <VideoIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Host Link (Zoom)</h4>
                            <p className="text-[10px] font-bold text-blue-600 uppercase">Use this to start the meeting</p>
                          </div>
                        </div>
                        {lesson.zoom_meeting_id && (
                          <div className="px-3 py-1 bg-white border border-blue-100 rounded-lg">
                            <span className="text-[10px] font-black text-blue-400">ID: {lesson.zoom_meeting_id}</span>
                          </div>
                        )}
                      </div>
                      <a
                        href={lesson.zoom_start_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 inter-font uppercase tracking-widest text-xs"
                      >
                        Launch Meeting <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {lesson.zoom_join_url && !lesson.zoom_start_url && (
                    <div className="p-5 bg-teal-50/50 border border-teal-100 rounded-3xl space-y-2">
                      <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
                        <VideoIcon className="w-3.5 h-3.5" />
                        <span>Student Join Link</span>
                      </div>
                      <a
                        href={lesson.zoom_join_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-teal-700 hover:underline truncate block"
                      >
                        Join Session
                      </a>
                    </div>
                  )}
                </div>
              )}

              {lesson.live_status && (
                <div className="flex items-center gap-2 px-4 py-2 bg-stone-100 w-fit rounded-xl">
                   <div className={`w-2 h-2 rounded-full ${lesson.live_status === 'scheduled' ? 'bg-blue-500' : 'bg-red-500'}`} />
                   <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Status: {lesson.live_status}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white border border-stone-200 hover:border-stone-300 text-stone-600 font-black rounded-2xl shadow-sm transition-all active:scale-95 inter-font uppercase tracking-widest text-xs"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailsModal;
