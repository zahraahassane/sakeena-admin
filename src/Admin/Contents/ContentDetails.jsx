import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Play,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useGetBlogDetailsQuery, useGetBlogCategoriesQuery, useGetVideoDetailsQuery } from "../../Api/adminApi";

const ContentDetails = () => {
  const navigate = useNavigate();
  const { id: slug } = useParams();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const isTeacher = pathname.startsWith("/teacher");
  const basePath = isTeacher ? "/teacher/content-upload" : "/admin/contents";
  const detailPath = isTeacher ? "/teacher/content-details" : "/admin/contents";
  
  const type = searchParams.get("type") || "Article";
  // Back goes to the list tab this item lives in (videos have their own tab).
  const listPath =
    !isTeacher && type === "Video" ? `${basePath}?tab=videos` : basePath;
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: blog, isLoading: isBlogLoading, isError: isBlogError } = useGetBlogDetailsQuery(slug, {
    skip: type !== "Article"
  });
  const { data: video, isLoading: isVideoLoading, isError: isVideoError } = useGetVideoDetailsQuery(slug, {
    skip: type !== "Video"
  });
  const { data: categories } = useGetBlogCategoriesQuery();

  const isLoading = type === "Article" ? isBlogLoading : isVideoLoading;
  const isError = type === "Article" ? isBlogError : isVideoError;
  const data = type === "Article" ? blog : video;

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYoutubeEmbedUrl = (url) => {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#7AA4A5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4">
        <p className="text-stone-600 text-lg">Error loading {type.toLowerCase()} details.</p>
        <button
          onClick={() => navigate(listPath)}
          className="text-[#7AA4A5] hover:underline"
        >
          Go back to contents
        </button>
      </div>
    );
  }

  const content = {
    title: data.title,
    subtitle: data.author_detail?.professional_title || "Islamic Psychology Expert",
    author: data.author_detail?.full_name || "Admin",
    authorInitial: data.author_detail?.full_name?.[0] || "A",
    authorImage: data.author_detail?.profile_picture,
    date: new Date(data.published_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    readTime: type === "Article" ? `${data.reading_time || "5"} min read` : "Video Content",
    category:
      data.category?.name ||
      categories?.find((c) => c.id === (data.category?.id || data.category))
        ?.name ||
      "Uncategorized",
    heroImage: data.cover_image || (type === "Video" && getYoutubeId(data.video_url) ? `https://img.youtube.com/vi/${getYoutubeId(data.video_url)}/maxresdefault.jpg` : null),
    body: data.content,
    videoTitle: data.title,
    videoDuration: type === "Video" ? "Video" : "0:00",
    videoThumbnail: data.cover_image || (type === "Video" && getYoutubeId(data.video_url) ? `https://img.youtube.com/vi/${getYoutubeId(data.video_url)}/mqdefault.jpg` : null),
    videoUrl: type === "Video" ? getYoutubeEmbedUrl(data.video_url) : "",
  };

  return (
    <div className="min-h-screen bg-white pb-20 arimo-font animate-in fade-in duration-500">
      {/* Back Button */}
      <button
        onClick={() => navigate(listPath)}
        className="flex items-center gap-2 px-4 py-2 text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-normal">Back to {isTeacher ? "Uploads" : "Content"}</span>
      </button>

      {/* Hero Section */}
      <div className="relative w-full h-[476px] overflow-hidden rounded-t-2xl">
        <img
          src={content.heroImage}
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Floating Header Card */}
      <div className="max-w-[968px] mx-auto -mt-48 relative z-10 px-4 md:px-0">
        <div className="bg-gradient-to-r from-teal-50 via-white to-slate-50 rounded-2xl shadow-[4px_4px_15px_rgba(0,0,0,0.1)] border border-stone-200 p-8 flex flex-col gap-6">
          <h1 className="text-stone-900 text-4xl font-normal leading-tight">
            {content.title}
          </h1>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-white text-2xl font-normal shadow-inner overflow-hidden border border-stone-200">
              {content.authorImage ? (
                <img src={content.authorImage} alt={content.author} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                  {content.authorInitial}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-stone-900 text-xl font-normal leading-7">
                  About {content.author}
                </h3>
                <p className="text-stone-700 text-base font-normal leading-6">
                  {content.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-stone-600">
                  <User className="w-5 h-5" />
                  <span className="text-base">{content.author}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <Calendar className="w-5 h-5" />
                  <span className="text-base">{content.date}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <Clock className="w-5 h-5" />
                  <span className="text-base">{content.readTime}</span>
                </div>
              </div>

              <div className="inline-flex px-4 py-1.5 bg-teal-50 rounded-2xl border border-slate-300 text-slate-600 text-xs font-normal">
                {content.category}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-[932px] mx-auto mt-14 px-4 md:px-0 mb-10">
        <div
          className="prose prose-stone max-w-none text-stone-700 text-base leading-relaxed quill-content"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      </div>

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="max-w-[932px] mx-auto px-4 md:px-0 mb-20">
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-stone-100 text-stone-600 text-sm rounded-full border border-stone-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Video Section Card (Conditional - only if video data exists) */}
      {content.videoUrl && (
        <div className="max-w-[932px] mx-auto space-y-8 px-4 md:px-0">
          <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="bg-white border-b border-stone-200 p-6 flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#7AA4A5] text-xs font-bold uppercase tracking-tight">
                  <Play className="w-4 h-4 fill-current" />
                  Watch Video
                </div>
                <h2 className="text-stone-900 text-lg font-bold leading-7">
                  {content.videoTitle}
                </h2>
              </div>
              {isPlaying && (
                <button
                  onClick={() => navigate(`${detailPath}/${slug}?type=${type}`)}
                  className="p-2 border border-slate-400 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <Eye className="w-5 h-4" />
                </button>
              )}
            </div>

            <div className="relative aspect-video group overflow-hidden bg-black">
              {!isPlaying ? (
                <div
                  className="w-full h-full cursor-pointer relative"
                  onClick={() => setIsPlaying(true)}
                >
                  <img
                    src={content.videoThumbnail}
                    alt="Video Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/95 rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                      <Play className="w-10 h-10 text-[#7AA4A5] fill-current ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-6 bg-black/80 px-3 py-1.5 rounded text-white text-sm font-bold">
                    {content.videoDuration}
                  </div>
                </div>
              ) : (
                <iframe
                  className="w-full h-full"
                  src={content.videoUrl}
                  title={content.videoTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              )}
            </div>

            <div className="bg-white p-4 px-6 border-t border-stone-200 flex justify-between items-center">
              <p className="text-stone-600 text-sm font-normal">
                {isPlaying
                  ? "Currently playing video"
                  : "Click to play embedded video"}
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-lg text-stone-700 text-sm font-normal hover:bg-stone-50 transition-colors">
                Watch Full Page
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related Blogs */}
      {type === "Article" && data.related_blogs && data.related_blogs.length > 0 && (
        <div className="max-w-[932px] mx-auto mt-20 px-4 md:px-0">
          <h2 className="text-stone-900 text-2xl font-bold mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.related_blogs.map((related) => (
              <div
                key={related.id}
                onClick={() => {
                  navigate(`${detailPath}/${related.slug}?type=Article`);
                  window.scrollTo(0, 0);
                }}
                className="group cursor-pointer bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[16/9] overflow-hidden bg-stone-200">
                  <img
                    src={related.cover_image || "/placeholder.svg"}
                    alt={related.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <span className="text-teal-600 text-xs font-bold uppercase tracking-tight">
                    {related.category?.name || "Uncategorized"}
                  </span>
                  <h3 className="text-stone-900 text-lg font-bold line-clamp-2">
                    {related.title}
                  </h3>
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{related.reading_time || 5} min read</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetails;
