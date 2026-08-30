import { Calendar, ExternalLink, FileText, Plus, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import TextEditor from "../../components/Editor";

const AssignmentForm = ({ data, onChange, onRemoveFile }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
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

      {/* Allowed File Types */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Allowed File Types
        </label>
        <div className="flex flex-wrap gap-2">
          {["pdf", "docx", "mp4"].map((type) => {
            const currentTypes = data.allowedFileTypes 
              ? data.allowedFileTypes.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) 
              : [];
            const isSelected = currentTypes.includes(type.toLowerCase());
            
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  let newTypes;
                  if (isSelected) {
                    newTypes = currentTypes.filter(t => t !== type.toLowerCase());
                  } else {
                    newTypes = [...currentTypes, type.toLowerCase()];
                  }
                  // Sort and format for display
                  handleChange("allowedFileTypes", newTypes.join(', '));
                }}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  isSelected
                    ? "bg-orange-500 text-white shadow-md scale-105"
                    : "bg-stone-50 border border-stone-200 text-stone-500 hover:border-stone-400"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        
        <div className="mt-2">
          <input
            type="text"
            placeholder="Other types (comma separated), e.g., txt, mp3"
            value={data.allowedFileTypes || ""}
            onChange={(e) => handleChange("allowedFileTypes", e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-3 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium text-stone-800 inter-font text-sm"
          />
        </div>
      </div>

      {/* Max File Size */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Max File Size (MB)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            value={data.maxFileSize || 10}
            onChange={(e) => handleChange("maxFileSize", e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
          />
        </div>
      </div>
    </div>
  );
};

export default AssignmentForm;
