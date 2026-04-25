import React, { useState, useEffect } from "react";
import { X, Edit3, Save, ChevronDown, Eye, EyeOff, FileText, Upload } from "lucide-react";
import TextEditor from "../../components/Editor";
import {
  useUpdateBookMutation,
  useGetBookCategoriesQuery,
  useGetLuluPackagesQuery,
  useGetBookDetailsQuery,
} from "../../Api/adminApi";
import toast from "react-hot-toast";
import { useRef } from "react";

const EditBookModal = ({ book, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState("Basic");
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    authorDesignation: "",
    description: "",
    category: "1",
    language: "English",
    digitalPrice: "0",
    physicalPrice: "0",
    type: "Both",
    isbn: "",
    publisher: "",
    published_date: "",
    number_of_pages: "0",
    tags: "",
    stock_count: "0",
    video_url: "",
    is_visible: true,
    lulu_pod_package_id: "",
    digital_file: null,
    sampleFile: null,
    luluCoverPdf: null,
    coverImage: null,
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [updateBook, { isLoading }] = useUpdateBookMutation();
  const { data: categories } = useGetBookCategoriesQuery();
  const { data: luluPackages } = useGetLuluPackagesQuery();
  const { data: detailedBook, isFetching: isDetailsLoading } = useGetBookDetailsQuery(book.slug, { skip: !book?.slug });

  const fileInputRef = useRef(null);
  const sampleInputRef = useRef(null);
  const luluCoverInputRef = useRef(null);
  const coverImageRef = useRef(null);

  useEffect(() => {
    const activeBook = detailedBook || book;
    if (activeBook) {
      const getBookType = (b) => {
        if (b.has_physical && b.has_digital) return "Both";
        if (b.has_physical) return "Physical";
        if (b.has_digital) return "Digital";
        return "Both";
      };

      setFormData({
        title: activeBook.title || "",
        author: activeBook.author || "",
        authorDesignation: activeBook.author_designation || "",
        description: activeBook.description || "",
        category: activeBook.category?.toString() || "1",
        language: activeBook.language || "English",
        digitalPrice: activeBook.digital_price || "0",
        physicalPrice: activeBook.physical_price || "0",
        type: getBookType(activeBook),
        isbn: activeBook.isbn || "",
        publisher: activeBook.publisher || "",
        published_date: activeBook.published_date || "",
        number_of_pages: activeBook.number_of_pages?.toString() || "0",
        tags: Array.isArray(activeBook.tags) ? activeBook.tags.join(", ") : activeBook.tags || "",
        stock_count: activeBook.stock_count?.toString() || "0",
        video_url: activeBook.video_url || "",
        is_visible: activeBook.is_visible ?? true,
        lulu_pod_package_id: activeBook.lulu_pod_package_id || "",
        digital_file: null,
        sampleFile: null,
        luluCoverPdf: null,
        coverImage: null,
      });
    }
  }, [detailedBook, book]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "book") {
      setFormData((prev) => ({ ...prev, digital_file: file }));
    } else if (type === "sample") {
      setFormData((prev) => ({ ...prev, sampleFile: file }));
    } else if (type === "lulu_cover") {
      setFormData((prev) => ({ ...prev, luluCoverPdf: file }));
    } else if (type === "cover") {
      setFormData((prev) => ({ ...prev, coverImage: file }));
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    const has_physical = formData.type === "Physical" || formData.type === "Both";
    const has_digital = formData.type === "Digital" || formData.type === "Both";

    data.append("category", formData.category);
    data.append("title", formData.title);
    data.append("author", formData.author);
    data.append("author_designation", formData.authorDesignation);
    data.append("description", formData.description);
    data.append("isbn", formData.isbn);
    data.append("language", formData.language);
    data.append("publisher", formData.publisher);
    data.append("published_date", formData.published_date);
    data.append("number_of_pages", formData.number_of_pages);
    data.append("video_url", formData.video_url || "");
    data.append("has_physical", has_physical);
    data.append("physical_price", has_physical ? formData.physicalPrice : "0");
    data.append("stock_count", formData.stock_count);
    data.append("has_digital", has_digital);
    data.append("digital_price", has_digital ? formData.digitalPrice : "0");

    if (formData.coverImage) data.append("cover_image", formData.coverImage);

    if (formData.digital_file) data.append("digital_file", formData.digital_file);
    if (formData.sampleFile) data.append("sample_file", formData.sampleFile);
    if (formData.luluCoverPdf) data.append("lulu_cover_pdf", formData.luluCoverPdf);
    if (formData.lulu_pod_package_id) data.append("lulu_pod_package_id", formData.lulu_pod_package_id);

    const tagsArray = formData.tags
      ? formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "")
      : [];
    data.append("tags", JSON.stringify(tagsArray));
    data.append("is_visible", formData.is_visible);

    try {
      await updateBook({ slug: book.slug, body: data }).unwrap();
      toast.success("Book updated successfully!");
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update book.");
    }
  };

  if (!book) return null;

  const activeBook = detailedBook || book;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[600px] bg-white rounded-3xl shadow-2xl relative overflow-hidden arimo-font animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <style>{`
            .scrollbar-thin::-webkit-scrollbar {
              width: 6px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: transparent;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: #e4e4e7;
              border-radius: 10px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb:hover {
              background: #d4d4d8;
            }
          `}</style>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 text-teal-600 mb-1">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <h2 className="text-neutral-950 text-xl font-bold">
                Edit Book Details
              </h2>
            </div>
            <p className="text-gray-500 text-sm font-normal">
              Update book information and library settings
            </p>
          </div>

          <div className="w-full bg-gray-100 p-1.5 rounded-2xl flex gap-1 mb-8">
            {["Basic", "Details", "Files"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-gray-500 hover:text-neutral-800"
                  }`}
              >
                {tab === "Basic" ? "Basic Info" : tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === "Basic" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter book title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                      required
                    />
                  </div>

                  {/* Visible Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 border border-black/5 rounded-2xl transition-all hover:bg-zinc-100/50">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl transition-colors ${formData.is_visible
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                            }`}
                        >
                          {formData.is_visible ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 arimo-font">
                            Visibility Status
                          </p>
                          <p className="text-xs text-gray-500">
                            {formData.is_visible
                              ? "Visible on library"
                              : "Hidden from library"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            is_visible: !prev.is_visible,
                          }))
                        }
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent ring-offset-2 ${formData.is_visible ? "bg-teal-600" : "bg-gray-300"
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_visible
                            ? "translate-x-7"
                            : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      name="author"
                      placeholder="Enter author name"
                      value={formData.author}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Author Designation *
                    </label>
                    <input
                      type="text"
                      name="authorDesignation"
                      placeholder="Enter author designation"
                      value={formData.authorDesignation}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Description *
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-black/5">
                    <TextEditor
                      htmlElement={formData.description}
                      isEditable={true}
                      onChange={(html) =>
                        setFormData((prev) => ({ ...prev, description: html }))
                      }
                    />
                  </div>
                </div>

                {/* Category & Prices - 3 Column Layout from Screenshot */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none appearance-none text-sm text-neutral-950 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                      >
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="col-span-3 space-y-2">
                    <label className="text-neutral-950 text-xs font-bold ml-1 truncate block">
                      Digital Price ($)
                    </label>
                    <input
                      type="text"
                      name="digitalPrice"
                      value={formData.digitalPrice}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm text-neutral-950 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>

                  <div className="col-span-3 space-y-2">
                    <label className="text-neutral-950 text-xs font-bold ml-1 truncate block">
                      Physical Price ($)
                    </label>
                    <input
                      type="text"
                      name="physicalPrice"
                      value={formData.physicalPrice}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm text-neutral-950 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                </div>

                {/* Book Type */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Book Type *
                  </label>
                  <div className="relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none appearance-none text-sm text-neutral-950 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    >
                      <option value="Both">Both (Physical & Digital)</option>
                      <option value="Digital">Digital</option>
                      <option value="Physical">Physical</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      name="isbn"
                      placeholder="978-..."
                      value={formData.isbn}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Publisher
                    </label>
                    <input
                      type="text"
                      name="publisher"
                      placeholder="Enter publisher"
                      value={formData.publisher}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Lulu POD Package
                  </label>
                  <div className="relative">
                    <select
                      name="lulu_pod_package_id"
                      value={formData.lulu_pod_package_id}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none appearance-none text-sm text-neutral-950 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    >
                      <option value="">Select Package</option>
                      {luluPackages?.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.description}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Language
                    </label>
                    <input
                      type="text"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Pages
                    </label>
                    <input
                      type="number"
                      name="number_of_pages"
                      value={formData.number_of_pages}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Stock Count
                    </label>
                    <input
                      type="number"
                      name="stock_count"
                      value={formData.stock_count}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Publish Date
                    </label>
                    <input
                      type="date"
                      name="published_date"
                      value={formData.published_date}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Video URL
                  </label>
                  <input
                    type="text"
                    name="video_url"
                    placeholder="https://..."
                    value={formData.video_url}
                    onChange={handleChange}
                    className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="Tag 1, Tag 2..."
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                  />
                </div>
              </div>
            )}

            {activeTab === "Files" && (
              <div className="space-y-6">
                {/* Cover Image */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Cover Image
                  </label>
                  <div
                    onClick={() => coverImageRef.current?.click()}
                    className="h-44 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-teal-400 transition-all bg-zinc-50/50 overflow-hidden"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={coverImageRef}
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "cover")}
                    />
                    {coverPreview ? (
                      <img src={coverPreview} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                    ) : activeBook.cover_image ? (
                      <div className="relative w-full h-full">
                        <img src={activeBook.cover_image} alt="Current" className="w-full h-full object-contain rounded-2xl" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-xs text-gray-500 font-bold text-center">
                          Click to upload cover image
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Book File */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Book File (PDF)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-teal-400 transition-all bg-zinc-50/50"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "book")}
                    />
                    {formData.digital_file ? (
                      <div className="flex items-center gap-3 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
                        <FileText className="w-6 h-6 text-teal-600" />
                        <span className="text-xs font-bold text-teal-900 truncate max-w-[200px]">
                          {formData.digital_file.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-7 h-7 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-bold text-center">
                          {activeBook.digital_file ? "Click to replace book file" : "Click to upload book file"}
                        </p>
                        {activeBook.digital_file && <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-wider">File already exists</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Sample File */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Sample File (PDF)
                  </label>
                  <div
                    onClick={() => sampleInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-teal-400 transition-all bg-zinc-50/50"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={sampleInputRef}
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "sample")}
                    />
                    {formData.sampleFile ? (
                      <div className="flex items-center gap-3 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
                        <FileText className="w-6 h-6 text-teal-600" />
                        <span className="text-xs font-bold text-teal-900 truncate max-w-[200px]">
                          {formData.sampleFile.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-7 h-7 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-bold text-center">
                          {activeBook.sample_file ? "Click to replace sample file" : "Click to upload sample file"}
                        </p>
                        {activeBook.sample_file && <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-wider">Sample already exists</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Lulu Cover PDF */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Lulu Cover PDF
                  </label>
                  <div
                    onClick={() => luluCoverInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-teal-400 transition-all bg-zinc-50/50"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={luluCoverInputRef}
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "lulu_cover")}
                    />
                    {formData.luluCoverPdf ? (
                      <div className="flex items-center gap-3 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
                        <FileText className="w-6 h-6 text-teal-600" />
                        <span className="text-xs font-bold text-teal-900 truncate max-w-[200px]">
                          {formData.luluCoverPdf.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-bold text-center">
                          {activeBook.lulu_cover_pdf ? "Click to replace Lulu cover PDF" : "Click to upload Lulu cover PDF"}
                        </p>
                        {activeBook.lulu_cover_pdf && <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-wider">Lulu cover exists</p>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-4 pt-8 mt-4 border-t border-black/5">
              <button
                type="button"
                onClick={onClose}
                className="px-8 h-14 bg-white border border-black/10 hover:bg-gray-50 text-neutral-950 rounded-2xl text-sm font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center gap-3 text-sm font-bold transition-all disabled:opacity-50 shadow-xl shadow-teal-600/20 active:scale-95"
              >
                <Save className="w-6 h-6" />
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookModal;
