import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Send,
  MessageSquare,
  User,
  Plus,
  Pin,
  Lock,
  ChevronLeft,
  Loader2,
  Trash2,
  Edit2,
  Clock,
  Reply,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import {
  useGetCourseDiscussionsQuery,
  useCreateCourseDiscussionMutation,
  usePinCourseDiscussionMutation,
  useCloseCourseDiscussionMutation,
  useDeleteCourseDiscussionMutation,
  useGetDiscussionRepliesQuery,
  useCreateDiscussionReplyMutation,
  usePatchDiscussionReplyMutation,
  useDeleteDiscussionReplyMutation,
} from "../Api/adminApi";
import toast from "react-hot-toast";

// Decode JWT payload without a library — tries all common claim names
const decodeJwtUserId = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.user_id ?? payload.userId ?? payload.id ?? payload.sub ?? null;
  } catch {
    return null;
  }
};

// Reusable toast confirmation helper
const confirmToast = (message, onConfirm) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-in fade-in slide-in-from-bottom-2" : "opacity-0"
        } max-w-sm w-full bg-white shadow-2xl shadow-stone-900/15 rounded-2xl border border-stone-100 p-5 flex gap-4 items-start`}
      >
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-stone-800 mb-3">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => { toast.dismiss(t.id); onConfirm(); }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest py-2 px-3 rounded-xl transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" /> Confirm
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-black uppercase tracking-widest py-2 px-3 rounded-xl transition-all"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      </div>
    ),
    { duration: 10000, position: "top-center" }
  );
};

// --- Sub-components for Replies ---

const ReplyItem = ({ reply, courseId, discussionId, currentUserId, currentUserRole }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(reply.body);
  const [replyBody, setReplyBody] = useState("");

  const [deleteReply] = useDeleteDiscussionReplyMutation();
  const [patchReply] = usePatchDiscussionReplyMutation();
  const [createReply] = useCreateDiscussionReplyMutation();

  // Show Edit if:
  //  - it's your own reply (by user ID match), OR
  //  - you are an admin and the reply was posted by an admin
  const isOwnReply = currentUserId && reply.author === currentUserId;
  const canEdit = isOwnReply || (currentUserRole === "admin" && reply.author_role === "admin");
  const canDelete = isOwnReply || currentUserRole === "admin";

  // Use the stable discussionId prop — NOT reply.post.
  // reply.post can be unreliable for nested/child replies.
  const postId = discussionId;

  const handleUpdate = async () => {
    try {
      await patchReply({
        course_pk: courseId,
        post_pk: postId,
        id: reply.id,
        body: { body: editBody },
      }).unwrap();
      setIsEditing(false);
      toast.success("Reply updated successfully");
    } catch (err) {
      const msg = err?.data?.detail || "Failed to update reply";
      toast.error(msg);
    }
  };

  const handleDelete = () => {
    confirmToast("Delete this reply permanently?", async () => {
      try {
        await deleteReply({ course_pk: courseId, post_pk: postId, id: reply.id }).unwrap();
        toast.success("Reply deleted");
      } catch (err) {
        const msg = err?.data?.detail || "Failed to delete reply";
        toast.error(msg);
      }
    });
  };

  const handlePostReply = async () => {
    if (!replyBody.trim()) return;
    try {
      await createReply({
        course_pk: courseId,
        post_pk: postId,
        body: { body: replyBody, parent: reply.id },
      }).unwrap();
      setReplyBody("");
      setIsReplying(false);
      toast.success("Reply posted");
    } catch (err) {
      const msg = err?.data?.detail || "Failed to post reply";
      toast.error(msg);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "teacher": return "bg-blue-100 text-blue-700 border-blue-200";
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
      <div className="flex gap-4 group">
        <div className="shrink-0">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-stone-100 shadow-sm">
            <User className="w-5 h-5 text-stone-300" />
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-3xl border border-stone-100 p-4 shadow-sm group-hover:border-teal-100 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-800">{reply.author_name}</span>
              <span className={`px-1.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-tighter ${getRoleBadgeColor(reply.author_role)}`}>
                {reply.author_role}
              </span>
              {isOwnReply && (
                <span className="px-1.5 py-0.5 rounded-lg bg-teal-50 border border-teal-100 text-[8px] font-black uppercase tracking-tighter text-teal-600">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Edit — own reply OR admin editing an admin reply */}
              {canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                  title="Edit reply"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Delete — own reply, or an admin moderating */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Delete reply"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea 
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:border-teal-500 resize-none"
              />
              <div className="flex justify-end gap-2 text-[10px] font-black uppercase">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-stone-400 hover:text-stone-600">Cancel</button>
                <button onClick={handleUpdate} className="px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all">Save</button>
              </div>
            </div>
          ) : (
            <p className="text-stone-600 text-sm leading-relaxed inter-font">{reply.body}</p>
          )}

          <div className="mt-3 pt-3 border-t border-stone-50 flex items-center justify-between">
            <span className="text-[10px] text-stone-400 font-medium">
              {new Date(reply.created_at).toLocaleString()}
            </span>
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-teal-600 transition-colors"
            >
              <Reply className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>

          {isReplying && (
            <div className="mt-4 pt-4 border-t border-stone-50 flex gap-3 animate-in fade-in duration-300">
              <input 
                autoFocus
                placeholder="Write a nested reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="flex-1 bg-stone-50 border-none rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button 
                onClick={handlePostReply}
                className="bg-teal-600 text-white p-2 rounded-xl hover:bg-teal-700 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children Replies (nested) */}
      {reply.children?.length > 0 && (
        <div className="ml-10 border-l-2 border-stone-100 pl-6 space-y-4 pt-2">
          {reply.children.map(child => (
            <ReplyItem 
              key={child.id} 
              reply={child} 
              courseId={courseId}
              discussionId={discussionId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Chat Component ---

const CommunityChat = ({ courseTitle, courseId }) => {
  const [activeView, setActiveView] = useState("list");
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "" });
  const [newReplyBody, setNewReplyBody] = useState("");

  // Decode JWT to get the logged-in user's ID for ownership checks
  const accessToken = useSelector((state) => state.auth.accessToken);
  const currentUserRole = useSelector((state) => state.auth.role);
  const currentUserId = useMemo(() => decodeJwtUserId(accessToken), [accessToken]);

  const { data: discussionsData, isLoading: isDiscussionsLoading } = useGetCourseDiscussionsQuery(courseId);
  const { data: repliesData, isLoading: isRepliesLoading } = useGetDiscussionRepliesQuery(
    { course_pk: courseId, post_pk: selectedDiscussion?.id },
    { skip: !selectedDiscussion }
  );

  const [createDiscussion, { isLoading: isCreating }] = useCreateCourseDiscussionMutation();
  const [pinDiscussion] = usePinCourseDiscussionMutation();
  const [closeDiscussion] = useCloseCourseDiscussionMutation();
  const [deleteDiscussion] = useDeleteCourseDiscussionMutation();
  const [createReply, { isLoading: isPostingReply }] = useCreateDiscussionReplyMutation();

  const discussions = useMemo(() => discussionsData?.results || [], [discussionsData]);
  const replies = useMemo(() => repliesData?.results || [], [repliesData]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await createDiscussion({ course_pk: courseId, body: newPost }).unwrap();
      setNewPost({ title: "", body: "" });
      setIsAddingPost(false);
      toast.success("Topic posted");
    } catch { toast.error("Failed to post"); }
  };

  const handlePostTopReply = async () => {
    if (!newReplyBody.trim()) return;
    try {
      await createReply({ course_pk: courseId, post_pk: selectedDiscussion.id, body: { body: newReplyBody } }).unwrap();
      setNewReplyBody("");
      toast.success("Reply added");
    } catch { toast.error("Failed to post reply"); }
  };

  const handleDeletePost = (e, id) => {
    e.stopPropagation();
    confirmToast("Delete this discussion? All replies will be lost.", async () => {
      try {
        await deleteDiscussion({ course_pk: courseId, id }).unwrap();
        if (selectedDiscussion?.id === id) setActiveView("list");
        toast.success("Discussion deleted successfully");
      } catch {
        toast.error("Failed to delete discussion");
      }
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "teacher": return "bg-blue-100 text-blue-700 border-blue-200";
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (isDiscussionsLoading) {
    return <div className="py-40 text-center"><Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />Loading...</div>;
  }

  return (
    <div className="w-full max-w-[1120px] bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[700px] animate-in fade-in duration-500 mb-20">
      {/* Header */}
      <div className="p-8 border-b border-stone-100 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {activeView === "details" && (
            <button onClick={() => setActiveView("list")} className="p-3 bg-stone-50 rounded-2xl text-stone-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center shadow-inner">
            <MessageSquare className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-stone-900 arimo-font tracking-tight">{activeView === "list" ? "Community Board" : "Discussion Thread"}</h3>
            <p className="text-stone-400 text-xs inter-font italic">{activeView === "list" ? `Sharing knowledge in ${courseTitle}` : selectedDiscussion?.title}</p>
          </div>
        </div>

        {activeView === "list" && (
          <button onClick={() => setIsAddingPost(true)} className="bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-stone-900/10 hover:bg-teal-700 transition-all active:scale-95">
            <Plus className="w-4 h-4 inline mr-2" /> Start Topic
          </button>
        )}
      </div>

      <div className="flex-1 bg-stone-50/20 overflow-y-auto">
        {activeView === "list" ? (
          <div className="p-8 space-y-6">
            {isAddingPost && (
              <div className="bg-white border-2 border-teal-500/30 rounded-[2rem] p-6 shadow-xl animate-in slide-in-from-top-4 duration-300">
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <input required placeholder="Discussion Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 font-bold text-stone-800 outline-none focus:ring-2 focus:ring-teal-500" />
                  <textarea required rows={3} placeholder="Tell the community about it..." value={newPost.body} onChange={e => setNewPost({...newPost, body: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-600 outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                  <div className="flex justify-end gap-3 font-bold uppercase text-[10px] tracking-widest">
                    <button type="button" onClick={() => setIsAddingPost(false)} className="px-6 py-3 text-stone-400">Cancel</button>
                    <button type="submit" className="bg-teal-600 text-white px-8 py-3 rounded-xl shadow-md">Post Topic</button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              {discussions.map((topic) => (
                <div 
                  key={topic.id} 
                  onClick={() => { setSelectedDiscussion(topic); setActiveView("details"); }}
                  className={`group relative bg-white rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden
                    ${topic.is_pinned 
                      ? "border-amber-100 shadow-sm shadow-amber-500/5 hover:shadow-xl hover:shadow-amber-500/10" 
                      : "border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-teal-900/10"
                    } hover:-translate-y-1 hover:border-teal-100`}
                >
                   {/* Visual Accent for Pinned */}
                   {topic.is_pinned && (
                     <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                   )}
                   
                   <div className="p-1 ">
                     <div className="p-7 flex flex-col md:flex-row items-start gap-8">
                       {/* Left: Avatar & Meta */}
                       <div className="shrink-0 flex md:flex-col items-center md:items-center gap-4">
                          <div className="relative group-hover:scale-110 transition-transform duration-500">
                            <div className="w-14 h-14 bg-stone-50 rounded-[1.25rem] flex items-center justify-center border border-stone-100 group-hover:bg-teal-50 group-hover:border-teal-100 transition-all">
                              <User className="w-7 h-7 text-stone-300 group-hover:text-teal-500" />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-tighter shadow-sm
                              ${getRoleBadgeColor(topic.author_role)}`}>
                              {topic.author_role}
                            </div>
                          </div>
                          <div className="md:text-center">
                            <div className="flex items-center md:justify-center gap-1.5 text-stone-300 text-[10px] font-bold uppercase tracking-widest mt-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(topic.created_at)}
                            </div>
                          </div>
                       </div>

                       {/* Center: Content */}
                       <div className="flex-1 min-w-0 pr-12">
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-sm font-black text-stone-800 arimo-font">{topic.author_name}</span>
                             {topic.is_pinned && (
                               <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                 <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                               </span>
                             )}
                          </div>
                          
                          <h4 className="text-xl font-bold text-stone-900 truncate group-hover:text-teal-900 transition-colors tracking-tight mb-2">
                            {topic.title}
                          </h4>
                          
                          <p className="text-stone-400 text-sm line-clamp-2 inter-font italic leading-relaxed">
                            "{topic.body}"
                          </p>
                          
                          <div className="mt-5 flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-stone-50 group-hover:bg-teal-50/50 px-3 py-1.5 rounded-2xl border border-stone-100 group-hover:border-teal-100 text-[10px] font-black text-stone-400 group-hover:text-teal-600 uppercase tracking-[0.2em] transition-all">
                              <MessageSquare className="w-3.5 h-3.5" /> {topic.reply_count} Replies
                            </div>
                            {topic.is_closed && (
                              <div className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                                <Lock className="w-3.5 h-3.5" /> Closed
                              </div>
                            )}
                          </div>
                       </div>

                       {/* Right: Actions (Hidden until hover) — admin-only moderation */}
                       {currentUserRole === "admin" && (
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                            <button
                              onClick={(e) => { e.stopPropagation(); pinDiscussion({course_pk: courseId, id: topic.id}); }}
                              className={`p-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all active:scale-90
                                ${topic.is_pinned ? 'bg-amber-500 border-amber-400 text-white shadow-amber-200' : 'bg-white/80 border-stone-100 text-stone-400 hover:text-amber-500 hover:border-amber-100'}`}
                              title="Pin Post"
                            >
                              <Pin className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); closeDiscussion({course_pk: courseId, id: topic.id}); }}
                              className={`p-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all active:scale-90
                                ${topic.is_closed ? 'bg-stone-900 border-stone-800 text-white shadow-stone-200' : 'bg-white/80 border-stone-100 text-stone-400 hover:text-teal-600 hover:border-teal-100'}`}
                              title="Close Thread"
                            >
                              <Lock className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => handleDeletePost(e, topic.id)}
                              className="p-3 bg-white/80 border border-stone-100 text-stone-400 hover:text-red-500 hover:border-red-100 rounded-2xl backdrop-blur-md shadow-lg transition-all active:scale-90"
                              title="Delete Topic"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                       )}
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
            {/* Thread Owner Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16" />
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center border border-teal-100 shadow-inner">
                  <User className="w-8 h-8 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-base font-black text-stone-900">{selectedDiscussion?.author_name}</span>
                    <span className={`px-2 py-1 rounded-xl border text-[10px] font-black uppercase tracking-tighter ${getRoleBadgeColor(selectedDiscussion?.author_role)}`}>{selectedDiscussion?.author_role}</span>
                    <span className="text-xs text-stone-400 font-medium">{formatRelativeTime(selectedDiscussion?.created_at)}</span>
                  </div>
                  <h2 className="text-3xl font-black text-stone-900 arimo-font tracking-tight mb-4">{selectedDiscussion?.title}</h2>
                  <p className="text-stone-600 text-lg leading-relaxed inter-font">{selectedDiscussion?.body}</p>
                </div>
              </div>
            </div>

            {/* Replies List */}
            <div className="space-y-8 pl-4">
              <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] flex items-center gap-4">
                 <div className="h-[2px] flex-1 bg-stone-100" /> 
                 Discussion Replies ({replies.length})
                 <div className="h-[2px] flex-1 bg-stone-100" />
              </h5>

              {isRepliesLoading ? (
                <div className="text-center py-10 opacity-30 animate-pulse"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></div>
              ) : replies.length > 0 ? (
                replies.map(reply => (
                  <ReplyItem
                    key={reply.id}
                    reply={reply}
                    courseId={courseId}
                    discussionId={selectedDiscussion.id}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-stone-300 font-bold italic tracking-widest">No replies yet.</div>
              )}
            </div>

            {/* Sticky Bottom Input */}
            {!selectedDiscussion?.is_closed && (
              <div className="sticky bottom-0 pt-8 mt-12 border-t border-stone-100 bg-white/80 backdrop-blur-md pb-4 animate-in fade-in duration-500">
                <div className="flex gap-4">
                  <div className="flex-1 relative group">
                    <input 
                      placeholder="Share your thoughts on this topic..." 
                      value={newReplyBody}
                      onChange={e => setNewReplyBody(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-[2rem] px-8 py-5 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 text-stone-800 font-medium transition-all shadow-inner" 
                    />
                  </div>
                  <button 
                    onClick={handlePostTopReply}
                    disabled={isPostingReply || !newReplyBody.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl shadow-teal-900/10 active:scale-95 transition-all"
                  >
                    <Send className="w-7 h-7" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityChat;
