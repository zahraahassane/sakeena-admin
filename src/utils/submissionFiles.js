const AUDIO = /\.(mp3|m4a|wav|ogg|aac|webm)$/i;
const VIDEO = /\.(mp4|mov|m4v)$/i;

export const formatBytes = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// "audio" | "video" | null, judged from the file name or URL.
export const mediaKind = (nameOrUrl) => {
  const clean = (nameOrUrl || "").split("?")[0];
  if (AUDIO.test(clean)) return "audio";
  if (VIDEO.test(clean)) return "video";
  return null;
};

// Files of a submission row from the API. Falls back to the single legacy
// `submission_file` so rows from before multi-file uploads still show.
export const getSubmissionFiles = (sub) => {
  if (!sub) return [];
  if (sub.files && sub.files.length > 0) {
    return sub.files.map((f) => ({
      id: f.id,
      name: f.name || (f.file || "").split("?")[0].split("/").pop(),
      url: f.file,
      embedUrl: f.embed_url || null,
      submissionId: sub.id,
      size: f.size != null ? formatBytes(f.size) : "",
    }));
  }
  if (sub.submission_file) {
    return [
      {
        id: "legacy",
        name: sub.submission_file.split("?")[0].split("/").pop(),
        url: sub.submission_file,
        size: "",
      },
    ];
  }
  return [];
};
