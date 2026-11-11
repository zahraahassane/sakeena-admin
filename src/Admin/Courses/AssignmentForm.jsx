import { Calendar, ExternalLink, FileText, Plus, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import TextEditor from "../../components/Editor";
import {
  FILE_CATEGORIES,
  MAX_FILES,
  MAX_SUBMISSION_MB,
  categoriesFromExtensions,
  defaultMbFor,
  extensionsFromCategories,
} from "./assignmentFileTypes";

const AssignmentForm = ({ data, onChange, onRemoveFile }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const selectedCategories = categoriesFromExtensions(data.allowedFileTypes);

  const toggleCategory = (key) => {
    const next = selectedCategories.includes(key)
      ? selectedCategories.filter((k) => k !== key)
      : [...selectedCategories, key];
    // Follow the suggested size for the new selection, unless the teacher already
    // set a custom size.
    const followsDefault =
      !data.maxFileSize || Number(data.maxFileSize) === defaultMbFor(selectedCategories);
    onChange({
      ...data,
      allowedFileTypes: extensionsFromCategories(next),
      maxFileSize: followsDefault ? defaultMbFor(next) : data.maxFileSize,
    });
  };

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const referenceFiles = data.referenceFiles || [];

  const addReferenceFiles = (fileList) => {
    const newRows = Array.from(fileList || []).map((file) => ({
      id: Date.now() + Math.random(),
      file,
      url: null,
      name: file.name,
    }));
    if (newRows.length) {
      handleChange("referenceFiles", [...referenceFiles, ...newRows]);
    }
  };

  const handleFileInputChange = (e) => addReferenceFiles(e.target.files);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addReferenceFiles(e.dataTransfer?.files);
  };

  const handleRemove = (row) => {
    if (onRemoveFile) {
      onRemoveFile(row);
    } else {
      handleChange("referenceFiles", referenceFiles.filter((f) => f.id !== row.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Description
        </label>
        <TextEditor
          htmlElement={data.description || ""}
          onChange={(html) => handleChange("description", html)}
          isEditable={true}
        />
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Instructions
        </label>
        <TextEditor
          htmlElement={data.instructions || ""}
          onChange={(html) => handleChange("instructions", html)}
          isEditable={true}
        />
      </div>

      {/* Reference Files */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Reference Files (optional)
        </label>
        <p className="text-xs text-stone-400 ml-1 -mt-1 inter-font">
          Worksheets or instructions files for students to download. PDF, DOCX, PPTX supported.
        </p>

        {referenceFiles.length > 0 && (
          <div className="space-y-2">
            {referenceFiles.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between p-4 bg-teal-50/30 border border-teal-100 rounded-2xl animate-in fade-in zoom-in-95 duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-900 line-clamp-1 max-w-[250px]">
                      {row.name}
                    </h4>
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-teal-600 font-bold uppercase tracking-wider hover:underline flex items-center gap-1 mt-1"
                      >
                        View File <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(row)}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-teal-200 text-teal-600 rounded-xl text-xs font-bold hover:bg-teal-50 transition-all shadow-sm active:scale-95 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-[2rem] transition-all group cursor-pointer relative ${
            isDragging
              ? "border-teal-500 bg-teal-50/20 scale-[1.02]"
              : "border-stone-200 hover:border-teal-400 hover:bg-teal-50/10"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.odp,.key"
            multiple
            className="hidden"
          />
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform shadow-sm border ${
              isDragging
                ? "bg-white border-teal-200 scale-110"
                : "bg-stone-50 border-stone-100 group-hover:scale-110"
            }`}
          >
            {referenceFiles.length > 0 ? (
              <Plus
                className={`w-6 h-6 transition-colors ${
                  isDragging ? "text-teal-500" : "text-stone-400 group-hover:text-teal-500"
                }`}
              />
            ) : (
              <UploadCloud
                className={`w-6 h-6 transition-colors ${
                  isDragging ? "text-teal-500" : "text-stone-400 group-hover:text-teal-500"
                }`}
              />
            )}
          </div>
          <div className="text-center">
            <h4 className="text-stone-900 font-bold arimo-font text-sm">
              {referenceFiles.length > 0 ? "Add another file" : "Click to upload or drag and drop"}
            </h4>
            <p className="text-stone-400 text-sm font-medium inter-font">PDF, DOCX, PPTX</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Due Date */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
            Due Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={data.dueDate || ""}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font appearance-none"
            />
            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Maximum Points */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
            Maximum Points
          </label>
          <input
            type="number"
            value={data.maxPoints || 100}
            onChange={(e) => handleChange("maxPoints", e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
          />
        </div>
      </div>

      {/* Allowed submission types */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          What can students submit?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FILE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleCategory(cat.key)}
                className={`rounded-2xl border px-5 py-4 text-left transition-all ${
                  isSelected
                    ? "border-orange-500 bg-orange-50 shadow-sm"
                    : "border-stone-200 bg-stone-50 hover:border-stone-400"
                }`}
              >
                <span
                  className={`block text-sm font-bold inter-font ${
                    isSelected ? "text-orange-600" : "text-stone-700"
                  }`}
                >
                  {cat.label}
                </span>
                <span className="block text-xs text-stone-500 inter-font mt-1">
                  {cat.extensions.join(", ")}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-stone-500 ml-1 inter-font">
          {selectedCategories.length === 0
            ? "Select at least one type. "
            : ""}
          Students can attach several files per submission. Zip files are always accepted, so
          students can compress their work if it is too large.
        </p>
      </div>

      {/* Max number of files */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Maximum number of files
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            min={1}
            max={MAX_FILES}
            value={data.maxFiles ?? ""}
            onChange={(e) =>
              handleChange(
                "maxFiles",
                e.target.value === ""
                  ? ""
                  : Math.min(MAX_FILES, Math.max(1, parseInt(e.target.value) || 1)),
              )
            }
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
          />
        </div>
        <p className="text-xs text-stone-500 ml-1 inter-font">
          For example, 2 for a document plus a video or audio recording.
        </p>
      </div>

      {/* Max submission size */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Maximum total size (MB)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            min={1}
            max={MAX_SUBMISSION_MB}
            value={data.maxFileSize || ""}
            onChange={(e) =>
              handleChange(
                "maxFileSize",
                e.target.value === ""
                  ? ""
                  : Math.min(MAX_SUBMISSION_MB, Math.max(1, parseInt(e.target.value) || 1)),
              )
            }
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
          />
        </div>
        <p className="text-xs text-stone-500 ml-1 inter-font">
          Applies to all of a student's files together. Maximum {MAX_SUBMISSION_MB} MB.
        </p>
      </div>
    </div>
  );
};

export default AssignmentForm;
