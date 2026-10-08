// Form state, API mapping, validation and the publish checklist for the book editor.
// The validation rules mirror books/serializers.py so problems are caught before upload.

export const LANGUAGES = [
  "English",
  "Arabic",
  "Bengali",
  "Urdu",
  "French",
  "Spanish",
  "Turkish",
  "Indonesian",
];

export const FILE_LIMITS = {
  pdfMB: 100,
  imageMB: 10,
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const emptyForm = () => ({
  title: "",
  author: "",
  author_designation: "",
  description: "",
  category: "",
  language: "English",
  publisher: "",
  published_date: todayISO(),
  tags: "",
  video_url: "",
  has_digital: true,
  has_physical: false,
  digital_price: "",
  physical_price: "",
  digital_isbn: "",
  physical_isbn: "",
  page_count: "",
  lulu_pod_package_id: "",
  // New books start hidden so they can be finished before customers see them.
  is_visible: false,
});

export const bookToForm = (book) => ({
  title: book.title || "",
  author: book.author || "",
  author_designation: book.author_designation || "",
  description: book.description || "",
  category: book.category ? String(book.category) : "",
  language: book.language || "English",
  publisher: book.publisher || "",
  published_date: book.published_date || todayISO(),
  tags: Array.isArray(book.tags) ? book.tags.join(", ") : "",
  video_url: book.video_url || "",
  has_digital: !!book.has_digital,
  has_physical: !!book.has_physical,
  digital_price: Number(book.digital_price) > 0 ? String(book.digital_price) : "",
  physical_price: Number(book.physical_price) > 0 ? String(book.physical_price) : "",
  digital_isbn: book.digital_isbn || "",
  physical_isbn: book.physical_isbn || "",
  page_count: book.page_count ? String(book.page_count) : "",
  lulu_pod_package_id: book.lulu_pod_package_id || "",
  is_visible: !!book.is_visible,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const stripHtml = (html) =>
  (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeIsbn = (value) => (value || "").replace(/[-\s]/g, "").toUpperCase();

/** Returns a message when the ISBN is malformed, otherwise null. Blank is allowed. */
export const isbnProblem = (value) => {
  const isbn = normalizeIsbn(value);
  if (!isbn) return null;
  if (isbn.length === 10) {
    if (!/^\d{9}[\dX]$/.test(isbn)) return "An ISBN-10 has 9 digits followed by a digit or X.";
    const total = [...isbn].reduce((sum, c, i) => sum + (10 - i) * (c === "X" ? 10 : Number(c)), 0);
    return total % 11 === 0 ? null : "This ISBN-10 has an invalid check digit. Re-check the last digit.";
  }
  if (isbn.length === 13) {
    if (!/^\d{13}$/.test(isbn)) return "An ISBN-13 has 13 digits.";
    const total = [...isbn].reduce((sum, c, i) => sum + Number(c) * (i % 2 === 0 ? 1 : 3), 0);
    return total % 10 === 0 ? null : "This ISBN-13 has an invalid check digit. Re-check the last digit.";
  }
  return "An ISBN must have 10 or 13 digits (hyphens are fine).";
};

const toMoney = (value) => {
  const n = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : "0";
};

const moneyProblem = (value) => {
  if (value === "" || value == null) return null;
  const n = Number(String(value).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n)) return "Enter a number such as 12.50.";
  if (n < 0) return "The price cannot be negative.";
  return null;
};

const isUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const parseTags = (value) =>
  (value || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

/** Plain JSON-able payload sent to the API (PATCH as JSON, or POST converted to FormData). */
export const formToPayload = (form) => ({
  title: form.title.trim(),
  author: form.author.trim(),
  author_designation: form.author_designation.trim(),
  description: form.description,
  category: form.category ? Number(form.category) : null,
  language: form.language,
  publisher: form.publisher.trim(),
  published_date: form.published_date,
  video_url: form.video_url.trim() || null,
  tags: parseTags(form.tags),
  has_digital: form.has_digital,
  has_physical: form.has_physical,
  digital_price: form.has_digital ? toMoney(form.digital_price) : "0",
  physical_price: form.has_physical ? toMoney(form.physical_price) : "0",
  digital_isbn: form.digital_isbn.trim(),
  physical_isbn: form.physical_isbn.trim(),
  page_count: Number(form.page_count) || 0,
  lulu_pod_package_id: form.lulu_pod_package_id || null,
  is_visible: form.is_visible,
});

export const payloadToFormData = (payload, files = {}) => {
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) data.append(key, JSON.stringify(value));
    else data.append(key, String(value));
  });
  Object.entries(files).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((file) => data.append(key, file));
    else if (value) data.append(key, value);
  });
  return data;
};

// ---------------------------------------------------------------------------
// Client-side file checks (the server enforces the same limits)
// ---------------------------------------------------------------------------
export const checkFile = (file, kind) => {
  if (!file) return null;
  const mb = file.size / (1024 * 1024);
  if (kind === "pdf") {
    const looksLikePdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!looksLikePdf) return "This is not a PDF. Choose a .pdf file.";
    if (mb > FILE_LIMITS.pdfMB) {
      return `This PDF is ${mb.toFixed(0)} MB. The limit is ${FILE_LIMITS.pdfMB} MB. Compress it and try again.`;
    }
  } else {
    if (!file.type.startsWith("image/")) return "This is not an image. Choose a JPG, PNG or WebP file.";
    if (mb > FILE_LIMITS.imageMB) {
      return `This image is ${mb.toFixed(1)} MB. The limit is ${FILE_LIMITS.imageMB} MB.`;
    }
  }
  return null;
};

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ---------------------------------------------------------------------------
// Validation and checklist
// ---------------------------------------------------------------------------

