"use client";
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import CourseOverview from "./Overview";
import CourseCurriculum from "./Curriculum";
import CourseReviews from "./Reviews";
import CourseCommunity from "./Community";
import { ChevronLeft, Share2, Twitter, Facebook } from "lucide-react";
import { useGetCourseByIdQuery, useGetCourseEnrollmentsQuery } from "../../Api/adminApi";

function statusBadgeClass(status) {
  const s = status?.toLowerCase() || "upcoming";
  if (s === "upcoming") return "bg-[#5BB814] text-white";
  if (s === "running") return "bg-[#D3130C] text-white";
  if (s === "recorded") return "bg-[#2E9BDF] text-white";
  return "bg-gray-400 text-white";
}

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: courseDetail, isLoading: courseLoading } = useGetCourseByIdQuery(courseId, {
    skip: !courseId,
  });
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useGetCourseEnrollmentsQuery(
    { courseId },
    { skip: !courseId }
  );

  // location.state.course paints instantly on click-through; live data always wins once it arrives,
  // and on refresh/direct visit (no router state) this just starts empty and fills in from the API.
  const course = { ...location.state?.course, ...courseDetail };
  const totalEnrolled = enrollmentsData?.count ?? 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "curriculum", label: "Curriculum" },
    { id: "reviews", label: "Reviews" },
    { id: "community", label: "Community" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <CourseOverview course={course} />;
      case "curriculum":
        return <CourseCurriculum course={course} />;
      case "reviews":
        return <CourseReviews course={course} />;
      case "community":
        return <CourseCommunity course={course} />;
      default:
        return <CourseOverview course={course} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 font-medium"
        >
          <ChevronLeft size={20} />
          Back to Courses
        </button>

        {/* Course Header (large) */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: big media */}
              <div className="flex-1 relative">
                <img
                  src={course.thumbnail || course.image}
                />
                <div className="mt-4">
                  <p className="text-[#7AA4A5] font-semibold">
                    {course.category?.name || course.category || "Uncategorized"}
                    {course.level &&
                      ` • ${course.level.charAt(0).toUpperCase()}${course.level.slice(1)}`}
                  </p>
                </div>
              </div>

              {/* Right: info card */}
              <div className="w-full lg:w-80">
                <div className="bg-white border rounded-lg shadow-sm h-full flex flex-col justify-between">
                  <div>

                    <div className="rounded-t-lg overflow-hidden h-48">
                      <img
                        src={course.thumbnail || course.image}
                        alt="thumb"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 px-4 pt-4">

                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadgeClass(course.status)}`}
                        >
                          {course.status
                            ? `${course.status.charAt(0).toUpperCase()}${course.status.slice(1)}`
                            : "Upcoming"}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold">
                        {course.title || (
                          courseLoading && (
                            <span className="inline-block h-5 w-40 bg-gray-100 animate-pulse rounded align-middle" />
                          )
                        )}
                      </h2>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-semibold text-[#3A6E73]">
                          {course.price}
                        </p>
                      </div>
                      <div className="flex items-center text-gray-500 justify-between mt-3">
                        <p className="text-sm">
                          Total Enrolled
                        </p>
                        <p className="text-sm font-semibold">
                          {enrollmentsLoading ? (
                            <span className="inline-block h-4 w-16 bg-gray-100 animate-pulse rounded align-middle" />
                          ) : (
                            `${totalEnrolled} student${totalEnrolled !== 1 ? "s" : ""}`
                          )}
                        </p>
                      </div>
                      <div className="mt-4 border-t p-3 border rounded-xl items-center justify-between">
                        <p className="mb-2">Share this course</p>
                        <div className="flex items-center gap-3 text-gray-600">
                          <Share2 size={16} />
                          <Twitter size={16} />
                          <Facebook size={16} />
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="rounded-t-lg border-b border-gray-200">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                {tab.id === "community"
                  ? "Community Chat"
                  : `Course ${tab.label}`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-b-lg p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
