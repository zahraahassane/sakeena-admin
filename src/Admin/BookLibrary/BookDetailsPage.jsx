import { X, Download, Eye, User, Calendar, Tag, Image as ImageIcon, ArrowLeft, Edit3 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetBookDetailsQuery } from "../../Api/adminApi";

const BookDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: currentBook, isLoading, isError } = useGetBookDetailsQuery(slug, {
    skip: !slug,
  });

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Failed to load book details.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-teal-600 flex items-center gap-2 mx-auto hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </button>
      </div>
    );
  }

  // Helper to format book type
  const getBookType = (b) => {
    if (b.has_physical && b.has_digital) return "Both";
    if (b.has_physical) return "Physical";
    if (b.has_digital) return "Digital";
    return "N/A";
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10 arimo-font">
      {/* Header / Back Link */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors group"
        >
          <div className="p-2 bg-white border border-black/10 rounded-xl group-hover:border-teal-200 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Book Library</span>
        </button>
        {currentBook && (
          <Link
            to={`/admin/book-library/${currentBook.slug}/edit`}
            className="h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit book
          </Link>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-black/10 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading details...</p>
            </div>
          ) : (
            currentBook && (
            <>
              <div className="flex flex-col lg:flex-row gap-12">
                {/* Left Side: Image & Primary Actions */}
                <div className="w-full lg:w-64 flex flex-col gap-6">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-black/5 bg-gray-50">
                    <img
                      src={currentBook.cover_image}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      alt={currentBook.title}
                    />
                  </div>
                  <div className="space-y-3">
                    <button className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95">
                      <Download className="w-5 h-5" />
                      Download Book
                    </button>
                    <button className="w-full h-12 bg-white border-2 border-black/5 hover:bg-gray-50 text-neutral-950 rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all active:scale-95">
                      <Eye className="w-5 h-5" />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Right Side: Information */}
                <div className="flex-1 space-y-8">
                  {/* Title & Author */}
                  <div className="space-y-4">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 uppercase tracking-wider">
                      {currentBook.category_name || "N/A"}
                    </span>
                    <h1 className="text-neutral-950 text-4xl font-bold leading-tight tracking-tight">
                      {currentBook.title}
                    </h1>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="p-2 bg-gray-50 rounded-full">
                          <User className="w-5 h-5 text-teal-600" />
                        </div>
                        <span className="text-xl font-medium">
                          {currentBook.author}
                        </span>
                      </div>
                      {currentBook.author_designation && (
                        <p className="text-sm text-gray-400 pl-12 italic">
                          {currentBook.author_designation}
                        </p>
                      )}
                    </div>
                    <div
                      className="text-gray-600 text-lg leading-relaxed whitespace-normal max-w-3xl border-l-4 border-teal-100 pl-6 my-6"
                      dangerouslySetInnerHTML={{
                        __html: currentBook.description,
                      }}
                    />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-black/5 pt-8">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-black/5">
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                        Physical Price
                      </p>
                      <p className="text-teal-600 text-2xl font-black">
                        ${currentBook.physical_price || "0"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-black/5">
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                        Digital Price
                      </p>
                      <p className="text-teal-600 text-2xl font-black">
                        ${currentBook.digital_price || "0"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-black/5">
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                        Book Type
                      </p>
                      <span className="inline-block px-3 py-1 bg-white text-teal-700 text-xs font-black rounded-lg border border-teal-300 shadow-sm">
                        {getBookType(currentBook)}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                        Inventory Status
                      </p>
                      <p className="text-neutral-950 text-base font-bold">
                        {currentBook.stock_count} units available
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                        ISBN
                      </p>
                      <p className="text-neutral-950 text-base font-bold">
                        {currentBook.isbn || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                        Publisher
                      </p>
                      <p className="text-neutral-950 text-base font-bold">
                        {currentBook.publisher || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                        Publication Date
                      </p>
                      <div className="flex items-center gap-2 text-neutral-950 text-base font-bold">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        {currentBook.published_date}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                        Page Count
                      </p>
                      <p className="text-neutral-950 text-base font-bold">
                        {currentBook.number_of_pages} Pages
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                        Language
                      </p>
                      <p className="text-neutral-950 text-base font-bold">
                        {currentBook.language}
                      </p>
                    </div>
                    {currentBook.video_url && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-between">
                        <div>
                          <p className="text-teal-900 text-xs font-bold uppercase tracking-wider mb-1">
                            Book Trailer
                          </p>
                          <p className="text-teal-800 text-sm">Experience the book preview visually</p>
                        </div>
                        <a
                          href={currentBook.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-lg active:scale-95"
                        >
                          Watch Now
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Gallery Area */}
                  {currentBook.gallery_images?.length > 0 && (
                    <div className="border-t border-black/5 pt-8">
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-teal-600" />
                        Media Gallery
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                        {currentBook.gallery_images.map((img) => (
                          <div
                            key={img.id}
                            className="aspect-square rounded-2xl overflow-hidden border-2 border-black/5 hover:border-teal-400 transition-all cursor-pointer group shadow-sm bg-gray-50"
                          >
                            <img
                              src={img.image}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              alt="Gallery"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags Area */}
                  {currentBook.tags && (
                    <div className="border-t border-black/5 pt-8">
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">
                        Keywords & Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(currentBook.tags)
                          ? currentBook.tags
                          : typeof currentBook.tags === "string"
                          ? currentBook.tags.split(",")
                          : []
                        ).map((tag, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2 bg-zinc-50 border border-black/5 rounded-2xl text-neutral-700 text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 transition-colors shadow-sm"
                          >
                            <Tag className="w-3.5 h-3.5 text-teal-600" />
                            {typeof tag === "string" ? tag.trim() : JSON.stringify(tag)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Stats Grid */}
                  <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-black/5">
                    <div className="flex-1 bg-gradient-to-br from-teal-50 to-teal-100/30 rounded-3xl p-6 flex items-center gap-6 border border-teal-100/50 shadow-sm">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Download className="w-7 h-7 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-teal-900 text-3xl font-black leading-none">
                          0
                        </p>
                        <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mt-1">
                          Total Downloads
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100/30 rounded-3xl p-6 flex items-center gap-6 border border-green-100/50 shadow-sm">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-7 h-7 text-green-600" />
                      </div>
                      <div>
                        <p className="text-green-900 text-lg font-black leading-none">
                          {new Date(
                            currentBook.created_at,
                          ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-green-700 text-xs font-bold uppercase tracking-wider mt-1">
                          Library Entry Date
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailsPage;
