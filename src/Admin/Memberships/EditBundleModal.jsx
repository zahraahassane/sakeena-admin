import React, { useState, useEffect } from "react";
import { X, Package, Check, Save } from "lucide-react";
import { useGetAllCoursesUnpaginatedQuery, useUpdateBundleMutation } from "../../Api/adminApi";
import toast from "react-hot-toast";

const EditBundleModal = ({ isOpen, onClose, bundle }) => {
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const { data: coursesData } = useGetAllCoursesUnpaginatedQuery(
    { search: courseSearchQuery },
    { skip: !isOpen }
  );
  // const availableCourses = coursesData?.results || [];
  const availableCourses = coursesData || [];
  const [updateBundle, { isLoading }] = useUpdateBundleMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    selectedCourses: [],
  });

  // Initialize form with bundle data when modal opens
  useEffect(() => {
    if (isOpen && bundle) {
      setFormData({
        title: bundle.name || "",
        description: bundle.description || "",
        price: bundle.price || "",
        selectedCourses: bundle.courses_detail
          ? bundle.courses_detail.map((c) => c.id).filter((id) => id !== null)
          : [],
      });
    } else if (!isOpen) {
      setCourseSearchQuery("");
    }
  }, [isOpen, bundle]);

  if (!isOpen) return null;

  const handleToggleCourse = (courseId) => {
    setFormData((prev) => {
      const isSelected = prev.selectedCourses.includes(courseId);
      if (isSelected) {
        return {
          ...prev,
          selectedCourses: prev.selectedCourses.filter((id) => id !== courseId),
        };
      } else {
        return {
          ...prev,
          selectedCourses: [...prev.selectedCourses, courseId],
        };
      }
    });
  };

  const calculateOriginalValue = () => {
    return formData.selectedCourses.reduce((total, id) => {
      const course = availableCourses.find((c) => c.id === id);
      return total + (course ? parseFloat(course.price || 0) : 0);
    }, 0);
  };

  const filteredCourses = availableCourses.filter((course) =>
    course.title.toLowerCase().includes(courseSearchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.price ||
      formData.selectedCourses.length === 0
    ) {
      return;
    }

    try {
      const payload = {
        name: formData.title,
        description: formData.description,
        price: formData.price.toString(),
        course_ids: formData.selectedCourses,
        is_active: bundle.is_active || false
      };
      
      await updateBundle({ id: bundle.id, body: payload }).unwrap();
      toast.success("Bundle updated successfully!");
      onClose();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to update bundle");
    }
  };

  const isFormValid =
    formData.title && formData.price && formData.selectedCourses.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[881px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-b from-[#7AA4A5] to-[#6A9495] border-b border-neutral-200 flex justify-between items-start shrink-0">
          <div className="flex flex-col gap-1 text-white">
            <h2 className="text-2xl font-bold arimo-font leading-8">
              Edit Bundle
            </h2>
            <p className="text-white/90 text-base font-normal arimo-font">
              Update courses and pricing for this bundle
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[10px] hover:bg-white/20 transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Bundle Name */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Bundle Name
            </label>
            <input
              type="text"
              placeholder="e.g., Web Development Mastery Bundle"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal placeholder:text-neutral-950/50"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Description
            </label>
            <textarea
              placeholder="Brief description of the bundle"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal resize-none placeholder:text-neutral-950/50"
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Bundle Price ($)
            </label>
            <input
              type="number"
              placeholder="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal placeholder:text-neutral-950/50"
            />
          </div>

          {/* Select Courses */}
          <div className="flex flex-col gap-3">
            <label className="text-neutral-700 text-sm font-normal arimo-font">
              Select Courses ({formData.selectedCourses.length} selected)
            </label>
            <input
              type="text"
              placeholder="Search courses by title..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-[10px] border border-neutral-300 text-neutral-950 text-base font-normal arimo-font focus:outline-none focus:border-greenTeal placeholder:text-neutral-950/50"
            />
            <div className="w-full h-80 px-4 py-4 rounded-[10px] border border-neutral-300 bg-white overflow-y-auto space-y-2">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => {
                  const isSelected = formData.selectedCourses.includes(course.id);
                  return (
                    <div
                      key={course.id}
                      onClick={() => handleToggleCourse(course.id)}
                      className={`flex items-center p-3 rounded-[10px] border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-neutral-50 border-neutral-300"
                          : "bg-white border-transparent hover:bg-neutral-50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border mr-4 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-greenTeal border-greenTeal"
                            : "border-neutral-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-neutral-800 text-base font-normal arimo-font">
                            {course.title}
                          </span>
                          <span className="text-neutral-500 text-sm font-normal arimo-font">
                            {course.category?.name || "Uncategorized"}
                          </span>
                        </div>
                        <span className="text-slate-400 text-sm font-bold arimo-font">
                          ${course.price}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-neutral-500 text-sm arimo-font">
                    No courses found matching "{courseSearchQuery}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bundle Preview */}
          <div className="p-4 bg-stone-300/20 rounded-[10px] border border-stone-300 flex flex-col gap-3">
            <h3 className="text-neutral-800 text-sm font-bold arimo-font">
              Bundle Preview
            </h3>
            <div className="flex flex-col gap-2 text-sm text-neutral-700 arimo-font">
              <div className="flex justify-between items-center">
                <span>Name:</span>
                <span>{formData.title || "Not set"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Courses:</span>
                <span>{formData.selectedCourses.length} courses</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Bundle Price:</span>
                <span>${formData.price || "0"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Original Value:</span>
                <span>${calculateOriginalValue()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-24 h-10 rounded-[10px] border border-neutral-300 text-neutral-700 text-base font-normal arimo-font hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!isFormValid || isLoading}
            onClick={handleSubmit}
            className={`w-44 h-10 rounded-[10px] text-white text-base font-normal arimo-font flex items-center justify-center gap-2 transition-colors ${
              isFormValid && !isLoading
                ? "bg-greenTeal hover:bg-opacity-80 shadow-md"
                : "bg-greenTeal opacity-50 cursor-not-allowed"
            }`}
          >
            <Save size={18} />
            {isLoading ? "Updating..." : "Update Bundle"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBundleModal;
