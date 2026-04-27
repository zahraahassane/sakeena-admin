import React, { useState } from "react";
import { Calendar, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

const ScheduleRescheduleSection = ({ classes = [] }) => {
  const [copiedId, setCopiedId] = useState(null);

  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const shortenUrl = (url) => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace("www.", "");
      const pathname = urlObj.pathname.substring(0, 30);
      return `${hostname}${pathname}${pathname.length === 30 ? "..." : ""}`;
    } catch {
      return url.substring(0, 50) + "...";
    }
  };

  const handleCopyUrl = (url, lessonId) => {
    navigator.clipboard.writeText(url);
    setCopiedId(lessonId);
    toast.success("Zoom URL copied!", {
      duration: 2000,
      position: "bottom-center",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full mb-10">
      {/* Today's Scheduled Classes */}
      <div className="flex-1 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <h2 className="text-neutral-800 text-lg font-bold arimo-font">
            Today's Scheduled Classes
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 text-sm">
                No classes scheduled for today
              </p>
            </div>
          ) : (
            classes.map((item, idx) => (
              <div
                key={idx}
                className="bg-stone-300/10 p-4 rounded-[10px] border border-stone-300/30 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <h3 className="text-neutral-800 text-base font-normal arimo-font">
                      {item.title}
                    </h3>
                    <p className="text-neutral-600 text-sm font-normal arimo-font">
                      {item.instructor} • {item.course_title}
                    </p>
                  </div>
                  <span className="text-slate-400 text-base font-bold arimo-font whitespace-nowrap">
                    {formatTime(item.scheduled_at)}
                  </span>
                </div>
                {(item.zoom_join_url || item.zoom_start_url) && (
                  <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-neutral-200">
                    <span className="text-xs text-neutral-600 truncate flex-1">
                      {shortenUrl(item.zoom_join_url || item.zoom_start_url)}
                    </span>
                    {item.zoom_join_url && (
                      <button
                        onClick={() =>
                          handleCopyUrl(item.zoom_join_url, item.lesson_id)
                        }
                        className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors flex-shrink-0"
                        title="Copy Participant Zoom URL"
                      >
                        {copiedId === item.lesson_id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                        )}
                      </button>
                    )}
                    {item.zoom_start_url && (
                      <a
                        href={item.zoom_start_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 shadow-sm"
                      >
                        Join as Host
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleRescheduleSection;
