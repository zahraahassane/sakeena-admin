import { useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Image as ImageIcon, Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeleteBookGalleryImageMutation,
  useUpdateBookGalleryImageMutation,
} from "../../../Api/adminApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import { uploadWithProgress } from "../../../utils/uploadFile";
import { checkFile } from "./bookFormModel";

/**
 * Extra photos shown on the book page.
 * Before the book exists, pictures are queued and sent with the first save.
 * After that they upload straight away and can be removed or moved.
 */
const GalleryManager = ({ slug, images = [], queued = [], onQueue, onUnqueue, onChanged, error }) => {
  const [deleteImage] = useDeleteBookGalleryImageMutation();
  const [updateImage] = useUpdateBookGalleryImageMutation();
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [upload, setUpload] = useState({ state: "idle", progress: 0, error: "" });
  const [problems, setProblems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const addFiles = async (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;

    const found = [];
    const valid = [];
    picked.forEach((file) => {
      const problem = checkFile(file, "image");
      if (problem) found.push(`${file.name}: ${problem}`);
      else valid.push(file);
    });
    setProblems(found);
    if (!valid.length) return;

    if (!slug) {
      onQueue(valid);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setUpload({ state: "uploading", progress: 0, error: "" });
    try {
      const body = new FormData();
      valid.forEach((file) => body.append("images", file));
      await uploadWithProgress(`books/${slug}/gallery/`, body, {
        signal: controller.signal,
        onProgress: (progress) => setUpload({ state: "uploading", progress, error: "" }),
      });
      setUpload({ state: "idle", progress: 0, error: "" });
      await onChanged();
      toast.success(valid.length === 1 ? "Image added" : `${valid.length} images added`);
    } catch (err) {
      setUpload({ state: "error", progress: 0, error: getApiErrorMessage(err, "Could not upload the images.") });
    }
  };

  const remove = async (image) => {
    setBusyId(image.id);
    try {
      await deleteImage({ slug, id: image.id }).unwrap();
      toast.success("Image removed");
      await onChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the image."));
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setBusyId("order");
    try {
      // Number every image 0..n-1 so ties left by older uploads are resolved too.
      for (let i = 0; i < next.length; i += 1) {
        if (next[i].order !== i) {
          await updateImage({ slug, id: next[i].id, order: i }).unwrap();
        }
      }
      await onChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not change the order."));
    } finally {
      setBusyId(null);
    }
  };

  const uploading = upload.state === "uploading";

  return (
    <div id="field-gallery_images" className="space-y-3 scroll-mt-28">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-semibold text-neutral-900">Extra photos</label>
        <span className="text-xs text-gray-500">Optional. Shown on the book page after the cover.</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div key={image.id} className="w-28 space-y-1.5">
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden border border-black/10 bg-gray-50">
              <img src={image.image} alt="" className="w-full h-full object-cover" />
              {busyId === image.id && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                </div>
              )}
            </div>
            {confirmId === image.id ? (
              <div className="flex gap-1">
                <button type="button" onClick={() => remove(image)} className="flex-1 h-7 text-[11px] font-medium bg-rose-600 text-white rounded-md">
                  Remove
                </button>
                <button type="button" onClick={() => setConfirmId(null)} className="flex-1 h-7 text-[11px] font-medium border border-black/10 rounded-md">
                  Keep
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  title="Move earlier"
                  disabled={index === 0 || busyId}
                  onClick={() => move(index, -1)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-30"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Remove"
                  disabled={!!busyId}
                  onClick={() => setConfirmId(image.id)}
                  className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Move later"
                  disabled={index === images.length - 1 || busyId}
                  onClick={() => move(index, 1)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-30"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {queued.map((file, index) => (
          <div key={`${file.name}-${index}`} className="w-28 space-y-1.5">
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden border border-dashed border-teal-300 bg-teal-50">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
              <button
                type="button"
                onClick={() => onUnqueue(index)}
                title="Remove"
                className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-gray-600 hover:text-rose-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 text-center">Saves with the book</p>
          </div>
        ))}

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="w-28 aspect-[3/2] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/60 hover:border-teal-400 flex flex-col items-center justify-center gap-1 text-gray-500 text-xs disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> : <Plus className="w-5 h-5" />}
          {uploading ? `${upload.progress}%` : "Add photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {!images.length && !queued.length && !uploading && (
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> No extra photos yet.
        </p>
      )}

      {[...problems, upload.error, error].filter(Boolean).map((message) => (
        <p key={message} className="text-xs text-rose-600 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{message}</span>
        </p>
      ))}
    </div>
  );
};

export default GalleryManager;
