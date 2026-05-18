import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  Plus,
  Send,
  X,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  useAddBlogMutation,
  useUpdateBlogMutation,
  useGetBlogCategoriesQuery,
  useAddBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
} from "../../Api/adminApi";
import TextEditor from "../../components/Editor";
import toast from "react-hot-toast";

const UploadContent = ({ onSave, onBack, editItem }) => {
  const [formData, setFormData] = useState({
    title: editItem?.title || "",
    excerpt: editItem?.description || "",
    content: editItem?.content || "",
    tags: editItem?.tags || [],
    coverImage: null,
    coverImagePreview:
      editItem?.thumbnail && !editItem.thumbnail.startsWith("blob:")
        ? editItem.thumbnail
        : null,
    category: editItem?.categoryId || "",
  });

  const [tagInput, setTagInput] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const fileInputRef = useRef(null);

  const { data: categoriesResponse } = useGetBlogCategoriesQuery();
  const [addBlog] = useAddBlogMutation();
  const [updateBlog] = useUpdateBlogMutation();
  const [addBlogCategory] = useAddBlogCategoryMutation();
  const [deleteBlogCategory] = useDeleteBlogCategoryMutation();

  // The API returns a direct array [{}, {}] instead of a paginated object with results
  const categories = categoriesResponse || [];
  console.log("Categories:", categories);

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
      await addBlogCategory(newCategoryName.trim()).unwrap();
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
                  await deleteBlogCategory(slug).unwrap();
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
      },
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

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "cover") {
      setFormData({
        ...formData,
        coverImage: file,
        coverImagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleUpload = async () => {
    if (!formData.title || !formData.category || !formData.content) {
      toast.error("Please fill in title, category, and content.");
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("excerpt", formData.excerpt);
      uploadData.append("content", formData.content);
      uploadData.append("category_id", formData.category);
      if (formData.coverImage) {
        uploadData.append("cover_image", formData.coverImage);
      }
      formData.tags.forEach((tag) => {
        uploadData.append("tags", tag);
      });

      if (editItem) {
        await updateBlog({ slug: editItem.slug, body: uploadData }).unwrap();
        toast.success("Blog updated successfully");
      } else {
        await addBlog(uploadData).unwrap();
        toast.success("Blog added successfully");
      }
      onBack();
    } catch (err) {
      console.error(
        editItem ? "Failed to update blog:" : "Failed to add blog:",
        err,
      );
      toast.error(
        "Error " +
          (editItem ? "updating" : "adding") +
          " blog: " +
          (err.data?.detail || err.message || "Unknown error"),
      );
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
          {/* Cover Image Upload */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm flex flex-col gap-6">
            <h3 className="text-neutral-950 text-lg font-medium">
              Cover Image
            </h3>
            <div
              onClick={() => fileInputRef.current.click()}
              className="w-full h-80 rounded-[10px] border-2 border-dashed border-gray-300 flex flex-col justify-center items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden"
            >
              {formData.coverImagePreview ? (
                <img
                  src={formData.coverImagePreview}
                  className="w-full h-full object-cover"
                  alt="Cover"
                />
              ) : (
                <>
                  <div className="p-4 bg-gray-100 rounded-full group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm font-semibold">
                    Click to upload cover image
                  </p>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                    Recommended: 1200x630px, JPG or PNG
                  </p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "cover")}
              />
            </div>
          </div>

          {/* Content Title */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-4">
            <h3 className="text-neutral-950 text-lg font-medium">
              Content Title
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter a compelling title..."
                className="w-full px-4 py-3 bg-zinc-100 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20 font-bold placeholder:text-gray-500"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <p className="text-gray-500 text-xs font-normal">
                0/100 characters
              </p>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-4">
            <h3 className="text-neutral-950 text-lg font-medium">
              Description
            </h3>
            <div className="space-y-2">
              <textarea
                placeholder="Write a brief summary (this will appear in Content previews)..."
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
              About this Content
            </h3>
            <div className="space-y-2">
              <TextEditor
                htmlElement={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                isEditable={true}
                placeholder="Write your content here..."
              />
              <p className="text-gray-500 text-sm font-normal">
                {wordCount} words
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-6">
          <div className="space-y-6">
            {/* Category Selection */}
            <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-6">
              <h3 className="text-neutral-950 text-lg font-medium">Category</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full h-11 px-4 bg-zinc-100 rounded-lg flex items-center justify-between text-neutral-900 text-sm font-medium hover:bg-zinc-200 transition-all outline-none focus:ring-2 focus:ring-[#7AA4A5]/20"
                >
                  <span className="truncate">
                    {categories.find(
                      (c) => c.id.toString() === formData.category.toString(),
                    )?.name || "Select Category"}
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
                          <p className="text-xs text-stone-400 p-4 text-center">
                            No categories found
                          </p>
                        ) : (
                          categories.map((cat) => (
                            <div
                              key={cat.id}
                              className={`group flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                                formData.category.toString() ===
                                cat.id.toString()
                                  ? "bg-teal-50 text-teal-700 font-bold"
                                  : "text-stone-600 hover:bg-stone-50"
                              }`}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  category: cat.id.toString(),
                                }));
                                setIsCategoryOpen(false);
                              }}
                            >
                              <span className="truncate">{cat.name}</span>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleDeleteCategory(cat.slug, cat.id, e)
                                }
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
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleAddCategory()
                          }
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
              className="bg-[#7AA4A5] hover:bg-[#6b9192] text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md flex items-center gap-2 group"
            >
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadContent;
