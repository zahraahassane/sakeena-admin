import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Edit3, Save, ChevronDown, Eye, EyeOff, FileText, Upload, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Ruler } from "lucide-react";
import TextEditor from "../../components/Editor";
import {
  useUpdateBookMutation,
  useGetBookCategoriesQuery,
  useGetBookDetailsQuery,
  useAddBookCategoryMutation,
  useDeleteBookCategoryMutation,
  useGetLuluPackagesQuery,
  useValidateLuluInteriorMutation,
  useLazyGetLuluInteriorValidationResultQuery,
  useGetLuluCoverDimensionsMutation,
  useValidateLuluCoverMutation,
  useLazyGetLuluCoverValidationResultQuery,
} from "../../Api/adminApi";
import toast from "react-hot-toast";

const LULU_STATUS_STYLES = {
  NOT_SUBMITTED: { label: "Not submitted", cls: "bg-gray-100 text-gray-500" },
  VALIDATING: { label: "Validating…", cls: "bg-amber-50 text-amber-600" },
  NORMALIZING: { label: "Validating…", cls: "bg-amber-50 text-amber-600" },
  VALIDATED: { label: "Validated", cls: "bg-emerald-50 text-emerald-600" },
  NORMALIZED: { label: "Validated", cls: "bg-emerald-50 text-emerald-600" },
  ERROR: { label: "Failed", cls: "bg-rose-50 text-rose-600" },
};

