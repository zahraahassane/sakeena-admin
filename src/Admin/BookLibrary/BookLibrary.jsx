import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Download,
  Eye,
  Layers,
  ChevronDown,
  Plus,
  Calendar,
  FileText,
  Edit3,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import EditBookModal from "./EditBookModal";
import UploadBookModal from "./UploadBookModal";
import {
  useGetBooksDataQuery,
  useDeleteBookMutation,
  useGetBookCategoriesQuery,
  useAddBookCategoryMutation,
  useDeleteBookCategoryMutation,
} from "../../Api/adminApi";
import toast from "react-hot-toast";

const BookLibrary = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: apiData, isLoading, isError } = useGetBooksDataQuery();
  const { data: categories } = useGetBookCategoriesQuery();
  console.log("categories", categories);
  const [addBookCategory] = useAddBookCategoryMutation();
  const [deleteBookCategory] = useDeleteBookCategoryMutation();
  const [deleteBook] = useDeleteBookMutation();

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addBookCategory(newCategoryName).unwrap();
      setNewCategoryName("");
      toast.success("Category added!");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id, slug, e) => {
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
                  await deleteBookCategory(slug).unwrap();
                  toast.success("Category deleted");
                  if (selectedCategory === id.toString()) {
                    setSelectedCategory("");
                  }
                } catch (error) {
                  console.error("Delete category error:", error);
                  const errorMsg = error?.data?.detail || "Failed to delete category";
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
      }
    );
  };

  const books =
    apiData?.results?.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? book.category === parseInt(selectedCategory)
        : true;
      return matchesSearch && matchesCategory;
    }) || [];

  // Local helper to format book type
  const getBookType = (book) => {
    if (book.has_physical && book.has_digital) return "Both";
    if (book.has_physical) return "Physical";
    if (book.has_digital) return "Digital";
    return "N/A";
  };

  // Helper to strip HTML tags for preview
  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleUpdateBook = (updatedBook) => {
    setEditingBook(null);
  };

  const handleAddBook = (newBook) => {
    setShowUploadModal(false);
  };

  const handleRemoveBook = (book) => {
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800 inter-font">
              Confirm Delete
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Are you sure you want to remove "{book.title}"?
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
                  await deleteBook(book.slug).unwrap();
                  toast.success("Book removed successfully", {
                    icon: "🗑️",
                    style: {
                      borderRadius: "12px",
                      background: "#333",
                      color: "#fff",
                    },
                  });
                } catch (error) {
                  toast.error("Failed to delete book");
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

  const stats = [
    {
      label: "Total Books",
      value: apiData?.count || "0",
      icon: BookOpen,
      color: "bg-teal-600",
    },
    {
      label: "Total Downloads",
      value: "0",
      icon: Download,
      color: "bg-blue-600",
    },
    { label: "Total Views", value: "0", icon: Eye, color: "bg-green-600" },
    {
      label: "Categories",
      value: "N/A",
      icon: Layers,
      color: "bg-purple-600",
    },
  ];

  return (
    <div className="pt-2 flex flex-col gap-8 animate-in fade-in duration-500 pb-10 arimo-font">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#7AA4A5] hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2 inter-font"
        >
          <Plus className="w-4 h-4" />
          Create New Book
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/10 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, author, or description..."
            className="w-full h-11 pl-11 pr-4 bg-zinc-100 border-none rounded-lg focus:ring-2 focus:ring-[#7AA4A5]/20 text-sm text-neutral-900 placeholder:text-gray-500 transition-all font-normal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative min-w-[200px] flex-1 md:flex-none">
            <div
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="w-full h-11 pl-4 pr-10 bg-zinc-100 border-none rounded-lg flex items-center justify-between cursor-pointer text-sm text-neutral-950 focus-within:ring-2 focus-within:ring-[#7AA4A5]/20 font-normal"
            >
              <span className="truncate">
                {categories?.find((c) => c.id === parseInt(selectedCategory))
                  ?.name || "All Categories"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryMenu ? "rotate-180" : ""}`}
              />
            </div>

            {showCategoryMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowCategoryMenu(false)}
                />
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/10 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        setShowCategoryMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-lg transition-colors ${!selectedCategory ? "text-teal-600 bg-teal-50/50 font-medium" : "text-neutral-700"}`}
                    >
                      All Categories
                    </button>
                    {categories?.map((cat) => (
                      <div
                        key={cat.id}
                        className="group flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedCategory(cat.id.toString());
                          setShowCategoryMenu(false);
                        }}
                      >
                        <span
                          className={`text-sm truncate ${selectedCategory === cat.id.toString() ? "text-teal-600 font-medium" : "text-neutral-700"}`}
                        >
                          {cat.name}
                        </span>
                        <button
                          onClick={(e) =>
                            handleDeleteCategory(cat.id, cat.slug, e)
                          }
                          className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all ml-auto flex-shrink-0"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-black/5 bg-gray-50/50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add category..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddCategory()
                        }
                        className="flex-1 h-9 px-3 text-xs bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all font-normal"
                      />
                      <button
                        onClick={handleAddCategory}
                        className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="p-3 bg-zinc-100 rounded-lg text-gray-500 hover:bg-zinc-200 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm animate-pulse">
            Loading amazing books...
          </p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-800 font-bold">Failed to load library</p>
          <p className="text-gray-500 text-sm mt-1">
            Please check your connection or try again later.
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
                <img
                  src={book.cover_image}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Content Container */}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="space-y-1">
                  <h3 className="text-neutral-950 text-lg font-bold leading-7 line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm font-normal">
                    {book.author}
                  </p>
                  <p className="text-gray-600 text-xs font-normal">
                    {book.author_designation}
                  </p>
                </div>

                <p className="text-gray-500 text-sm font-normal leading-5 line-clamp-3">
                  {stripHtml(book.description)}
                </p>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Download className="w-3.5 h-3.5" />0
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(book.published_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-teal-600 text-sm font-bold leading-tight text-right">
                    {parseFloat(book.digital_price) > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">
                          Digital Price:
                        </span>{" "}
                        $ {book.digital_price}
                      </div>
                    )}
                    {parseFloat(book.physical_price) > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">
                          Physical Price:
                        </span>{" "}
                        {book.physical_price}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-fit px-2 py-0.5 bg-teal-50 rounded-lg border border-teal-300 text-teal-700 text-xs font-bold">
                  {getBookType(book)}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-black/5">
                  <button
                    onClick={() => navigate(`/admin/book-library/${book.slug}`)}
                    className="flex-1 h-9 bg-[#7AA4A5] hover:bg-[#6b9192] text-white rounded-lg flex items-center justify-center gap-2 text-sm font-normal transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => setEditingBook(book)}
                    className="w-9 h-9 border border-black/10 rounded-lg flex items-center justify-center text-neutral-950 hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveBook(book)}
                    className="w-9 h-9 border border-black/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Book Modal */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={handleUpdateBook}
        />
      )}

      {/* Upload Book Modal */}
      {showUploadModal && (
        <UploadBookModal
          onClose={() => setShowUploadModal(false)}
          onSave={handleAddBook}
        />
      )}
    </div>
  );
};

export default BookLibrary;
