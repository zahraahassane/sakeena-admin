import React, { useState } from "react";
import { Star, Trash2, Edit2, Check, X, Loader2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetCourseReviewsQuery,
  useUpdateCourseReviewMutation,
  useDeleteCourseReviewMutation,
} from "../../Api/adminApi";

const StarRating = ({ rating, interactive = false, onChange }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onChange?.(i)}
        className={interactive ? "cursor-pointer" : "cursor-default"}
      >
        <Star
          className={`w-4 h-4 transition-colors ${
            i <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200 fill-stone-100"
          }`}
        />
      </button>
    ))}
  </div>
);

const CourseReviews = ({ courseId }) => {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: "" });

  const { data, isLoading, isError } = useGetCourseReviewsQuery(
    { courseId, page },
    { skip: !courseId }
  );
  const [updateReview, { isLoading: isUpdating }] = useUpdateCourseReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteCourseReviewMutation();

  const reviews = data?.results ?? (Array.isArray(data) ? data : []);
  const totalPages = data?.total_pages ?? 1;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const startEdit = (review) => {
    setEditingId(review.id);
    setEditForm({ rating: review.rating, comment: review.comment });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (review) => {
    try {
      await updateReview({ courseId, reviewId: review.id, ...editForm }).unwrap();
      toast.success("Review updated.");
      setEditingId(null);
    } catch {
      toast.error("Failed to update review.");
    }
  };

  const handleDelete = (review) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <p className="font-bold text-stone-800 text-sm">Delete this review?</p>
          <p className="text-xs text-stone-500">By {review.user_name} — this cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-bold text-stone-400 hover:text-stone-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteReview({ courseId, reviewId: review.id }).unwrap();
                  toast.success("Review deleted.");
                } catch {
                  toast.error("Failed to delete review.");
                }
              }}
              className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-red-500 font-bold">
        Failed to load reviews.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-greenTeal arimo-font">Student Reviews</h2>
            <p className="text-xs text-stone-400 inter-font">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-2xl font-black text-stone-900 arimo-font">{avgRating}</span>
            <span className="text-xs text-stone-400 inter-font">/ 5</span>
          </div>
        )}
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-stone-100">
          <Star className="w-12 h-12 text-stone-200 mx-auto" />
          <p className="text-lg font-bold text-stone-800 arimo-font">No Reviews Yet</p>
          <p className="text-stone-400 text-sm inter-font">Reviews will appear once students rate this course.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 hover:border-teal-100 transition-all"
            >
              {editingId === review.id ? (
                /* Edit mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-stone-800 text-sm">{review.user_name}</p>
                    <StarRating
                      rating={editForm.rating}
                      interactive
                      onChange={(r) => setEditForm((p) => ({ ...p, rating: r }))}
                    />
                  </div>
                  <textarea
                    value={editForm.comment}
                    onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))}
                    rows={3}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 font-medium outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-500/5 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-stone-500 bg-stone-100 rounded-xl hover:bg-stone-200 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(review)}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all disabled:opacity-60"
                    >
                      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-teal-700">
                      {(review.user_name ?? "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-stone-900 text-sm arimo-font">{review.user_name ?? "Anonymous"}</p>
                        <div className="mt-1">
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 inter-font">
                          {new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        <button
                          onClick={() => startEdit(review)}
                          className="p-1.5 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(review)}
                          disabled={isDeleting}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-stone-500 inter-font leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-500 hover:border-teal-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseReviews;

