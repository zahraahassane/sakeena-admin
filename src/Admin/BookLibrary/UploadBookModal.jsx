import {
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Upload,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  useAddBookGalleryImageMutation,
  useAddBookMutation,
  useGetBookCategoriesQuery,
  useGetLuluPackagesQuery,
} from "../../Api/adminApi";
import TextEditor from "../../components/Editor";


const UploadBookModal = ({ onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState("Basic");
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    authorDesignation: "",
    description: "",
    category: "1",
    language: "English",
    digitalPrice: "",
    physicalPrice: "",
    type: "Both (Physical & Digital)",
    isbn: "978-1-234567-89-0",
    publisher: "",
    publishDate: "",
    pages: "0",
    tags: "Psychology, Islamic Studies, Mental Health",
    stock_count: "0",
    video_url: "",
    coverImage: null,
    otherImages: [null, null, null],
    digital_file: null,
    sampleFile: null,
    luluCoverPdf: null,
    lulu_pod_package_id: "",
    is_visible: true,
  });

  const [addBook, { isLoading: isCreating }] = useAddBookMutation();
  const [addGalleryImage, { isLoading: isUploadingGallery }] =
    useAddBookGalleryImageMutation();
  const { data: categories } = useGetBookCategoriesQuery();
  const { data: luluPackages } = useGetLuluPackagesQuery();

  useEffect(() => {
    if (categories?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        category: categories[0].id.toString(),
      }));
    }
  }, [categories]);

  useEffect(() => {
    if (luluPackages?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        lulu_pod_package_id: luluPackages[0].id,
      }));
    }
  }, [luluPackages]);

  const isLoading = isCreating || isUploadingGallery;

  const fileInputRef = useRef(null);
  const sampleInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const luluCoverInputRef = useRef(null);
  const otherInputRefs = [useRef(null), useRef(null), useRef(null)];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "cover") {
      setFormData((prev) => ({ ...prev, coverImage: file }));
    } else if (type === "other") {
      const newOtherImages = [...formData.otherImages];
      newOtherImages[index] = file;
      setFormData((prev) => ({ ...prev, otherImages: newOtherImages }));
    } else if (type === "book") {
      setFormData((prev) => ({ ...prev, digital_file: file }));
    } else if (type === "sample") {
      setFormData((prev) => ({ ...prev, sampleFile: file }));
    } else if (type === "lulu_cover") {
      setFormData((prev) => ({ ...prev, luluCoverPdf: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    const has_physical =
      formData.type.includes("Physical") || formData.type.includes("Both");
    const has_digital =
      formData.type.includes("Digital") || formData.type.includes("Both");

    data.append("category", formData.category);
    data.append("title", formData.title);
    data.append("author", formData.author);
    data.append("author_designation", formData.authorDesignation);
    data.append("description", formData.description);
    if (formData.coverImage) data.append("cover_image", formData.coverImage);
    data.append("isbn", formData.isbn);
    data.append("language", formData.language);
    data.append("publisher", formData.publisher);
    data.append(
      "published_date",
      formData.publishDate || new Date().toISOString().split("T")[0],
    );
    data.append("page_count", formData.pages);
    if (formData.digital_file) data.append("digital_file", formData.digital_file);
    if (formData.sampleFile) data.append("sample_file", formData.sampleFile);
    if (formData.luluCoverPdf) data.append("lulu_cover_pdf", formData.luluCoverPdf);
    if (formData.lulu_pod_package_id) data.append("lulu_pod_package_id", formData.lulu_pod_package_id);
    data.append("video_url", formData.video_url || "");
    data.append("has_physical", has_physical);
    data.append("physical_price", has_physical ? formData.physicalPrice : "0");
    data.append("stock_count", formData.stock_count || "0");
    data.append("has_digital", has_digital);
    data.append("digital_price", has_digital ? formData.digitalPrice : "0");
    const tagsArray = formData.tags
      ? formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "")
      : [];
    data.append("tags", JSON.stringify(tagsArray));
    data.append("is_visible", formData.is_visible);

    try {
      const bookResponse = await addBook(data).unwrap();
      const slug = bookResponse.slug;

      // Handle other images (gallery images) as separate POST requests
      const imageFiles = formData.otherImages
        .map((image, index) => ({ image, index }))
        .filter((item) => item.image instanceof File);

      if (imageFiles.length > 0) {
        toast.loading("Uploading gallery images...");

        const galleryPromises = imageFiles.map((item) =>
          addGalleryImage({
            slug,
            image: item.image,
            order: item.index,
          }).unwrap(),
        );

        await Promise.all(galleryPromises);
        toast.dismiss();
      }

      toast.success("Book and images uploaded successfully!");
      onClose();
    } catch (error) {
      toast.dismiss();
      toast.error(
        error?.data?.message || "Failed to upload book. Please try again.",
      );
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[550px] bg-white rounded-2xl shadow-2xl relative overflow-hidden arimo-font animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 hover:bg-gray-100 rounded-full transition-colors z-10 text-gray-400"
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
            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <div className="w-6 h-6 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h2 className="text-neutral-950 text-xl font-bold">
                Upload New Book
              </h2>
            </div>
            <p className="text-gray-500 text-sm font-normal">
              Add a new book to the library with all necessary details
            </p>
          </div>

          {/* Tabs */}
          <div className="w-full bg-gray-100 p-1 rounded-xl flex gap-1 mb-6">
            {["Basic", "Details", "Files"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter book title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm placeholder:text-gray-400"
                      required
                    />
                  </div>
                  {/* Visible Toggle */}
                  <div className="flex flex-col gap-1.5 pt-2">
                    <div className="flex items-center justify-between p-3 bg-zinc-100 border border-black/5 rounded-xl transition-all hover:bg-zinc-200/50">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg transition-colors ${formData.is_visible
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                            }`}
                        >
                          {formData.is_visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-900 arimo-font">
                            Visibility Status
                          </p>
                          <p className="text-[10px] text-gray-500">
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
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent ring-offset-2 ${formData.is_visible ? "bg-teal-600" : "bg-gray-300"
                          }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.is_visible
                            ? "translate-x-6"
                            : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Author *
                    </label>
                    <input
                      type="text"
                      name="author"
                      placeholder="Enter author name"
                      value={formData.author}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Author Designation *
                    </label>
                    <input
                      type="text"
                      name="authorDesignation"
                      placeholder="Enter author designation"
                      value={formData.authorDesignation}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-950 text-sm font-normal">
                    Description *
                  </label>
                  <TextEditor
                    value={formData.description}
                    onChange={(html) =>
                      setFormData((prev) => ({ ...prev, description: html }))
                    }
                    isEditable={true}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none appearance-none text-sm text-neutral-950"
                      >
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Language
                    </label>
                    <div className="relative">
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none appearance-none text-sm text-neutral-950"
                      >
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Bengali">Bengali</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Digital Price ($) *
                    </label>
                    <input
                      type="text"
                      name="digitalPrice"
                      placeholder="99"
                      value={formData.digitalPrice}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Physical Price ($) *
                    </label>
                    <input
                      type="text"
                      name="physicalPrice"
                      placeholder="99"
                      value={formData.physicalPrice}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Book Type *
                    </label>
                    <div className="relative">
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none appearance-none text-sm text-neutral-950"
                      >
                        <option value="Both (Physical & Digital)">
                          Both (Physical & Digital)
                        </option>
                        <option value="Physical">Physical Only</option>
                        <option value="Digital">Digital Only</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Stock Count
                    </label>
                    <input
                      type="number"
                      name="stock_count"
                      placeholder="0"
                      value={formData.stock_count}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Video URL *
                    </label>
                    <input
                      type="text"
                      name="video_url"
                      placeholder="https://youtube.com/..."
                      value={formData.video_url}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      ISBN
                    </label>
                    <input
                      type="text"
                      name="isbn"
                      placeholder="978-1-234567-89-0"
                      value={formData.isbn}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Publisher
                    </label>
                    <input
                      type="text"
                      name="publisher"
                      placeholder="Publisher name"
                      value={formData.publisher}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-950 text-sm font-normal">
                    Lulu POD Package
                  </label>
                  <div className="relative">
                    <select
                      name="lulu_pod_package_id"
                      value={formData.lulu_pod_package_id}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none appearance-none text-sm text-neutral-950"
                    >
                      {luluPackages?.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.description}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Publication Date
                    </label>
                    <input
                      type="date"
                      name="publishDate"
                      value={formData.publishDate}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-950 text-sm font-normal">
                      Number of Pages
                    </label>
                    <input
                      type="number"
                      name="pages"
                      placeholder="0"
                      value={formData.pages}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-950 text-sm font-normal">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="Psychology, Islamic Studies, Mental Health"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full h-10 px-3 bg-zinc-100 rounded-lg outline-none text-sm placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            {activeTab === "Files" && (
              <div className="space-y-5">
                <div className="flex gap-4">
                  {/* Cover Image */}
                  <div className="flex-1 space-y-2">
                    <label className="text-neutral-950 text-sm font-normal">
                      Cover Image *
                    </label>
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      className="h-44 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-teal-400 transition-colors bg-gray-50/50"
                    >
                      <input
                        type="file"
                        className="hidden"
                        ref={coverInputRef}
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "cover")}
                      />
                      {formData.coverImage ? (
                        <div className="relative w-full h-full">
                          <img
                            src={URL.createObjectURL(formData.coverImage)}
                            className="w-full h-full object-contain rounded-lg"
                            alt="Cover"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-600 text-center font-medium">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            PNG, JPG up to 5MB
                          </p>
                          <button
                            type="button"
                            className="mt-4 px-3 py-1.5 bg-white border border-black/10 rounded-lg text-xs font-medium"
                          >
                            Select Image
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Other Images */}
                  <div className="w-[180px] space-y-2">
                    <label className="text-neutral-950 text-sm font-normal">
                      Other Image
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[0, 1, 2].map((idx) => (
                        <div
                          key={idx}
                          onClick={() => otherInputRefs[idx].current?.click()}
                          className="h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-400 transition-colors bg-gray-50/50"
                        >
                          <input
                            type="file"
                            className="hidden"
                            ref={otherInputRefs[idx]}
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "other", idx)}
                          />
                          {formData.otherImages[idx] ? (
                            <img
                              src={URL.createObjectURL(
                                formData.otherImages[idx],
                              )}
                              className="w-full h-full object-cover rounded-md"
                              alt="Other"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[10px] text-gray-400">
                                PNG, JPG up to 5MB
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Book File */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-normal">
                    Book File (PDF) *
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-teal-400 transition-colors bg-gray-50/50"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "book")}
                    />
                    {formData.digital_file ? (
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-teal-600" />
                        <span className="text-sm font-medium text-neutral-950">
                          {formData.digital_file.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF up to 50MB
                        </p>
                        <button
                          type="button"
                          className="mt-4 px-4 py-2 bg-white border border-black/10 rounded-lg text-sm font-medium"
                        >
                          Select File
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Sample File */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-normal">
                    Sample File (PDF)
                  </label>
                  <div
                    onClick={() => sampleInputRef.current?.click()}
                    className="h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-teal-400 transition-colors bg-gray-50/50"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={sampleInputRef}
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "sample")}
                    />
                    {formData.sampleFile ? (
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-teal-600" />
                        <span className="text-sm font-medium text-neutral-950">
                          {formData.sampleFile.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF up to 10MB (preview pages)
                        </p>
                        <button
                          type="button"
                          className="mt-4 px-4 py-2 bg-white border border-black/10 rounded-lg text-sm font-medium"
                        >
                          Select File
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Lulu Cover PDF */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-normal">
                    Lulu Cover PDF
                  </label>
                  <div
                    onClick={() => luluCoverInputRef.current?.click()}
                    className="h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-teal-400 transition-colors bg-gray-50/50"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={luluCoverInputRef}
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "lulu_cover")}
                    />
                    {formData.luluCoverPdf ? (
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-teal-600" />
                        <span className="text-sm font-medium text-neutral-950">
                          {formData.luluCoverPdf.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Lulu print-ready cover PDF
                        </p>
                        <button
                          type="button"
                          className="mt-4 px-4 py-2 bg-white border border-black/10 rounded-lg text-sm font-medium"
                        >
                          Select File
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-3 pt-6 border-t border-black/5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-10 bg-white border border-black/10 hover:bg-gray-50 text-neutral-950 rounded-lg text-sm font-normal flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isLoading ? "Uploading..." : "Upload Book"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadBookModal;
