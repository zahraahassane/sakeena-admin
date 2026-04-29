import {
  ChevronLeft,
  Image as ImageIcon,
  Play,
  Save,
  Loader2,
  Trash2,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import TextEditor from "../../components/Editor";
import CourseCurriculum from "./CourseCurriculum";
import {
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useGetCourseDetailsQuery,
  useGetCourseCategoriesQuery,
  useAddCourseCategoryMutation,
  useDeleteCourseCategoryMutation,
  useGetTeacherProfilesQuery,
} from "../../Api/adminApi";

const AddEditCourse = ({ course, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState("Course Overview");
  const [courseId, setCourseId] = useState(course?.id || null);
  const tabs = ["Course Overview", "Course Curriculum"];

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    teacher: "",
    category: "",
    status: "upcoming",
    price: "",
    duration_in_weeks: "",
    level: "beginner",
    total_hours: "",
    hours_per_session: "",
    thumbnail: null,
    thumbnailPreview: null,
    preview_video: null,
    videoName: "",
    learningObjectives: [],
    requirements: [],
    curriculum: [
      {
        id: 1,
        title: "Getting Started",
        lessons: [
          {
            id: 101,
            title: "Course Overview & Welcome",
            type: "video",
            duration: "05:45",
          },
        ],
      },
    ],
    start_date: "",
    is_active: true,
  });

  const [newObjective, setNewObjective] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // API hooks
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const { data: categoriesResponse } = useGetCourseCategoriesQuery();
  const [addCourseCategory] = useAddCourseCategoryMutation();
  const [deleteCourseCategory] = useDeleteCourseCategoryMutation();
  const { data: teachersResponse } = useGetTeacherProfilesQuery();
  const { data: courseDetails, isLoading: isLoadingDetails } = useGetCourseDetailsQuery(course?.id, {
    skip: !course?.id
  });

  const categories = categoriesResponse || [];
  const teachers = teachersResponse?.results || [];

  useEffect(() => {
    const dataToUse = courseDetails || course;
    if (dataToUse) {
      setCourseId(dataToUse.id);
      setFormData((prev) => ({
        ...prev,
        title: dataToUse.title || "",
        subtitle: dataToUse.subtitle || "",
        description: dataToUse.description || "",
        teacher: dataToUse.teacher?.id || "",
        category: dataToUse.category?.id || "",
        status: dataToUse.status || "upcoming",
        price: dataToUse.price || "",
        duration_in_weeks: dataToUse.duration_in_weeks || "",
        level: dataToUse.level || "beginner",
        total_hours: dataToUse.total_hours || "",
        hours_per_session: dataToUse.hours_per_session || "",
        thumbnailPreview: dataToUse.thumbnail || null,
        videoName: dataToUse.videoName || (dataToUse.preview_video ? "Preview Video Exists" : ""),
        learningObjectives: dataToUse.learningObjectives || [],
        requirements: dataToUse.requirements || [],
        curriculum: dataToUse.curriculum || [],
        start_date: dataToUse.start_date || "",
        is_active: dataToUse.is_active !== undefined ? dataToUse.is_active : true,
      }));
    }
  }, [courseDetails, course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCurriculumChange = (newCurriculum) => {
    setFormData((prev) => ({ ...prev, curriculum: newCurriculum }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          thumbnail: file,
          thumbnailPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        preview_video: file,
        videoName: file.name,
      }));
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData((prev) => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newObjective.trim()],
      }));
      setNewObjective("");
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement("");
    }
  };

  const removeObjective = (index) => {
    setFormData((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  const removeRequirement = (index) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCourseCategory(newCategoryName.trim()).unwrap();
      setNewCategoryName("");
      toast.success("Category added successfully");
    } catch (err) {
      console.error("Failed to add category:", err);
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id, e) => {
    e.stopPropagation();
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800 inter-font">
              Confirm Delete
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Are you sure you want to remove this category?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteCourseCategory(id).unwrap();
                  toast.success("Category deleted");
                  if (formData.category === id.toString()) {
                    setFormData((prev) => ({ ...prev, category: "" }));
                  }
                } catch (err) {
                  console.error("Failed to delete category:", err);
                  toast.error("Failed to delete category");
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
        style: {
          minWidth: "350px",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Course title is required.");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category.");
      return;
    }
    if (!formData.teacher) {
      toast.error("Please assign a teacher.");
      return;
    }
    if (!formData.price) {
      toast.error("Please set a price.");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      if (formData.subtitle) payload.append("subtitle", formData.subtitle);
      if (formData.description) payload.append("description", formData.description);
      payload.append("category", formData.category);
      payload.append("teacher_id", formData.teacher);
      payload.append("price", formData.price);
      payload.append("level", formData.level);
      payload.append("status", formData.status);
      payload.append("is_active", formData.is_active);
      if (formData.duration_in_weeks) payload.append("duration_in_weeks", formData.duration_in_weeks);
      if (formData.total_hours) payload.append("total_hours", formData.total_hours);
      if (formData.hours_per_session) payload.append("hours_per_session", formData.hours_per_session);
      if (formData.status === "upcoming" && formData.start_date) {
        payload.append("start_date", formData.start_date);
      }
      if (formData.thumbnail instanceof File) {
        payload.append("thumbnail", formData.thumbnail);
      }

      if (formData.preview_video instanceof File) {
        payload.append("preview_video", formData.preview_video);
      }

      if (courseId) {
        await updateCourse({ id: courseId, data: payload }).unwrap();
        toast.success("Course updated successfully!");
      } else {
        const response = await createCourse(payload).unwrap();
        setCourseId(response.id);
        toast.success("Course created! Now add your curriculum.");
        setActiveTab("Course Curriculum");
      }

      // Clear the form on success
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        teacher: "",
        category: "",
        status: "upcoming",
        price: "",
        duration_in_weeks: "",
        level: "beginner",
        total_hours: "",
        hours_per_session: "",
        thumbnail: null,
        thumbnailPreview: null,
        preview_video: null,
        videoName: "",
        learningObjectives: [],
        requirements: [],
        curriculum: [
          {
            id: 1,
            title: "Getting Started",
            lessons: [
              {
                id: 101,
                title: "Course Overview & Welcome",
                type: "video",
                duration: "05:45",
              },
            ],
          },
        ],
        start_date: "",
        is_active: true,
      });
      setCourseId(null);
      if (onSave) onSave(); // Notify parent to refresh list if needed
    } catch (err) {
      console.error("Failed to save course:", err);
      const errorMsg = err?.data
        ? Object.entries(err.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n")
        : "Failed to save course.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-stone-50 rounded-xl text-stone-500 transition-all border border-transparent hover:border-stone-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-greenTeal tracking-tight font-['Arimo']">
              {course ? "Edit Course" : "Course Builder"}
            </h1>
            <p className="text-stone-500 font-medium tracking-wide text-sm font-['Arimo']">
              {course
                ? "Update existing course content"
                : "Create comprehensive course content"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isLocked = tab === "Course Curriculum" && !courseId;
          return (
            <button
              key={tab}
              onClick={() => {
                if (isLocked) {
                  toast.error("Save the course overview first.");
                  return;
                }
                setActiveTab(tab);
              }}
              className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab
                ? "border-teal-600 text-teal-700"
                : isLocked
                  ? "border-transparent text-stone-300 cursor-not-allowed"
                  : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {isLoadingDetails ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
          <p className="text-stone-500 font-medium animate-pulse">Loading detailed course information...</p>
        </div>
      ) : (
        <>
          {activeTab === "Course Overview" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <section className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
                <div className="flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-xs">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Basic Information
                </div>

                <div className="space-y-6">
                  <FormGroup label="Course Title">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Mindfulness in Islam"
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-300 transition-all font-medium text-stone-800"
                    />
                  </FormGroup>

                  <FormGroup label="Course Subtitle">
                    <input
                      type="text"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleChange}
                      placeholder="e.g. Faith-centered emotional healing journey"
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-300 transition-all font-medium text-stone-800"
                    />
                  </FormGroup>

                  <FormGroup label="Course Description">
                    <TextEditor
                      htmlElement={formData.description}
                      onChange={(html) =>
                        setFormData((prev) => ({ ...prev, description: html }))
                      }
                      isEditable={true}
                    />
                  </FormGroup>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <FormGroup label="Price ($)">
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="99"
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none"
                      />
                    </FormGroup>
                    <FormGroup label="Duration (weeks)">
                      <input
                        type="text"
                        name="duration_in_weeks"
                        value={formData.duration_in_weeks}
                        onChange={handleChange}
                        placeholder="12"
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none"
                      />
                    </FormGroup>
                    <FormGroup label="Level">
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none appearance-none cursor-pointer"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </FormGroup>
                    <FormGroup label="Category">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                          className="w-full h-10 px-4 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-between text-stone-800 font-medium hover:bg-stone-100 transition-all outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-300"
                        >
                          <span className="truncate">
                            {categories.find((c) => c.id.toString() === formData.category.toString())
                              ?.name || "Select Category"}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isCategoryOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setIsCategoryOpen(false)}
                            />
                            <div className="absolute top-12 left-0 mt-2 p-1 bg-white border border-stone-100 rounded-[1.5rem] shadow-2xl flex flex-col gap-1 min-w-[220px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                              <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                                {categories.length === 0 ? (
                                  <p className="text-xs text-stone-400 p-4 text-center">No categories found</p>
                                ) : (
                                  categories.map((cat) => (
                                    <div
                                      key={cat.id}
                                      className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${formData.category.toString() === cat.id.toString()
                                        ? "bg-teal-50 text-teal-700 font-bold"
                                        : "text-stone-600 hover:bg-stone-50"
                                        }`}
                                      onClick={() => {
                                        setFormData((prev) => ({ ...prev, category: cat.id.toString() }));
                                        setIsCategoryOpen(false);
                                      }}
                                    >
                                      <span className="truncate">{cat.name}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>

                              <div className="p-3 border-t border-stone-50 bg-stone-50/50 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Add category..."
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                                  className="flex-1 h-9 px-3 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all shadow-sm"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCategory}
                                  className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-md active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </FormGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormGroup label="Status">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none appearance-none cursor-pointer font-bold text-stone-800"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="running">Running</option>
                        <option value="recorded">Recorded</option>
                      </select>
                    </FormGroup>
                    {formData.status === "upcoming" && (
                      <FormGroup label="Start Date">
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          placeholder="e.g. 2026-05-10"
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none font-bold text-stone-800"
                        />
                      </FormGroup>
                    )}
                    <FormGroup label="Assign Teacher">
                      <select
                        name="teacher"
                        value={formData.teacher}
                        onChange={handleChange}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.user?.first_name} {t.user?.last_name}
                          </option>
                        ))}
                      </select>
                    </FormGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup label="Total Hours">
                      <input
                        type="text"
                        name="total_hours"
                        value={formData.total_hours}
                        onChange={handleChange}
                        placeholder="20"
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none"
                      />
                    </FormGroup>
                    <FormGroup label="Hours Per Session">
                      <input
                        type="text"
                        name="hours_per_session"
                        value={formData.hours_per_session}
                        onChange={handleChange}
                        placeholder="2"
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 outline-none"
                      />
                    </FormGroup>
                  </div>
                </div>
              </section>

              {/* Course Images & Preview */}
              <section className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
                <div className="flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  Course Images & Preview
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <UploadCard
                    title="Course Thumbnail"
                    subtitle="1200x675px (JPG, PNG)"
                    icon={<ImageIcon className="w-8 h-8 text-stone-400" />}
                    btnText="Upload Image"
                    onChange={handleImageUpload}
                    accept="image/*.jpg,image/*.jpeg,image/*.png"
                    preview={formData.thumbnailPreview}
                  />
                  <UploadCard
                    title="Course Preview Video"
                    subtitle="MP4, MOV (Max 2 min)"
                    icon={<Play className="w-8 h-8 text-stone-400" />}
                    btnText="Upload Video"
                    onChange={handleVideoUpload}
                    accept="video/*"
                    preview={formData.videoName}
                  />
                </div>
              </section>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isCreating || isUpdating}
                  className="flex items-center gap-2 bg-greenTeal text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{courseId ? "Update Course" : "Submit Course"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "Course Curriculum" && (
            <>
              {!courseId && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 text-amber-800 font-medium text-sm">
                  Save the course overview first before adding curriculum.
                </div>
              )}
              <CourseCurriculum
                courseId={courseId}
                onInitialize={handleSubmit}
                modules={formData.curriculum}
                onModulesChange={handleCurriculumChange}
              />
              {courseId && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-greenTeal text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg active:scale-95"
                  >
                    Done — Back to Courses
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

const FormGroup = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-stone-800 ml-1 inter-font">
      {label}
    </label>
    {children}
  </div>
);

const UploadCard = ({
  title,
  subtitle,
  icon,
  btnText,
  onChange,
  accept,
  preview,
}) => {
  const fileInputRef = useRef(null);

  const isDataImage =
    preview && typeof preview === "string" && preview.startsWith("data:image");
  const isUrlImage =
    preview && typeof preview === "string" && preview.includes("://");

  return (
    <div
      onClick={() => fileInputRef.current.click()}
      className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-stone-200 rounded-3xl hover:border-teal-400 hover:bg-teal-50/10 transition-all group cursor-pointer relative overflow-hidden h-64"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onChange}
        accept={accept}
        className="hidden"
      />

      {isDataImage || isUrlImage ? (
        <div className="absolute inset-0 z-0">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
          />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm border border-stone-100 group-hover:bg-white group-hover:border-teal-100">
          {icon}
        </div>
        <div className="text-center">
          <h4 className="text-greenTeal font-bold inter-font">{title}</h4>
          <p className="text-stone-400 text-xs mt-1 inter-font max-w-[240px] line-clamp-1">
            {preview &&
              typeof preview === "string" &&
              !preview.includes("://") &&
              !preview.startsWith("data:")
              ? `Selected: ${preview}`
              : subtitle}
          </p>
        </div>
        <button className="bg-white border border-stone-200 px-6 py-2 rounded-xl text-stone-600 font-bold text-sm shadow-sm hover:border-teal-200 hover:text-teal-600 transition-all active:scale-95">
          {btnText}
        </button>
      </div>
    </div>
  );
};

export default AddEditCourse;
