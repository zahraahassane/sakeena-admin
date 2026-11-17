import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronDown, MessageSquare, Loader2 } from "lucide-react";
import {
  useGetDiscussionInboxQuery,
  useGetCourseDiscussionDetailsQuery,
} from "../../Api/adminApi";
import { updateUrlParams } from "../../hooks/useUrlParam";
import CommunityChat from "../../components/CommunityChat";
import Pagination from "../../components/Pagination";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString();
};

const StatusPill = ({ topic }) => {
  if (topic.is_closed) {
    return (
      <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold uppercase bg-stone-200 text-stone-600">
        Closed
      </span>
    );
  }
  if (topic.needs_reply) {
    return (
      <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
        Needs reply
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold uppercase bg-lime-100 text-lime-700">
      Replied
    </span>
  );
};

const Discussions = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [page, setPage] = useState(1);
  // The open thread lives in the URL (?topic=5&topic_course=2), so Back from a
  // thread returns to the inbox and a thread can be linked to or refreshed.
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const topicId = searchParams.get("topic");
  const topicCourseId = searchParams.get("topic_course");
  const { data: openTopic, isError: isTopicError } =
    useGetCourseDiscussionDetailsQuery(
      { course_pk: topicCourseId, id: topicId },
      { skip: !topicId || !topicCourseId },
    );

  const openThread = (topic) => {
    // A new history entry, so Back returns to the inbox.
    const params = new URLSearchParams(searchParams);
    params.set("topic", topic.id);
    params.set("topic_course", topic.course);
    setSearchParams(params);
  };
  const closeThread = () => {
    if (location.key !== "default") navigate(-1);
    else
      updateUrlParams(searchParams, setSearchParams, (p) => {
        p.delete("topic");
        p.delete("topic_course");
      });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError } = useGetDiscussionInboxQuery({
    page,
    course,
    search,
  });

  const topics = data?.results || [];
  const courseOptions = data?.courses || [];

  if (topicId && topicCourseId) {
    if (isTopicError) {
      return (
        <div className="py-24 flex flex-col items-center gap-4">
          <p className="text-stone-600 text-lg">This discussion could not be loaded.</p>
          <button
            onClick={closeThread}
            className="text-greenTeal font-medium hover:underline"
          >
            Back to discussions
          </button>
        </div>
      );
    }
    if (!openTopic) {
      return (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-greenTeal" />
        </div>
      );
    }
    return (
      <div className="pt-2 pb-10 animate-in fade-in duration-500">
        <CommunityChat
          key={openTopic.id}
          courseId={topicCourseId}
          courseTitle={
            topics.find((t) => String(t.id) === topicId)?.course_title || ""
          }
          initialDiscussion={openTopic}
          onBack={closeThread}
        />
      </div>
    );
  }

  return (
    <div className="pt-2 flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by topic, message or student..."
            aria-label="Search discussions"
            className="w-full h-10 pl-10 pr-4 bg-zinc-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-greenTeal/20 focus:border-greenTeal transition-all text-sm arimo-font"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-[320px]">
          <select
            aria-label="Filter by course"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-4 pr-10 appearance-none bg-zinc-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-greenTeal/20 focus:border-greenTeal transition-all text-sm font-medium text-stone-700 arimo-font"
          >
            <option value="">All courses</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.needs_reply_count > 0 ? ` (${c.needs_reply_count} waiting)` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-gray-500 text-sm animate-pulse">Loading discussions...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-500 font-bold">Failed to load discussions</p>
          <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-black/5">
          <MessageSquare className="w-10 h-10 text-stone-300 mb-3" />
          <p className="font-bold text-stone-800">No discussions found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search || course
              ? "Try a different search or course."
              : "Student posts will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div
            className={`bg-white rounded-2xl border border-black/10 shadow-sm overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}
          >
            <table className="w-full text-sm text-left arimo-font font-medium min-w-[760px]">
              <thead className="bg-zinc-50 border-b border-black/5 text-neutral-500">
                <tr>
                  <th className="py-4 px-6">Topic</th>
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Started by</th>
                  <th className="py-4 px-6 text-center">Replies</th>
                  <th className="py-4 px-6">Last activity</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {topics.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openThread(t)}
                    className="hover:bg-zinc-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 max-w-[360px]">
                      <p className="text-neutral-950 font-bold truncate">{t.title}</p>
                      <p className="text-xs text-stone-400 truncate">{t.body}</p>
                    </td>
                    <td className="py-4 px-6 text-neutral-600">{t.course_title}</td>
                    <td className="py-4 px-6 text-neutral-600">{t.author_name}</td>
                    <td className="py-4 px-6 text-center text-neutral-600">{t.reply_count}</td>
                    <td className="py-4 px-6 text-neutral-600 whitespace-nowrap">
                      {formatRelativeTime(t.last_activity)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusPill topic={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-black/5 pt-4">
            <Pagination
              currentPage={page}
              totalPages={data?.total_pages || 1}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Discussions;
