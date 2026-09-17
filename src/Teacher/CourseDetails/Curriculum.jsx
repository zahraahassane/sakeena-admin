import {
  ChevronDown,
  FileText,
  HelpCircle,
  Video,
  Radio,
  Link,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useGetCourseByIdQuery } from "../../Api/adminApi";
import LessonViewer from "./LessonViewer";

function formatDuration(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

const CONTENT_TYPE_STYLE = {
  video: { icon: Video, tile: "bg-blue-50 text-blue-600" },
  document: { icon: FileText, tile: "bg-amber-50 text-amber-600" },
  quiz: { icon: HelpCircle, tile: "bg-purple-50 text-purple-600" },
  assignment: { icon: BookOpen, tile: "bg-orange-50 text-orange-600" },
  external_link: { icon: Link, tile: "bg-teal-50 text-teal-600" },
  live: { icon: Radio, tile: "bg-red-50 text-red-600" },
};

const CONTENT_TYPE_LABEL = {
  video: "Video",
  document: "Document",
  quiz: "Quiz",
  assignment: "Assignment",
  external_link: "External Link",
  live: "Live Session",
};

export default function CourseCurriculum({ course }) {
  const courseId = course?.id;
  const { data: courseDetail, isLoading, isError } = useGetCourseByIdQuery(courseId, {
    skip: !courseId,
  });

  const modules = courseDetail?.modules || [];
  const totalLessons = courseDetail?.total_lessons ?? 0;
  const totalWeeks = courseDetail?.duration_in_weeks ?? 0;

  const [expandedModules, setExpandedModules] = useState({ 0: true });
  const [selectedLesson, setSelectedLesson] = useState(null);

  const toggleModule = (idx) =>
    setExpandedModules((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <>
      <div className="bg-white border border-stone-100 rounded-xl p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-1">Course Curriculum</h2>
          {isLoading ? (
            <div className="h-4 w-40 bg-stone-100 animate-pulse rounded" />
          ) : (
            <p className="text-sm text-stone-500">
              {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
              {totalWeeks > 0 && ` • ${totalWeeks} week${totalWeeks !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-stone-200 rounded-xl p-5">
                <div className="h-5 bg-stone-100 animate-pulse rounded w-1/2 mb-2" />
                <div className="h-3 bg-stone-100 animate-pulse rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-stone-300" />
            <p className="text-sm text-stone-500">Couldn't load the curriculum. Please try again.</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No modules available for this course yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module, idx) => {
              const duration = formatDuration(module.total_duration);
              const isOpen = !!expandedModules[idx];

              return (
                <div key={module.id} className="border border-stone-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleModule(idx)}
                    className={`w-full flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors text-left ${isOpen ? "bg-stone-50/60" : ""}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
                        Module {idx + 1}
                      </p>
                      <h4 className="font-bold text-stone-900 text-lg mb-1">{module.title}</h4>
                      <p className="text-sm text-stone-500">
                        {module.total_lessons} lesson{module.total_lessons !== 1 ? "s" : ""}
                        {duration && ` • ${duration}`}
                      </p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-stone-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && module.lessons?.length > 0 && (
                    <div className="border-t border-stone-100 divide-y divide-stone-100">
                      {module.lessons.map((lesson, li) => {
                        const style = CONTENT_TYPE_STYLE[lesson.content_type] || {
                          icon: FileText,
                          tile: "bg-stone-100 text-stone-500",
                        };
                        const Icon = style.icon;
                        const lessonDuration = formatDuration(lesson.duration_in_minutes);

                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-5 hover:bg-stone-50/60 transition-colors cursor-pointer"
                            onClick={() => setSelectedLesson(lesson)}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-semibold text-stone-400 w-5 shrink-0 text-center">
                                {li + 1}
                              </span>
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${style.tile}`}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <span className="text-base font-medium text-stone-800">
                                  {lesson.title}
                                </span>
                                {lesson.content_type === "live" && lesson.scheduled_at && (
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    {new Date(lesson.scheduled_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {lesson.is_preview && (
                                <span className="text-xs text-teal-600 font-medium border border-teal-200 rounded-full px-2 py-0.5">
                                  Preview
                                </span>
                              )}
                              {lessonDuration ? (
                                <span className="text-sm text-stone-400 font-medium">{lessonDuration}</span>
                              ) : (
                                <span className="text-xs text-stone-400">{CONTENT_TYPE_LABEL[lesson.content_type] || lesson.content_type}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LessonViewer
        lesson={selectedLesson}
        courseId={courseId}
        onClose={() => setSelectedLesson(null)}
      />
    </>
  );
}
