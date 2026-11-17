import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import useUrlTab from "../../hooks/useUrlTab";
import CommunityChat from "../../components/CommunityChat";
import CourseReviews from "./CourseReviews";
import CourseDetailsContent from "./CourseDetailsContent";
import CourseCurriculum from "./CourseCurriculum";
import CourseEnrollments from "./CourseEnrollments";
import { useGetCourseDetailsQuery } from "../../Api/adminApi";
import { Loader2 } from "lucide-react";

// Tab keys are what appears in the URL (?tab=curriculum).
const TABS = [
  { key: "details", label: "Course Details" },
  { key: "curriculum", label: "Curriculum" },
  { key: "enrollments", label: "Enrollments" },
  { key: "reviews", label: "Reviews" },
  { key: "chat", label: "Community Chat" },
];

// Routed page: /admin/courses-management/:id
const CourseBuilder = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useUrlTab(TABS.map((t) => t.key));
  const { data: fullCourse, isLoading, isError } = useGetCourseDetailsQuery(courseId);

  // Back to the list the admin came from (keeps its search and page); a page
  // opened directly has no history, so go to the list.
  const onBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/admin/courses-management");
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 pb-20">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 font-medium hover:text-teal-700 transition-colors w-fit group"
      >
        <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:bg-teal-50 group-hover:border-teal-200 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </div>
        <span>Back to Courses</span>
      </button>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-greenTeal tracking-tight">
            Course Management
          </h1>
          <p className="text-stone-500 font-medium tracking-wide">
            View and manage course performance and curriculum
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === key
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
          <p className="text-stone-500 font-medium animate-pulse">Fetching full course details...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <p className="text-red-500 font-bold text-lg">Failed to load course details</p>
          <p className="text-stone-500 mt-2">Please try refreshing the page or check your connection.</p>
        </div>
      ) : (
        <>
          {activeTab === "details" && (
            <CourseDetailsContent course={fullCourse} />
          )}
          {activeTab === "curriculum" && (
            <CourseCurriculum courseId={courseId} />
          )}
          {activeTab === "enrollments" && (
            <CourseEnrollments courseId={courseId} />
          )}
          {activeTab === "reviews" && <CourseReviews courseId={courseId} />}
          {activeTab === "chat" && (
            <CommunityChat courseTitle={fullCourse?.title} courseId={courseId} />
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
  const fileInputRef = React.useRef(null);

  return (
    <div
      onClick={() => fileInputRef.current.click()}
      className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-stone-200 rounded-3xl hover:border-teal-400 hover:bg-teal-50/10 transition-all group cursor-pointer relative overflow-hidden"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onChange}
        accept={accept}
        className="hidden"
      />

      {preview &&
        typeof preview === "string" &&
        preview.startsWith("data:image") ? (
        <div className="absolute inset-0 z-0">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-center">
          <h4 className="text-greenTeal font-bold inter-font">{title}</h4>
          <p className="text-stone-400 text-xs mt-1 inter-font">
            {preview && !preview.startsWith("data:image")
              ? `Selected: ${preview}`
              : subtitle}
          </p>
        </div>
        <button className="bg-white border border-stone-200 px-6 py-2 rounded-xl text-stone-600 font-bold text-sm shadow-sm hover:border-stone-400 transition-all">
          {btnText}
        </button>
      </div>
    </div>
  );
};

export default CourseBuilder;
