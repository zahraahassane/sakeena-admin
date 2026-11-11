// Submission types a teacher can allow on an assignment. Teachers pick categories;
// the extension list is what gets stored (allowed_file_types) and enforced.
export const FILE_CATEGORIES = [
  { key: "document", label: "Document", extensions: ["pdf", "docx"], defaultMb: 10 },
  { key: "video", label: "Video", extensions: ["mp4", "mov"], defaultMb: 100 },
  { key: "audio", label: "Audio", extensions: ["mp3", "m4a", "wav"], defaultMb: 50 },
];

// Always accepted, so a student who hits the size limit can compress and send a zip.
export const ALWAYS_ALLOWED = ["zip"];

export const MAX_FILES = 10;
export const DEFAULT_MAX_FILES = 3;

// Backend rejects larger values. Cloudflare drops request bodies over 100 MB on
// Free/Pro plans, so anything higher would fail silently for students.
export const MAX_SUBMISSION_MB = 100;
export const DEFAULT_ALLOWED_TYPES = "pdf, docx, zip";
export const DEFAULT_MAX_MB = 10;

export const parseExtensions = (raw) =>
  (raw || "")
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);

export const categoriesFromExtensions = (raw) => {
  const exts = parseExtensions(raw);
  return FILE_CATEGORIES.filter((c) => c.extensions.some((e) => exts.includes(e))).map(
    (c) => c.key,
  );
};

export const extensionsFromCategories = (keys) =>
  [
    ...FILE_CATEGORIES.filter((c) => keys.includes(c.key)).flatMap((c) => c.extensions),
    ...ALWAYS_ALLOWED,
  ].join(", ");

export const defaultMbFor = (keys) =>
  keys.length
    ? Math.max(...FILE_CATEGORIES.filter((c) => keys.includes(c.key)).map((c) => c.defaultMb))
    : DEFAULT_MAX_MB;