const LuluStatusPill = ({ status }) => {
  const s = LULU_STATUS_STYLES[status] || LULU_STATUS_STYLES.NOT_SUBMITTED;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${s.cls}`}>
      {s.label}
    </span>
  );
};

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
    physical_isbn: "",
    digital_isbn: "",
    publisher: "",
    published_date: "",
    page_count: "0",
    tags: "",
    stock_count: "0",
    video_url: "",
    is_visible: true,
    lulu_pod_package_id: "",
    physical_file: null,
    digital_file: null,
    sampleFile: null,
    luluCoverPdf: null,
    coverImage: null,
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [updateBook, { isLoading }] = useUpdateBookMutation();
  const { data: categoriesResponse } = useGetBookCategoriesQuery();
  const [addBookCategory] = useAddBookCategoryMutation();
  const [deleteBookCategory] = useDeleteBookCategoryMutation();
  const { data: luluPackages } = useGetLuluPackagesQuery();

  const categories = categoriesResponse || [];
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const { data: detailedBook, isFetching: isDetailsLoading, refetch: refetchBookDetails } = useGetBookDetailsQuery(book.slug, { skip: !book?.slug });

  // --- Lulu print-readiness workflow ---
  const [validateInterior] = useValidateLuluInteriorMutation();
  const [pollInteriorResult] = useLazyGetLuluInteriorValidationResultQuery();
  const [getCoverDimensions, { isLoading: isCalculatingDimensions }] = useGetLuluCoverDimensionsMutation();
  const [validateCover] = useValidateLuluCoverMutation();
  const [pollCoverResult] = useLazyGetLuluCoverValidationResultQuery();

  const [interiorCheck, setInteriorCheck] = useState({ status: "NOT_SUBMITTED", errors: [], busy: false });
  const [coverCheck, setCoverCheck] = useState({ status: "NOT_SUBMITTED", errors: [], busy: false });
  const [coverDims, setCoverDims] = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const pollUntilDone = useCallback(async (trigger, setState, terminalStates) => {
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (!mountedRef.current) return;
      let result;
      try {
        result = await trigger(book.slug).unwrap();
      } catch (err) {
        setState({ status: "ERROR", errors: [err?.data?.error || "Failed to check validation status."], busy: false });
        return;
      }
      if (!mountedRef.current) return;
      setState({ status: result.status, errors: result.errors || [], busy: !terminalStates.includes(result.status) });
      if (terminalStates.includes(result.status)) {
        refetchBookDetails();
        return;
      }
    }
    setState((prev) => ({ ...prev, busy: false }));
  }, [book.slug, refetchBookDetails]);

  const handleValidateInterior = async () => {
    setInteriorCheck({ status: "VALIDATING", errors: [], busy: true });
    try {
      const res = await validateInterior(book.slug).unwrap();
      setInteriorCheck({ status: res.status, errors: [], busy: true });
    } catch (err) {
      setInteriorCheck({ status: "ERROR", errors: [err?.data?.error || "Failed to submit for validation."], busy: false });
      return;
    }
    pollUntilDone(pollInteriorResult, setInteriorCheck, ["VALIDATED", "ERROR"]);
  };

  const handleGetCoverDimensions = async () => {
    try {
      const res = await getCoverDimensions(book.slug).unwrap();
      setCoverDims(res);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to calculate cover dimensions.");
    }
  };

  const handleValidateCover = async () => {
    setCoverCheck({ status: "NORMALIZING", errors: [], busy: true });
    try {
      const res = await validateCover(book.slug).unwrap();
      setCoverCheck({ status: res.status, errors: [], busy: true });
    } catch (err) {
      setCoverCheck({ status: "ERROR", errors: [err?.data?.error || "Failed to submit for validation."], busy: false });
      return;
    }
    pollUntilDone(pollCoverResult, setCoverCheck, ["NORMALIZED", "ERROR"]);
  };

  const fileInputRef = useRef(null);
  const physicalFileInputRef = useRef(null);
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
        physical_isbn: activeBook.physical_isbn || "",
        digital_isbn: activeBook.digital_isbn || "",
        publisher: activeBook.publisher || "",
        published_date: activeBook.published_date || "",
        page_count: activeBook.page_count?.toString() || "0",
        tags: Array.isArray(activeBook.tags) ? activeBook.tags.join(", ") : activeBook.tags || "",
        stock_count: activeBook.stock_count?.toString() || "0",
        video_url: activeBook.video_url || "",
        is_visible: activeBook.is_visible ?? true,
        lulu_pod_package_id: activeBook.lulu_pod_package_id || "",
        physical_file: null,
        digital_file: null,
        sampleFile: null,
        luluCoverPdf: null,
        coverImage: null,
      });
      setInteriorCheck({
        status: activeBook.lulu_interior_validation_status || "NOT_SUBMITTED",
        errors: activeBook.lulu_interior_validation_errors || [],
        busy: false,
      });
      setCoverCheck({
        status: activeBook.lulu_cover_validation_status || "NOT_SUBMITTED",
        errors: activeBook.lulu_cover_validation_errors || [],
        busy: false,
      });
      if (activeBook.lulu_cover_required_width) {
        setCoverDims({
          width: activeBook.lulu_cover_required_width,
          height: activeBook.lulu_cover_required_height,
          unit: activeBook.lulu_cover_dimension_unit,
        });
      }
    }
  }, [detailedBook, book]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "digital") {
      setFormData((prev) => ({ ...prev, digital_file: file }));
    } else if (type === "physical") {
      setFormData((prev) => ({ ...prev, physical_file: file }));
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addBookCategory(newCategoryName.trim()).unwrap();
      setNewCategoryName("");
      toast.success("Category added successfully");
    } catch (err) {
      console.error("Failed to add category:", err);
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id, e) => {
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
                  await deleteBookCategory(id).unwrap();
                  toast.success("Category deleted");
                  if (formData.category === id.toString()) {
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
    data.append("physical_isbn", formData.physical_isbn);
    data.append("digital_isbn", formData.digital_isbn);
    data.append("language", formData.language);
    data.append("publisher", formData.publisher);
    data.append("published_date", formData.published_date);
    data.append("page_count", formData.page_count);
    data.append("video_url", formData.video_url || "");
    data.append("has_physical", has_physical);
    data.append("physical_price", has_physical ? formData.physicalPrice : "0");
    data.append("stock_count", formData.stock_count);
    data.append("has_digital", has_digital);
    data.append("digital_price", has_digital ? formData.digitalPrice : "0");

    if (formData.coverImage) data.append("cover_image", formData.coverImage);

    if (formData.digital_file) data.append("digital_file", formData.digital_file);
    if (formData.physical_file) data.append("physical_file", formData.physical_file);
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
            {["Basic", "Details", "Files", "Print Setup"].map((tab) => (
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
                      <button
                        type="button"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl flex items-center justify-between text-neutral-950 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
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
                          <div className="absolute top-13 left-0 mt-2 p-1 bg-white border border-stone-100 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-[220px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                            <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                              {categories.length === 0 ? (
                                <p className="text-xs text-stone-400 p-4 text-center">No categories found</p>
                              ) : (
                                categories.map((cat) => (
                                  <div
                                    key={cat.id}
                                    className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${formData.category.toString() === cat.id.toString()
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
                                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
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
                                className="flex-1 h-9 px-3 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all shadow-sm"
                              />
                              <button
                                type="button"
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
                      Physical ISBN
                    </label>
                    <input
                      type="text"
                      name="physical_isbn"
                      placeholder="978-..."
                      value={formData.physical_isbn}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-neutral-950 text-sm font-bold ml-1">
                      Digital ISBN
                    </label>
                    <input
                      type="text"
                      name="digital_isbn"
                      placeholder="978-..."
                      value={formData.digital_isbn}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                        <option value="">Select a print format…</option>
                        {(luluPackages || []).map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>{pkg.description}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
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
                      name="page_count"
                      value={formData.page_count}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 ml-1">Auto-corrected to Lulu's detected count after interior validation.</p>
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

                {/* Digital File */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Digital File (PDF)
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
                      onChange={(e) => handleFileChange(e, "digital")}
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
                          {activeBook.digital_file ? "Click to replace digital file" : "Click to upload digital file"}
                        </p>
                        {activeBook.digital_file && <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-wider">File already exists</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Physical File */}
                <div className="space-y-2">
                  <label className="text-neutral-950 text-sm font-bold ml-1">
                    Physical File (PDF)
                  </label>
                  <div
                    onClick={() => physicalFileInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-teal-400 transition-all bg-zinc-50/50"
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={physicalFileInputRef}
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "physical")}
                    />
                    {formData.physical_file ? (
                      <div className="flex items-center gap-3 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
                        <FileText className="w-6 h-6 text-teal-600" />
                        <span className="text-xs font-bold text-teal-900 truncate max-w-[200px]">
                          {formData.physical_file.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-7 h-7 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-bold text-center">
                          {activeBook.physical_file ? "Click to replace physical file" : "Click to upload physical file"}
                        </p>
                        {activeBook.physical_file && <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-wider">File already exists</p>}
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

            {activeTab === "Print Setup" && (
              <div className="space-y-5">
                <div className="p-4 bg-zinc-50 border border-black/5 rounded-2xl flex items-center gap-3">
                  {activeBook.is_lulu_print_ready ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-neutral-900">
                      {activeBook.is_lulu_print_ready ? "Print-ready" : "Not yet validated by Lulu"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activeBook.is_lulu_print_ready
                        ? "Interior and cover both passed Lulu's checks."
                        : "Run interior and cover validation below before selling the physical edition."}
                    </p>
                  </div>
                </div>

                {/* Step 1 — Interior */}
                <div className="p-4 border border-black/5 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">1. Interior PDF</p>
                      <p className="text-xs text-gray-500">Validates the physical file and detects the real page count.</p>
                    </div>
                    <LuluStatusPill status={interiorCheck.status} />
                  </div>
                  <button
                    type="button"
                    onClick={handleValidateInterior}
                    disabled={!activeBook.physical_file || interiorCheck.busy}
                    className="px-4 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    {interiorCheck.busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {interiorCheck.busy ? "Validating…" : "Validate Interior PDF"}
                  </button>
                  {!activeBook.physical_file && (
                    <p className="text-[11px] text-amber-600">Upload the physical file in the Files tab first.</p>
                  )}
                  {interiorCheck.errors.length > 0 && (
                    <ul className="text-[11px] text-rose-600 list-disc pl-4 space-y-0.5">
                      {interiorCheck.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>

                {/* Step 2 — Required cover size */}
                <div className="p-4 border border-black/5 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">2. Required cover size</p>
                      <p className="text-xs text-gray-500">From the selected package + page count. Design the cover to this exact size.</p>
                    </div>
                    <Ruler className="w-5 h-5 text-gray-300 shrink-0" />
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCoverDimensions}
                    disabled={!formData.lulu_pod_package_id || !Number(formData.page_count) || isCalculatingDimensions}
                    className="px-4 h-10 bg-white border border-black/10 hover:bg-gray-50 disabled:opacity-40 text-neutral-900 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    {isCalculatingDimensions && <Loader2 className="w-4 h-4 animate-spin" />}
                    Get Required Cover Size
                  </button>
                  {(!formData.lulu_pod_package_id || !Number(formData.page_count)) && (
                    <p className="text-[11px] text-amber-600">Select a Lulu POD package and set page count in the Details tab first.</p>
                  )}
                  {coverDims && (
                    <p className="text-sm font-bold text-teal-700">
                      {coverDims.width} × {coverDims.height} {coverDims.unit}
                      <span className="block text-[11px] font-normal text-gray-500 mt-0.5">
                        Includes bleed and spine — front + spine + back in one file.
                      </span>
                    </p>
                  )}
                </div>

                {/* Step 3 — Cover */}
                <div className="p-4 border border-black/5 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">3. Cover PDF</p>
                      <p className="text-xs text-gray-500">Validates the Lulu cover PDF against the package + page count above.</p>
                    </div>
                    <LuluStatusPill status={coverCheck.status} />
                  </div>
                  <button
                    type="button"
                    onClick={handleValidateCover}
                    disabled={!activeBook.lulu_cover_pdf || coverCheck.busy}
                    className="px-4 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    {coverCheck.busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {coverCheck.busy ? "Validating…" : "Validate Cover PDF"}
                  </button>
                  {!activeBook.lulu_cover_pdf && (
                    <p className="text-[11px] text-amber-600">Upload the Lulu cover PDF in the Files tab first.</p>
                  )}
                  {coverCheck.errors.length > 0 && (
                    <ul className="text-[11px] text-rose-600 list-disc pl-4 space-y-0.5">
                      {coverCheck.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
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
