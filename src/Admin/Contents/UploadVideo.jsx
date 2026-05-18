import React, { useState, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  Plus,
  Send,
  Calendar,
  Clock,
  ArrowLeft,
  Trash2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  useAddVideoMutation,
  useUpdateVideoMutation,
  useGetVideoCategoriesQuery,
  useAddVideoCategoryMutation,
  useDeleteVideoCategoryMutation,
} from "../../Api/adminApi";
import toast from "react-hot-toast";
import TextEditor from "../../components/Editor";

const UploadVideo = ({ onSave, onBack, editItem }) => {
  const [formData, setFormData] = useState({
    title: editItem?.title || "",
    excerpt: editItem?.description || "",
    content: editItem?.content || "",
    category: editItem?.categoryId || "",
    tags: editItem?.tags || [],
    coverImage: editItem?.thumbnail && !editItem.thumbnail.startsWith("blob:") ? editItem.thumbnail : null, // This will store the preview URL
    coverImageFile: null, // This will store the actual File object
    videoUrl: editItem?.video_url || "", // For external links
  });

  const [tagInput, setTagInput] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const fileInputRef = useRef(null);

  const { data: categoriesResponse } = useGetVideoCategoriesQuery();
  const [addVideo, { isLoading: isAdding }] = useAddVideoMutation();
  const [updateVideo, { isLoading: isUpdating }] = useUpdateVideoMutation();
  const isUploading = isAdding || isUpdating;
  const [addVideoCategory] = useAddVideoCategoryMutation();
  const [deleteVideoCategory] = useDeleteVideoCategoryMutation();

  const categories = categoriesResponse || [];

  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const wordCount = stripHtml(formData.content).trim()
    ? stripHtml(formData.content).trim().split(/\s+/).length
    : 0;
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addVideoCategory(newCategoryName.trim()).unwrap();
      setNewCategoryName("");
      toast.success("Category added successfully");
    } catch (err) {
      console.error("Failed to add category:", err);
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (slug, id, e) => {
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
                  await deleteVideoCategory(slug).unwrap();
                  toast.success("Category deleted");
                  if (formData.category.toString() === id.toString()) {
                    setFormData((prev) => ({ ...prev, category: "" }));
                  }
                } catch (err) {
                  console.error("Failed to delete category:", err);
                  toast.error("Failed to delete category");
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
      }
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData({
      ...formData,
      coverImage: URL.createObjectURL(file), // Preview image
      coverImageFile: file, // Image file to upload
    });
  };

  const handleUpload = async () => {
    if (!formData.title || !formData.category) {
      toast.error("Title and Category are required");
      return;
    }
    

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("category_id", formData.category);
      data.append("video_url", formData.videoUrl);
      data.append("excerpt", formData.excerpt);
      data.append("content", formData.content);
      
      // Handle tags as an array
      formData.tags.forEach(tag => {
        data.append("tags", tag);
      });

      if (formData.coverImageFile) {
        data.append("cover_image", formData.coverImageFile);
      }

      if (editItem) {
        await updateVideo({ slug: editItem.slug, body: data }).unwrap();
        toast.success("Video updated successfully!");
      } else {
        await addVideo(data).unwrap();
        toast.success("Video uploaded successfully!");
      }
      onSave(); // Close form or refresh
    } catch (err) {
      console.error(editItem ? "Failed to update video:" : "Failed to upload video:", err);
      toast.error(err?.data?.detail || "Failed to " + (editItem ? "update" : "upload") + " video. Please try again.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 inter-font w-full max-w-[1600px] mx-auto px-4 md:px-8">
      {/* Header with Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-base font-normal">Back to Content</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Form Section */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Video Thumbnail (Cover Image) */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm flex flex-col gap-6">
            <h3 className="text-neutral-950 text-lg font-medium">
              Upload Video Link
            </h3>

            {/* Video Source Link */}
            <div className="space-y-4 pt-2 border-t border-gray-100/50">
              <div className="flex justify-between items-center ml-1">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#7AA4A5]" />
                  <label className="text-sm font-bold text-gray-700">
                    Video URL
                  </label>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">
                  YouTube, Vimeo, etc.
                </span>
              </div>
              <input
                type="text"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                placeholder="Paste your video link here..."
                className="w-full px-4 py-3 bg-zinc-100 rounded-xl text-sm text-blue-600 focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20 font-bold placeholder:font-normal placeholder:text-gray-400 transition-all border border-transparent"
              />
            </div>
          </div>

          {/* Category & Content Title */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="text-neutral-950 text-lg font-medium">Category</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full h-11 px-4 bg-zinc-100 rounded-lg flex items-center justify-between text-neutral-900 text-sm font-medium hover:bg-zinc-200 transition-all outline-none focus:ring-2 focus:ring-[#7AA4A5]/20"
                >
                  <span className="truncate">
                    {categories.find((c) => c.id.toString() === formData.category.toString())
                      ?.name || "Select Category"}
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
                    <div className="absolute top-12 left-0 mt-2 p-1 bg-white border border-stone-100 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[220px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                      <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                        {categories.length === 0 ? (
                          <p className="text-xs text-stone-400 p-4 text-center">No categories found</p>
                        ) : (
                          categories.map((cat) => (
                            <div
                              key={cat.id}
                              className={`group flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${formData.category.toString() === cat.id.toString()
                                ? "bg-teal-50 text-teal-700 font-bold"
                                : "text-stone-600 hover:bg-stone-50"
                                }`}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat.id.toString() }));
                                setIsCategoryOpen(false);
                              }}
                            >
                              <span className="truncate">{cat.name}</span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCategory(cat.slug, cat.id, e)}
                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-3 border-t border-stone-50 bg-stone-50/50 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add category..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                          className="flex-1 h-9 px-3 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="p-2 bg-[#7AA4A5] text-white rounded-md hover:bg-[#6b9192] transition-colors shadow-md active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-neutral-950 text-lg font-medium">
                Video Title
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter a compelling video title..."
                  className="w-full px-4 py-3 bg-zinc-100 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20 font-bold placeholder:text-gray-500"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <p className="text-gray-500 text-xs font-normal">
                  {formData.title.length}/100 characters
                </p>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-4">
            <h3 className="text-neutral-950 text-lg font-medium">
              Description
            </h3>
            <div className="space-y-2">
              <textarea
                placeholder="Write a brief summary (this will appear in Video previews)..."
                rows={3}
                className="w-full px-4 py-3 bg-zinc-100 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20 resize-none placeholder:text-gray-500"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
              />
              <p className="text-gray-500 text-xs font-normal">
                0/300 characters
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-4">
            <h3 className="text-neutral-950 text-lg font-medium">
              About this Video
            </h3>
            <div className="space-y-2">
              <TextEditor
                htmlElement={formData.content}
                onChange={(html) =>
                  setFormData({ ...formData, content: html })
                }
                isEditable={true}
                placeholder="Write about this video..."
              />
              <p className="text-gray-500 text-sm font-normal">
                {wordCount} words
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Publishing Options */}
            {/* <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-6">
              <h3 className="text-neutral-950 text-lg font-medium">
                Video Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-gray-700 text-sm font-semibold">
                    Video Duration
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.readTime}
                      onChange={(e) =>
                        setFormData({ ...formData, readTime: e.target.value })
                      }
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg flex items-center text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20"
                      placeholder="e.g. 12:45"
                    />
                    <Clock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-gray-700 text-sm font-semibold">
                    Upload Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.publishDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publishDate: e.target.value,
                        })
                      }
                      className="w-full h-10 bg-zinc-100 rounded-lg flex items-center px-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20"
                    />
                  </div>
                </div>
              </div>
            </div> */}

            {/* Tags */}
            <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-6">
              <h3 className="text-neutral-950 text-lg font-medium">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 bg-white border border-black/10 rounded-lg text-neutral-950 text-xs font-medium flex items-center gap-1.5 group"
                  >
                    <span>+ {tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 bg-zinc-100 rounded-lg text-sm text-neutral-900 placeholder:text-gray-500 font-normal focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20"
                />
                <button
                  onClick={handleAddTag}
                  className="p-2.5 bg-greenTeal rounded-lg text-white hover:bg-slate-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Author */}
            <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-6">
              <h3 className="text-neutral-950 text-lg font-medium">
                Author Information
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-400 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                  SA
                </div>
                <div>
                  <h4 className="text-neutral-950 text-base font-semibold">
                    Admin
                  </h4>
                  <p className="text-gray-600 text-xs font-normal">
                    Islamic Psychology Expert
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-[#7AA4A5] hover:bg-[#6b9192] text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;