/**
 * @param form      current form values
 * @param ctx       { book: server book | null, pending: {field: File}, galleryQueued: number }
 * @param forPublish when true, also enforce what a customer-facing book needs
 * @returns {{errors: Object<string,string>}}
 */
export const validateForm = (form, ctx, forPublish) => {
  const { book, pending = {} } = ctx;
  const has = (field) => !!(pending[field] || book?.[field]);
  const errors = {};

  if (!form.title.trim()) errors.title = "Enter the book title.";
  if (!form.author.trim()) errors.author = "Enter the author's name.";
  if (!form.author_designation.trim()) errors.author_designation = "Enter the author's title or role (for example, Islamic scholar).";
  if (!stripHtml(form.description)) errors.description = "Write a short description of the book.";
  if (!form.publisher.trim()) errors.publisher = "Enter the publisher.";
  if (!form.published_date) errors.published_date = "Choose the publication date.";
  if (!has("cover_image")) errors.cover_image = "Upload a cover image.";

  const digitalPriceProblem = moneyProblem(form.digital_price);
  if (digitalPriceProblem) errors.digital_price = digitalPriceProblem;
  const physicalPriceProblem = moneyProblem(form.physical_price);
  if (physicalPriceProblem) errors.physical_price = physicalPriceProblem;

  const digitalIsbn = isbnProblem(form.digital_isbn);
  if (digitalIsbn) errors.digital_isbn = digitalIsbn;
  const physicalIsbn = isbnProblem(form.physical_isbn);
  if (physicalIsbn) errors.physical_isbn = physicalIsbn;

  if (form.video_url.trim() && !isUrl(form.video_url.trim())) {
    errors.video_url = "Enter a full link starting with https://";
  }

  if (forPublish) {
    if (!form.has_digital && !form.has_physical) {
      errors.editions = "Choose at least one edition (digital or physical) before publishing.";
    }
    if (form.has_digital) {
      if (!(Number(form.digital_price) > 0)) errors.digital_price = errors.digital_price || "Set a digital price above 0.";
      if (!normalizeIsbn(form.digital_isbn)) errors.digital_isbn = errors.digital_isbn || "Enter the digital ISBN.";
      if (!has("digital_file")) errors.digital_file = "Upload the PDF that digital buyers will receive.";
    }
    if (form.has_physical) {
      if (!(Number(form.physical_price) > 0)) errors.physical_price = errors.physical_price || "Set a physical price above 0.";
      if (!normalizeIsbn(form.physical_isbn)) errors.physical_isbn = errors.physical_isbn || "Enter the physical ISBN.";
      if (!(Number(form.page_count) > 0)) errors.page_count = "The page count is filled in when Lulu checks the interior. Open Print setup and run the check.";
      if (!form.lulu_pod_package_id) errors.lulu_pod_package_id = "Choose a print format in Print setup.";
      if (!has("physical_file")) errors.physical_file = "Upload the print-ready interior PDF.";
      if (!has("lulu_cover_pdf")) errors.lulu_cover_pdf = "Upload the print-ready cover PDF.";
    }
  }
  return errors;
};

/** Everything a customer-facing book needs, in the order the team will do it. */
export const buildChecklist = (form, ctx) => {
  const { book, pending = {} } = ctx;
  const has = (field) => !!(pending[field] || book?.[field]);
  const items = [
    {
      key: "basics",
      label: "Title, author, description and publisher",
      done:
        !!form.title.trim() &&
        !!form.author.trim() &&
        !!form.author_designation.trim() &&
        !!stripHtml(form.description) &&
        !!form.publisher.trim(),
      target: "section-basics",
    },
    { key: "cover", label: "Cover image", done: has("cover_image"), target: "section-files" },
    {
      key: "editions",
      label: "At least one edition selected",
      done: form.has_digital || form.has_physical,
      target: "section-editions",
    },
  ];

  if (form.has_digital) {
    items.push(
      { key: "dprice", label: "Digital price above 0", done: Number(form.digital_price) > 0, target: "section-editions" },
      { key: "disbn", label: "Digital ISBN", done: !!normalizeIsbn(form.digital_isbn) && !isbnProblem(form.digital_isbn), target: "section-editions" },
      { key: "dfile", label: "Digital PDF uploaded", done: has("digital_file"), target: "section-editions" },
    );
  }
  if (form.has_physical) {
    items.push(
      { key: "pprice", label: "Physical price above 0", done: Number(form.physical_price) > 0, target: "section-editions" },
      { key: "pisbn", label: "Physical ISBN", done: !!normalizeIsbn(form.physical_isbn) && !isbnProblem(form.physical_isbn), target: "section-editions" },
      { key: "pinterior", label: "Print interior PDF uploaded", done: has("physical_file"), target: "section-print" },
      {
        key: "pcheck",
        label: "Interior checked by Lulu (fills in the page count)",
        done: Number(form.page_count) > 0,
        target: "section-print",
      },
      { key: "ppkg", label: "Print format chosen", done: !!form.lulu_pod_package_id, target: "section-print" },
      { key: "pcover", label: "Print cover PDF uploaded", done: has("lulu_cover_pdf"), target: "section-print" },
      {
        key: "pcovercheck",
        label: "Cover checked by Lulu",
        done: !!book?.is_lulu_print_ready,
        recommended: true,
        target: "section-print",
      },
    );
  }
  return items;
};
