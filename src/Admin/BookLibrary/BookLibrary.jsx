import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeleteBookCategoryMutation,
  useDeleteBookMutation,
  useGetBookCategoriesQuery,
  useGetBooksDataQuery,
  useUpdateBookMutation,
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { stripHtml } from "./editor/bookFormModel";

const PAGE_SIZE = 12;

const editionLabel = (book) => {
  if (book.has_physical && book.has_digital) return "Digital + Physical";
  if (book.has_physical) return "Physical";
  if (book.has_digital) return "Digital";
  return "No edition";
};

const toastStyle = {
  minWidth: "350px",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

const BookLibrary = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Search on the server after the user stops typing, so every book is searchable, not just page one.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: apiData, isLoading, isFetching, isError, error } = useGetBooksDataQuery({
    page,
    page_size: PAGE_SIZE,
    search,
    category__slug: categorySlug,
  });
  const { data: categories = [] } = useGetBookCategoriesQuery();
  const [deleteBook] = useDeleteBookMutation();
  const [updateBook] = useUpdateBookMutation();
  const [deleteBookCategory] = useDeleteBookCategoryMutation();

  const books = apiData?.results || [];
  const totalPages = apiData?.total_pages || 1;
  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  const hideBook = async (book, toastId) => {
    if (toastId) toast.dismiss(toastId);
    try {
      await updateBook({ slug: book.slug, body: { is_visible: false } }).unwrap();
      toast.success(`"${book.title}" is now hidden from the store`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not hide the book."));
    }
  };

  const handleDeleteCategory = (category, e) => {
    e.stopPropagation();
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800">Delete “{category.name}”?</p>
            <p className="text-xs text-neutral-500 mt-0.5">Only empty categories can be deleted.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteBookCategory(category.slug).unwrap();
                  if (categorySlug === category.slug) setCategorySlug("");
                  toast.success("Category deleted");
                } catch (err) {
                  toast.error(getApiErrorMessage(err, "Could not delete the category."), { duration: 7000 });
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000, position: "top-center", style: toastStyle },
    );
  };

  const handleRemoveBook = (book) => {
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800">Delete “{book.title}”?</p>
            <p className="text-xs text-neutral-500 mt-0.5">This cannot be undone. Books that customers have bought can only be hidden.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteBook(book.slug).unwrap();
                  toast.success("Book deleted");
                } catch (err) {
                  if (err?.status === 409) {
                    // Bought by customers: explain, and offer the safe alternative.
                    toast(
                      (t2) => (
                        <div className="space-y-2 max-w-sm">
                          <p className="text-sm text-neutral-800">{getApiErrorMessage(err)}</p>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => toast.dismiss(t2.id)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">
                              Close
                            </button>
                            {book.is_visible && (
                              <button onClick={() => hideBook(book, t2.id)} className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white hover:bg-teal-700 rounded-lg">
                                Hide book
                              </button>
                            )}
                          </div>
                        </div>
                      ),
                      { duration: 15000, position: "top-center", style: toastStyle, icon: "⚠️" },
                    );
                  } else {
                    toast.error(getApiErrorMessage(err, "Could not delete the book."));
                  }
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 8000, position: "top-center", style: toastStyle },
    );
  };

  return (
    <div className="pt-2 flex flex-col gap-6 animate-in fade-in duration-500 pb-10 arimo-font">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Book library</h1>
          <p className="text-sm text-gray-500">
            {apiData ? `${apiData.count} book${apiData.count === 1 ? "" : "s"}` : "Loading…"}
            {search || categorySlug ? " match your filters" : ""}
          </p>
        </div>
        <Link
          to="/admin/book-library/new"
          className="bg-[#7AA4A5] hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2 inter-font"
        >
          <Plus className="w-4 h-4" />
          Add a new book
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/10 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, author, ISBN or description…"
            className="w-full h-11 pl-11 pr-4 bg-zinc-100 border-none rounded-lg focus:ring-2 focus:ring-[#7AA4A5]/20 text-sm text-neutral-900 placeholder:text-gray-500"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {isFetching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <div className="relative min-w-[220px] w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowCategoryMenu((v) => !v)}
            className="w-full h-11 pl-4 pr-3 bg-zinc-100 rounded-lg flex items-center justify-between text-sm text-neutral-950"
          >
            <span className="truncate">{selectedCategory?.name || "All categories"}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryMenu ? "rotate-180" : ""}`} />
          </button>
          {showCategoryMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/10 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="max-h-60 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCategorySlug("");
                      setPage(1);
                      setShowCategoryMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-lg ${!categorySlug ? "text-teal-600 bg-teal-50/50 font-medium" : "text-neutral-700"}`}
                  >
                    All categories
                  </button>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        setCategorySlug(cat.slug);
                        setPage(1);
                        setShowCategoryMenu(false);
                      }}
                    >
                      <span className={`text-sm truncate ${categorySlug === cat.slug ? "text-teal-600 font-medium" : "text-neutral-700"}`}>
                        {cat.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCategory(cat, e)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-md shrink-0"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {(search || categorySlug) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setCategorySlug("");
              setPage(1);
            }}
            className="h-11 px-3 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading the library…</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-800 font-bold">Could not load the library</p>
          <p className="text-gray-500 text-sm mt-1 max-w-md">{getApiErrorMessage(error, "Check your connection and try again.")}</p>
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <BookOpen className="w-10 h-10 text-gray-300" />
          <p className="text-gray-800 font-bold">{search || categorySlug ? "No books match your filters" : "No books yet"}</p>
          {!search && !categorySlug && (
            <Link to="/admin/book-library/new" className="text-teal-700 hover:underline text-sm">
              Add the first book
            </Link>
          )}
        </div>
      ) : (
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const needsPrint = book.has_physical && !book.is_lulu_print_ready;
            return (
              <div key={book.id} className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
                  <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      book.is_visible ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                    }`}
                  >
                    {book.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {book.is_visible ? "Live" : "Draft"}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="space-y-1">
                    <h3 className="text-neutral-950 text-lg font-bold leading-7 line-clamp-1">{book.title}</h3>
                    <p className="text-gray-600 text-sm">{book.author}</p>
                    {book.category_name && <p className="text-gray-500 text-xs">{book.category_name}</p>}
                  </div>

                  <p className="text-gray-500 text-sm leading-5 line-clamp-3">{stripHtml(book.description)}</p>

                  <div className="flex justify-between items-end mt-1 gap-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(book.published_date).toLocaleDateString()}
                    </div>
                    <div className="text-teal-600 text-sm font-bold text-right">
                      {parseFloat(book.digital_price) > 0 && (
                        <div>
                          <span className="text-xs text-gray-500 font-normal">Digital </span>${book.digital_price}
                        </div>
                      )}
                      {parseFloat(book.physical_price) > 0 && (
                        <div>
                          <span className="text-xs text-gray-500 font-normal">Physical </span>${book.physical_price}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-teal-50 rounded-lg border border-teal-300 text-teal-700 text-xs font-bold">{editionLabel(book)}</span>
                    {needsPrint && (
                      <span className="px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-300 text-amber-700 text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Print setup needed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-black/5">
                    <button
                      onClick={() => navigate(`/admin/book-library/${book.slug}`)}
                      className="flex-1 h-9 bg-[#7AA4A5] hover:bg-[#6b9192] text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <Link
                      to={`/admin/book-library/${book.slug}/edit`}
                      title="Edit"
                      className="h-9 px-3 border border-black/10 rounded-lg flex items-center justify-center gap-1.5 text-sm text-neutral-950 hover:bg-gray-50"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </Link>
                    <button
                      onClick={() => handleRemoveBook(book)}
                      title="Delete"
                      className="w-9 h-9 border border-black/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default BookLibrary;
