import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useGetBlogDetailsQuery,
  useGetVideoDetailsQuery,
} from "../../Api/adminApi";
import UploadContent from "./UploadContent";
import UploadVideo from "./UploadVideo";

const getYoutubeId = (url) => {
  if (!url) return null;
  const match = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
  );
  return match && match[2].length === 11 ? match[2] : null;
};

/**
 * Routed page for creating and editing blogs and videos:
 *   /admin/contents/:kind/new            (kind = article | video)
 *   /admin/contents/:kind/:slug/edit
 * The forms themselves (UploadContent / UploadVideo) are unchanged. This only
 * gives them a URL and loads the item being edited.
 */
const ContentForm = () => {
  const { kind, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isVideo = kind === "video";
  const isValidKind = kind === "article" || isVideo;
  const isEdit = Boolean(slug);
  const listPath = `/admin/contents${isVideo ? "?tab=videos" : ""}`;

  const blogQuery = useGetBlogDetailsQuery(slug, {
    skip: !isValidKind || !isEdit || isVideo,
  });
  const videoQuery = useGetVideoDetailsQuery(slug, {
    skip: !isValidKind || !isEdit || !isVideo,
  });

  if (!isValidKind) return <Navigate to="/admin/contents" replace />;

  // Back and "saved" both return to wherever the admin came from (same tab,
  // same page). A page opened directly has nothing to go back to.
  const leave = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(listPath, { replace: true });
  };

  let editItem = null;
  if (isEdit) {
    const { data, isLoading, isError } = isVideo ? videoQuery : blogQuery;

    if (isLoading) {
      return (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-4 border-[#7AA4A5] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (isError || !data) {
      return (
        <div className="py-24 flex flex-col items-center gap-4">
          <p className="text-stone-600 text-lg">
            Could not load this {isVideo ? "video" : "blog"}.
          </p>
          <button
            onClick={() => navigate(listPath, { replace: true })}
            className="text-[#7AA4A5] hover:underline"
          >
            Back to content
          </button>
        </div>
      );
    }

    // Same shape the Contents list hands to the forms.
    const youtubeId = isVideo ? getYoutubeId(data.video_url) : null;
    editItem = {
      ...data,
      thumbnail:
        data.cover_image ||
        (youtubeId
          ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
          : null),
      description: data.excerpt,
      categoryId: data.category?.id || data.category,
    };
  }

  const Form = isVideo ? UploadVideo : UploadContent;
  return (
    <Form
      key={slug || "new"}
      editItem={editItem}
      onSave={leave}
      onBack={leave}
    />
  );
};

export default ContentForm;
