import { FileText, Paperclip, Trash2 } from "lucide-react";
import { useRef } from "react";
import toast from "react-hot-toast";

const MAX_MB = 10;

export const emptyResource = {
  file: null, // a newly chosen File
  hasExisting: false, // the blog already has a PDF on the server
  existingName: "",
  title: "",
  description: "",
  pages: "",
  removed: false, // the admin removed the existing PDF
};

/** Initial value for the edit form, from a blog returned by the API. */
export const resourceFromBlog = (blog) => {
  if (!blog?.resource) return { ...emptyResource };
  return {
    ...emptyResource,
    hasExisting: true,
    existingName: blog.resource.title || "Attached PDF",
    title: blog.resource_title || "",
    description: blog.resource_description || "",
    pages: blog.resource_pages ?? "",
  };
};

/** Adds the resource fields to the FormData sent to POST/PATCH /blogs/. */
export const appendResource = (formData, value) => {
  if (value.file) {
    formData.append("resource_file", value.file);
  } else if (value.removed) {
    formData.append("resource_file", "");
  }
  formData.append("resource_title", value.title.trim());
  formData.append("resource_description", value.description.trim());
  formData.append("resource_pages", value.pages === "" ? "" : String(value.pages));
};

const formatSize = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const inputClass =
  "w-full px-3 py-2.5 bg-zinc-100 rounded-lg text-sm text-neutral-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AA4A5]/20";

/**
 * Optional free PDF for a blog. Anyone can download it from the public post.
 * Controlled: `value` is the shape of `emptyResource`, `onChange` gets the next value.
 */
const ResourcePdfField = ({ value, onChange }) => {
  const inputRef = useRef(null);
  const attached = value.file || (value.hasExisting && !value.removed);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`This PDF is ${formatSize(file.size)}. The maximum is ${MAX_MB} MB.`);
      return;
    }
    onChange({ ...value, file, removed: false });
  };

  const remove = () => {
    onChange({
      ...value,
      file: null,
      removed: value.hasExisting,
      ...(value.hasExisting ? {} : { title: "", description: "", pages: "" }),
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm space-y-4">
      <div>
        <h3 className="text-neutral-950 text-lg font-medium">Free resource PDF</h3>
        <p className="text-gray-500 text-xs font-normal mt-1">
          Optional. Anyone can download it from this blog, without signing in. PDF only, up to {MAX_MB} MB.
        </p>
      </div>

      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={pick} />

      {!attached ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-[10px] border-2 border-dashed border-gray-300 py-8 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <Paperclip className="w-6 h-6 text-gray-400" />
          <span className="text-gray-600 text-sm font-semibold">Click to attach a PDF</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg bg-zinc-100 px-4 py-3">
          <FileText className="w-5 h-5 text-[#7AA4A5] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900">
              {value.file ? value.file.name : value.existingName}
            </p>
            <p className="text-xs text-gray-500">
              {value.file ? formatSize(value.file.size) : "Currently attached"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-[#4c7e7e] hover:underline"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove PDF"
            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {value.removed && !value.file && (
        <p className="text-xs text-amber-700">The current PDF will be removed when you save.</p>
      )}

      {attached && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              maxLength={120}
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="Leave empty to use the blog title"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Short description</label>
            <input
              type="text"
              maxLength={200}
              value={value.description}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
              placeholder="One line about what is inside"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Number of pages (optional)</label>
            <input
              type="number"
              min={1}
              max={999}
              value={value.pages}
              onChange={(e) => onChange({ ...value, pages: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcePdfField;
