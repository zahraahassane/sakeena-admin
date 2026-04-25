import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  User,
  Eye,
  Play,
  CheckCircle2,
  ChevronDown,
  XCircle,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetBlogsDataQuery,
  useDeleteBlogMutation,
  useApproveBlogMutation,
  useRejectBlogMutation,
  useGetBlogCategoriesQuery,
  useAddBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
  useGetVideosDataQuery,
  useDeleteVideoMutation,
} from "../../Api/adminApi";
import UploadContent from "./UploadContent";
import UploadVideo from "./UploadVideo";

const Contents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(null); // 'article', 'video', or null
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: blogsResponse, isLoading: isBlogsLoading } = useGetBlogsDataQuery();
  const { data: videosResponse, isLoading: isVideosLoading } = useGetVideosDataQuery();
  const { data: categoriesResponse } = useGetBlogCategoriesQuery();
  const [addBlogCategory] = useAddBlogCategoryMutation();
  const [deleteBlogCategory] = useDeleteBlogCategoryMutation();
  const [approveBlog] = useApproveBlogMutation();
  const [rejectBlog] = useRejectBlogMutation();
  const [deleteBlog] = useDeleteBlogMutation();
  const [deleteVideo] = useDeleteVideoMutation();

  const categories = categoriesResponse || [];

  const handleDelete = async (slug, type) => {
    const isVideo = type === "Video";
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800 inter-font">
              Confirm Delete
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Are you sure you want to remove this {isVideo ? "video" : "blog"}?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  if (isVideo) {
                    await deleteVideo(slug).unwrap();
                  } else {
                    await deleteBlog(slug).unwrap();
                  }
                  toast.success(`${isVideo ? "Video" : "Blog"} deleted`, {
                    icon: "🗑️",
                    style: {
                      borderRadius: "12px",
                      background: "#333",
                      color: "#fff",
                    },
                  });
                } catch (err) {
                  console.error(
                    `Failed to delete ${isVideo ? "video" : "blog"}:`,
                    err,
                  );
                  toast.error(`Failed to delete ${isVideo ? "video" : "blog"}`);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
        style: {
          minWidth: "350px",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
    );
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addBlogCategory(newCategoryName.trim()).unwrap();
      setNewCategoryName("");
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleDeleteCategory = async (slug, e) => {
    e.stopPropagation();
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800 inter-font">
              Confirm Delete
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Are you sure you want to remove this category?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteBlogCategory(slug).unwrap();
                  toast.success("Category deleted", {
                    icon: "🗑️",
                    style: {
                      borderRadius: "12px",
                      background: "#333",
                      color: "#fff",
                    },
                  });
                  if (
                    categories.find((c) => c.slug === slug)?.id.toString() ===
                    selectedCategory
                  ) {
                    setSelectedCategory("");
                  }
                } catch (err) {
                  console.error("Failed to delete category:", err);
                  const errorMsg = err?.data?.detail || "Failed to delete category";
                  toast.error(errorMsg);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
        style: {
          minWidth: "350px",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
    );
  };

  const handleApprove = async (item) => {
    try {
      const body = {
        author: item.author_detail?.id || 0,
        category: item.categoryId || 0,
        title: item.title,
        cover_image: item.cover_image,
        excerpt: item.excerpt,
        content: item.content,
        status: "approve",
        rejection_reason: "",
        tags: item.tags || [],
      };
      await approveBlog({ slug: item.slug, body }).unwrap();
    } catch (err) {
      console.error("Failed to approve blog:", err);
    }
  };

  const handleReject = async (item) => {
    try {
      const body = {
        author: item.author_detail?.id || 0,
        category: item.categoryId || 0,
        title: item.title,
        cover_image: item.cover_image,
        excerpt: item.excerpt,
        content: item.content,
        status: "reject",
        rejection_reason: "Rejected by admin",
        tags: item.tags || [],
      };
      await rejectBlog({ slug: item.slug, body }).unwrap();
    } catch (err) {
      console.error("Failed to reject blog:", err);
    }
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const blogs = (blogsResponse?.results || []).map((b) => {
    const categoryObj = categories.find((c) => c.id === (b.category?.id || b.category));
    return {
      ...b,
      dbId: b.id,
      id: b.slug, // Use slug for navigation
      type: "Article",
      thumbnail: b.cover_image,
      date: new Date(b.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readTime: `${b.reading_time || 0} min read`,
      category: b.category?.name || categoryObj?.name || "Uncategorized",
      categoryId: b.category?.id || b.category,
      title: b.title,
      description: b.excerpt,
      author: b.author_detail?.full_name || "Admin",
      status:
        b.status === "pending"
          ? "Pending Approval"
          : b.status === "published"
            ? "Published"
            : "Rejected",
      rawStatus: b.status,
    };
  });

  const videos = (videosResponse?.results || []).map((v) => {
    const youtubeId = getYoutubeId(v.video_url);
    const thumbnail =
      v.cover_image ||
      (youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
        : "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2670&auto=format&fit=crop");

    const categoryObj = categories.find((c) => c.id === (v.category?.id || v.category));

    return {
      ...v,
      dbId: v.id,
      id: v.slug,
      type: "Video",
      thumbnail: thumbnail,
      date: new Date(v.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      category: v.category?.name || categoryObj?.name || "Uncategorized",
      categoryId: v.category?.id || v.category,
      title: v.title,
      description: v.excerpt,
      author: v.author_detail?.full_name || "Admin",
      duration: "Video",
      status: "Published",
      rawStatus: "published",
    };
  });

  const contentsList = [...blogs, ...videos].filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? item.categoryId?.toString() === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const handleSaveContent = (newItem) => {
    // Both articles and videos now handled by API invalidation
    setShowUploadForm(null);
  };

  if (showUploadForm === "article") {
    return (
      <UploadContent
        onSave={handleSaveContent}
        onBack={() => setShowUploadForm(null)}
      />
    );
  }

  if (showUploadForm === "video") {
    return (
      <UploadVideo
        onSave={handleSaveContent}
        onBack={() => setShowUploadForm(null)}
      />
    );
  }

  return (
    <div className="pt-2 flex flex-col gap-8 animate-in fade-in duration-500 pb-10 arimo-font">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <div className="flex items-center gap-4 inter-font">
          <button
            onClick={() => setShowUploadForm("article")}
            className="w-56 h-7 px-2 py-1 bg-greenTeal rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/0 inline-flex justify-center items-center gap-1.5 hover:opacity-90 transition-all font-semibold"
          >
            <span className="text-center text-white text-sm font-semibold leading-5">
              Upload New Content
            </span>
          </button>
          <button
            onClick={() => setShowUploadForm("video")}
            className="w-56 h-7 px-2 py-1 bg-gray-200 rounded-2xl inline-flex justify-center items-center gap-1.5 hover:bg-gray-300 transition-all font-semibold"
          >
            <span className="text-center text-neutral-950 text-sm font-semibold leading-5">
              Upload New Video
            </span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            className="w-full h-11 pl-12 pr-4 bg-white border border-neutral-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20 focus:border-[#7AA4A5] transition-all text-base text-neutral-900 placeholder:text-neutral-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Category Filter */}
        <div className="flex flex-col gap-3 relative">
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-48 h-11 px-4 bg-white border border-neutral-300 rounded-[10px] flex items-center justify-between text-neutral-500 font-normal hover:bg-neutral-50 transition-all"
          >
            <span className="truncate">
              {categories.find((c) => c.id.toString() === selectedCategory)
                ?.name || "All Categories"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isCategoryOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsCategoryOpen(false)}
              />
              <div className="absolute top-12 left-0 mt-2 p-1 bg-white border border-stone-100 rounded-[1.5rem] shadow-2xl flex flex-col gap-1 min-w-[220px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <div className="max-h-60 overflow-y-auto p-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm text-left transition-all ${
                      selectedCategory === ""
                        ? "bg-teal-50 text-teal-700 font-bold"
                        : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                        selectedCategory === cat.id.toString()
                          ? "bg-teal-50 text-teal-700 font-bold"
                          : "text-stone-600 hover:bg-stone-50"
                      }`}
                      onClick={() => {
                        setSelectedCategory(cat.id.toString());
                        setIsCategoryOpen(false);
                      }}
                    >
                      <span className="truncate">{cat.name}</span>
                      <button
                        onClick={(e) => handleDeleteCategory(cat.slug, e)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-stone-50 bg-stone-50/50 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add category..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                    className="flex-1 h-9 px-3 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all shadow-sm"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedCategory === ""
              ? "bg-gradient-to-b from-teal-600 to-cyan-900 text-white shadow-md scale-105"
              : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id.toString())}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat.id.toString()
                ? "bg-gradient-to-b from-teal-600 to-cyan-900 text-white shadow-md scale-105"
                : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isBlogsLoading || isVideosLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">
            Fetching content...
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentsList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative h-[227px] w-full overflow-hidden">
                {item.type === "Video" &&
                item.thumbnail?.startsWith("blob:") ? (
                  <video
                    src={item.thumbnail}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={item.thumbnail}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    alt={item.title}
                  />
                )}
                {item.type === "Video" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group cursor-pointer">
                    <div
                      onClick={() => navigate(`/admin/contents/${item.id}`)}
                      className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 backdrop-blur-sm"
                    >
                      <Play className="w-6 h-6 text-slate-600 fill-slate-600 ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-4 text-stone-500 text-xs font-normal">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </div>
                  {item.type === "Article" && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.readTime}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center px-3 py-1 bg-white border border-teal-200 rounded-lg text-slate-600 text-xs font-medium w-fit">
                    {item.category}
                  </div>
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      item.type === "Video"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}
                  >
                    {item.type === "Video" ? "Video" : "Blog"}
                  </div>
                </div>

                <h3 className="text-stone-900 font-bold leading-7 line-clamp-2 text-lg">
                  {item.title}
                </h3>

                <p className="text-stone-600 text-sm leading-6 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                  <span className="text-stone-600 text-xs font-normal italic">
                    {item.author}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-4 bg-neutral-50 border-t border-black/10 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleDelete(item.slug, item.type)}
                  className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-4" />
                </button>
                <button
                  onClick={() =>
                    navigate(`/admin/contents/${item.id}?type=${item.type}`)
                  }
                  className="p-2 border border-slate-400 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <Eye className="w-5 h-4" />
                </button>

                {item.type === "Article" ? (
                  <>
                    {item.status === "Pending Approval" ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleReject(item)}
                          className="px-4 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(item)}
                          className="px-6 py-2 bg-white border border-slate-400 rounded-lg text-slate-500 text-sm font-medium hover:bg-[#7AA4A5] hover:text-white hover:border-[#7AA4A5] transition-all"
                        >
                          Approve
                        </button>
                      </div>
                    ) : item.status === "Published" ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                          <CheckCircle2 className="w-4 h-4" />
                          Approved
                        </div>
                        <button
                          onClick={() => handleReject(item)}
                          className="px-4 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-red-600 text-sm font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </div>
                        <button
                          onClick={() => handleApprove(item)}
                          className="px-6 py-2 bg-white border border-slate-400 rounded-lg text-slate-500 text-sm font-medium hover:bg-[#7AA4A5] hover:text-white hover:border-[#7AA4A5] transition-all"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Contents;
