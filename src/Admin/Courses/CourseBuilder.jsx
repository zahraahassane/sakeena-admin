import React, { useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import CommunityChat from "./CommunityChat";
import CourseReviews from "./CourseReviews";
import CourseDetailsContent from "./CourseDetailsContent";
import CourseCurriculum from "./CourseCurriculum";
import CourseEnrollments from "./CourseEnrollments";
import { useGetCourseDetailsQuery } from "../../Api/adminApi";
import { Loader2 } from "lucide-react";

const CourseBuilder = ({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState("Course Details");
  const { data: fullCourse, isLoading, isError } = useGetCourseDetailsQuery(course.id);

  const tabs = [
    "Course Details",
    "Curriculum",
    "Enrollments",
    // "Review",
    "Community Chat",
  ];

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
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {tab}
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
          {activeTab === "Course Details" && (
            <CourseDetailsContent course={fullCourse || course} />
          )}
          {activeTab === "Curriculum" && (
            <CourseCurriculum courseId={course.id} />
          )}
          {activeTab === "Enrollments" && (
            <CourseEnrollments courseId={course.id} />
          )}
          {activeTab === "Review" && <CourseReviews />}
          {activeTab === "Community Chat" && (
            <CommunityChat 
              courseTitle={fullCourse?.title || course.title} 
              courseId={course.id}
            />
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
