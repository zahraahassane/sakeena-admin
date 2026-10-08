// Turns API failures into messages the team can act on.
//
// The backend (DRF) answers validation failures with {field: ["message"]}, not
// {message: "..."}, and the proxy answers timeouts/size limits with HTML. Reading
// only `error.data.message` hides all of that behind a generic toast.

export const FIELD_LABELS = {
  title: "Title",
  author: "Author",
  author_designation: "Author designation",
  description: "Description",
  category: "Category",
  language: "Language",
  publisher: "Publisher",
  published_date: "Publication date",
  page_count: "Page count",
  video_url: "Video link",
  tags: "Tags",
  slug: "Web address",
  physical_isbn: "Physical ISBN",
  digital_isbn: "Digital ISBN",
  physical_price: "Physical price",
  digital_price: "Digital price",
  stock_count: "Stock",
  lulu_pod_package_id: "Print format",
  cover_image: "Cover image",
  gallery_images: "Gallery images",
  images: "Gallery images",
  sample_file: "Sample PDF",
  digital_file: "Digital PDF",
  physical_file: "Interior PDF",
  lulu_cover_pdf: "Print cover PDF",
  file: "File",
  name: "Name",
};

const humanize = (field) =>
  FIELD_LABELS[field] ||
  field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const asText = (value) => {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return Object.values(value).map(asText).filter(Boolean).join(" ");
  }
  return String(value);
};

// RTK Query reports non-JSON bodies (nginx/Cloudflare HTML pages) as PARSING_ERROR
// and keeps the real HTTP status in originalStatus.
const httpStatus = (err) =>
  typeof err?.status === "number" ? err.status : err?.originalStatus;

const statusMessage = (err) => {
  const status = httpStatus(err);
  if (err?.status === "FETCH_ERROR" || err?.status === "TIMEOUT_ERROR") {
    return "Could not reach the server. Check your internet connection and try again.";
  }
  if (status === 413) {
    return "That upload is larger than the server allows. Use a smaller file (compress the PDF or image) and try again.";
  }
  if (status === 408 || status === 502 || status === 503 || status === 504) {
    return "The server took too long to answer or is briefly unavailable. Wait a minute and try again. For large files, try a smaller one.";
  }
  if (status === 401) return "Your session has ended. Sign in again and retry.";
  if (status === 403) return "Your account is not allowed to do this.";
  if (status === 404) return "That item no longer exists. Refresh the page.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  if (status && status >= 500) {
    return "The server hit an unexpected problem. Please try again. If it keeps happening, tell your developer.";
  }
  return null;
};

/**
 * Field-level errors as {field: "message"}. Empty object when the error
 * isn't a validation error.
 */
export const getFieldErrors = (err) => {
  const data = err?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out = {};
  Object.entries(data).forEach(([field, value]) => {
    if (["detail", "error", "message", "non_field_errors"].includes(field)) return;
    const text = asText(value);
    if (text) out[field] = text;
  });
  return out;
};

/**
 * One readable sentence (or a few) describing what went wrong.
 * `fallback` is only used when nothing more specific is known.
 */
export const getApiErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err) return fallback;
  if (err.aborted) return "Upload cancelled.";

  const data = err.data;
  if (typeof data === "string" && data.trim() && !data.trim().startsWith("<")) {
    return data.trim().slice(0, 300);
  }
  if (data && typeof data === "object") {
    const direct = asText(data.detail) || asText(data.error) || asText(data.message);
    if (direct) return direct;

    const nonField = asText(data.non_field_errors);
    const fields = Object.entries(getFieldErrors(err)).map(
      ([field, text]) => `${humanize(field)}: ${text}`,
    );
    const combined = [nonField, ...fields].filter(Boolean).join(" ");
    if (combined) return combined;
  }

  return statusMessage(err) || fallback;
};

export const hasFieldErrors = (err) => Object.keys(getFieldErrors(err)).length > 0;
