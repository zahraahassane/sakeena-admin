import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileNameFromUrl = (url) => {
  try {
    return decodeURIComponent(new URL(url, window.location.origin).pathname.split("/").pop() || "");
  } catch {
    return "";
  }
};

/**
 * One upload slot: pick or drop a file, see what is attached, replace it, and watch progress.
 * The parent owns the upload itself (so it can queue or send immediately) and passes the state in.
 *
 * Props
 *  - kind: "pdf" | "image"
 *  - currentUrl: URL of the file already saved on the server (if any)
 *  - file: a File chosen but not yet saved (queued or uploading)
 *  - status: { state: "idle" | "uploading" | "error" | "done", progress?: number, error?: string }
 *  - error: validation message from the form (shown when nothing is uploading)
 *  - onSelect(file), onClear() (remove a queued file), onCancel() (stop an upload), onRetry()
 */
const FileDropzone = ({
  id,
  label,
  required = false,
  hint,
  kind = "pdf",
  currentUrl,
  file,
  status,
  error,
  disabled = false,
  onSelect,
  onClear,
  onCancel,
  onRetry,
  compact = false,
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const state = status?.state || "idle";
  const isUploading = state === "uploading";
  const accept = kind === "pdf" ? "application/pdf,.pdf" : "image/*";

  const previewUrl = useMemo(
    () => (kind === "image" && file ? URL.createObjectURL(file) : null),
    [kind, file],
  );
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const choose = (picked) => {
    if (disabled || isUploading || !picked) return;
    onSelect?.(picked);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    choose(e.dataTransfer.files?.[0]);
  };

  const shownImage = previewUrl || (kind === "image" ? currentUrl : null);
  const Icon = kind === "pdf" ? FileText : ImageIcon;
  const message = status?.error || error;

  return (
    <div id={id} className="space-y-2 scroll-mt-28">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-semibold text-neutral-900">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed transition-colors ${
          dragging ? "border-teal-500 bg-teal-50" : message ? "border-rose-300 bg-rose-50/40" : "border-gray-200 bg-gray-50/60"
        } ${compact ? "p-3" : "p-4"}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          disabled={disabled || isUploading}
          onChange={(e) => {
            choose(e.target.files?.[0]);
            // Allow picking the same file again after removing it.
            e.target.value = "";
          }}
        />

        <div className="flex items-center gap-4">
          {kind === "image" && (
            <div className="w-20 shrink-0 aspect-[4/5] rounded-lg overflow-hidden bg-white border border-black/5 flex items-center justify-center">
              {shownImage ? (
                <img src={shownImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1.5">
            {file ? (
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-5 h-5 text-teal-600 shrink-0" />
                <span className="text-sm font-medium text-neutral-900 truncate">{file.name}</span>
                <span className="text-xs text-gray-500 shrink-0">{formatBytes(file.size)}</span>
              </div>
            ) : currentUrl ? (
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm text-neutral-800 truncate">
                  Uploaded{fileNameFromUrl(currentUrl) ? `: ${fileNameFromUrl(currentUrl)}` : ""}
                </span>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal-700 hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {kind === "pdf" ? "No PDF yet." : "No image yet."} Drag a file here or choose one.
              </p>
            )}

            {isUploading && (
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all"
                    style={{ width: `${status?.progress ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {(status?.progress ?? 0) >= 100
                    ? "Processing on the server. Large files can take a minute."
                    : `Uploading ${status?.progress ?? 0}%. Keep this page open.`}
                </p>
              </div>
            )}

            {!isUploading && state === "idle" && file && (
              <p className="text-xs text-gray-500">Will upload when you save.</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUploading ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 h-9 text-xs font-medium border border-black/10 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            ) : (
              <>
                {state === "error" && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-3 h-9 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Try again
                  </button>
                )}
                {file && onClear && state !== "error" && (
                  <button
                    type="button"
                    onClick={onClear}
                    title="Remove this file"
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                  className="px-3 h-9 text-xs font-medium bg-white border border-black/10 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  {file || currentUrl ? "Replace" : "Choose file"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {message && (
        <p className="text-xs text-rose-600 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
};

export default FileDropzone;
