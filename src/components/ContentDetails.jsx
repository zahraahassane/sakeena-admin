import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetBlogDetailsQuery } from '../Api/adminApi';

export default function ContentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: content, isLoading, isError } = useGetBlogDetailsQuery(id);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError || !content) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Content not found</h2>
                <button
                    onClick={() => navigate('/teacher/content-upload')}
                    className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Content Upload
                </button>
            </div>
        );
    }

    const dateRaw = content.published_at || content.created_at;
    const formattedDate = dateRaw 
        ? new Date(dateRaw).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "Unpublished";

    return (
        <div className="min-h-screen bg-white">
            {/* Back to Blog Link */}
            <div className="max-w-4xl mx-auto px-6 py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blog
                </button>
            </div>

            {/* Hero Section with Cover Image */}
            <div className="relative h-96 overflow-hidden bg-gray-200">
                <img
                    src={content.cover_image || '/placeholder.svg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                {/* Title Overlay */}
                <div className="absolute inset-0 flex items-end p-8">
                    <div className="max-w-4xl w-full">
                        <h1 className="text-4xl font-bold text-white mb-2">{content.title}</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Author Info */}
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
                    <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                        {content.author_detail?.profile_picture ? (
                             <img src={content.author_detail.profile_picture} alt={content.author_detail.full_name} className="w-full h-full object-cover" />
                        ) : (
                             (content.author_detail?.full_name || 'Admin')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">About {content.author_detail?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">
                            {content.author_detail?.professional_title || 'Content Author'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {formattedDate} • {content.reading_time || 0} min read
                        </p>
                    </div>
                </div>

                {/* Blog Content */}
                <div className="prose prose-lg max-w-none mb-12">
                    {content.excerpt && (
                        <p className="text-gray-700 leading-relaxed mb-6 font-medium text-xl border-l-4 border-teal-600 pl-4">{content.excerpt}</p>
                    )}
                    
                    <div className="text-gray-800 ckeditor-content" dangerouslySetInnerHTML={{ __html: content.content }}></div>
                </div>

                {/* Video Section */}
                {/* Video Section - Removed, video belongs to video specific views */}

                {/* Related Content */}
                <div className="mt-12 pt-12 border-t border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Content</h3>
                    {content.related_blogs?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {content.related_blogs.map(related => (
                                <div 
                                    key={related.id} 
                                    className="cursor-pointer group flex flex-col gap-3"
                                    onClick={() => navigate(`/teacher/content-details/${related.slug || related.id}`)}
                                >
                                    <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100">
                                        <img src={related.cover_image || "/placeholder.svg"} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">{related.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(related.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {related.reading_time || 0} min read</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No related content available right now.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
