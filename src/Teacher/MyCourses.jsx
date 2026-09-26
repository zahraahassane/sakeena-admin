import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Clock, Eye, Lock, Search, User, X } from "lucide-react";
import { useGetCategoriesQuery, useGetCoursesQuery } from "../Api/api";

export default function MyCourses() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearchText(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const {
    data: categoriesData = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();
  const categories = [{ id: "All", name: "All" }, ...categoriesData];

  const statuses = ["All", "upcoming", "recorded", "running"];

  const {
    data: coursesData = [],
    isLoading: coursesLoading,
    error: coursesError,
  } = useGetCoursesQuery({
    category: selectedCategory === "All" ? undefined : selectedCategory,
    status: selectedStatus === "All" ? undefined : selectedStatus,
    search: searchText || undefined,
  });

  const courses = coursesData?.length ? coursesData : [];

  const handleCardClick = (course) => {
    navigate(`/teacher/course/${course.id}`, { state: { course } });
  };

  const normalisedCourses = courses.map((course) => {
    const categoryName =
      course.category?.name ||
      (typeof course.category === "string" ? course.category : "Uncategorized");

    const status = course.status?.toLowerCase() || "upcoming";
    const statusColor =
      course.statusColor ||
      (status === "upcoming"
        ? "bg-[#5BB814] text-white"
        : status === "running"
          ? "bg-[#D3130C] text-white"
          : status === "recorded"
            ? "bg-[#2E9BDF] text-white"
            : "bg-gray-400 text-white");

    const instructorName =
      course.teacher?.user?.first_name && course.teacher?.user?.last_name
        ? `${course.teacher.user.first_name} ${course.teacher.user.last_name}`
        : course.instructor || "Instructor";

    return {
      ...course,
      category: categoryName,
      status,
      statusColor,
      instructor: instructorName,
      lessons: course.num_lessons || 0,
      weeks: course.duration || 0,
      totalHours: course.hours_per_session || 0,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* View-Only Access Alert */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Lock className="text-sm text-[#155DFC]" />
          <div>
            <p className="font-bold text-[#1C398E]">View-Only Access</p>
            <p className="text-sm text-[#155DFC]">
              You can view course content and student progress, but cannot edit
              materials or upload content. Contact the admin for any course
              updates needed.
            </p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          My Assigned Courses
        </h1>

        {/* Filters */}
        {categoriesLoading && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            Loading categories...
          </div>
        )}
        {categoriesError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Failed to load categories
          </div>
        )}
        {coursesLoading && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            Loading courses...
          </div>
        )}
        {coursesError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Failed to load courses
          </div>
        )}

        <div className="space-y-5 mb-8">
          {/* Search */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Search</p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search course title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-10">
            {/* Category Filter */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-teal-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                      selectedStatus === status
                        ? "bg-stone-800 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {normalisedCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleCardClick(course)}
              className={
                "bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
              }
            >
              {/* Course Image */}
              <div className="relative aspect-[16/10] bg-gray-200 overflow-hidden">
                <img
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                {/* Status Badge */}
                <div
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/70 border border-[#D6D3D1]`}
                >
                  {course.category}
                </div>
              </div>

              {/* Course Info */}
              <div className="p-4">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize mb-2 ${course.statusColor}`}
                >
                  {course.status}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                {/* Instructor */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <User className="w-[18px] h-[18px]" />
                  {course.instructor}
                </div>

                {/* Course Details */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen size={18} />
                    {course.total_lessons} Lessons
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays size={18} />
                    {course.duration_in_weeks} weeks
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={18} />
                    {course.total_hours} hr
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={18} />
                    {course.hours_per_session} hr per session
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-2xl font-semibold text-[#7AA4A5]">
                    ${course.price}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourse(course);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#7AA4A5]"
                    title="View Quick Details"
                  >
                    <Eye className="w-5 h-5 text-[#7AA4A5]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {coursesData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No courses found matching your filters.
            </p>
          </div>
        )}
      </div>

      {/* Course Details Modal - Eye Button */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full overflow-y-auto">
            <div className="p-6 border-b border-stone-100 sticky top-0 bg-white z-10 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-stone-900 font-['Arimo']">
                  Course Details
                </h2>
                <p className="text-sm text-stone-500 font-['Arimo']">
                  Complete information about the course
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div>
                  <p className="font-semibold text-gray-500 mb-1">
                    Course Title
                  </p>
                  <p className="bg-[#F9FAFB] p-4 rounded-lg font-semibold text-gray-900">
                    {selectedCourse.title}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Instructor</p>
                  <p className="bg-[#F9FAFB] p-4 rounded-lg font-semibold text-gray-900">
                    {selectedCourse.instructor}
                  </p>
                </div>{" "}
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Category</p>
                  <p className="bg-[#F9FAFB] p-4 rounded-lg font-semibold text-gray-900">
                    {selectedCourse.category}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Status</p>
                  <p className="bg-[#F9FAFB] p-4 rounded-lg text-sm font-medium">
                    <span
                      className={`w-2 h-2 px-2 py-1 rounded-full ${selectedCourse.statusColor}`}
                    >
                      {" "}
                      {selectedCourse.status}
                    </span>
                  </p>
                </div>{" "}
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Price</p>
                  <p className="bg-[#F9FAFB] p-4 rounded-lg font-semibold text-teal-600">
                    ${selectedCourse.price}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Duration</p>
                  <p className="bg-[#F9FAFB] p-4 rounded-lg font-semibold text-gray-900">
                    {selectedCourse.duration_in_weeks || "N/A"}{" "}
                    weeks
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-1">
                    Total Lessons
                  </p>
                  <p className="bg-[#F9FAFB] p-4 rounded-lg font-semibold text-gray-900">
                    {selectedCourse.total_lessons ||
                      "N/A"}{" "}
                    lessons
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  navigate(`/teacher/course/${selectedCourse.id}`, {
                    state: { course: selectedCourse },
                  });
                }}
                className="flex-1 px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-medium transition-colors"
              >
                View Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
