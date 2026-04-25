import { useState } from "react";
import {
  Search,
  Plus,
  BookOpen,
  Users,
  Video,
  Eye,
  Pencil,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  ChevronDown,
  Filter,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetCoursesDataQuery,
  useGetCourseCategoriesQuery,
  useAddCourseCategoryMutation,
  useDeleteCourseCategoryMutation,
} from "../../Api/adminApi";
import AddEditCourse from "./AddEditCourse";
import CourseBuilder from "./CourseBuilder";
import LiveSessions from "./LiveSessions";
import Pagination from "../../components/Pagination";

const Courses = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeView, setActiveView] = useState("listing"); // listing, add-edit, builder, live-sessions
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse, isLoading, isError } = useGetCoursesDataQuery(currentPage);
  const { data: categoriesResponse } = useGetCourseCategoriesQuery();
  const [addCategory] = useAddCourseCategoryMutation();
  const [deleteCategory] = useDeleteCourseCategoryMutation();

  const categories = categoriesResponse?.results || [];
  const statuses = ["All", "Running", "Recorded", "Upcoming"];

  const getStatusLabel = (status) => {
    if (status === "upcoming") return "Upcoming";
    if (status === "running") return "Running";
    if (status === "recorded") return "Recorded";
    return status;
  };

  const getInstructorName = (teacher) => {
    if (!teacher?.user) return "N/A";
    return `${teacher.user.first_name} ${teacher.user.last_name}`;
  };

  const filteredCourses = (apiResponse?.results || []).filter((c) => {
    const instructorName = getInstructorName(c.teacher);
    const statusLabel = getStatusLabel(c.status);

    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "" || c.category?.id === parseInt(selectedCategory);
    const matchesStatus =
      selectedStatus === "All" || statusLabel === selectedStatus;

    const matchesDate =
      (!dateFrom || new Date(c.start_date) >= new Date(dateFrom)) &&
      (!dateTo || new Date(c.start_date) <= new Date(dateTo));

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setIsDetailsOpen(true);
  };

  const handleAddCourse = () => {
    setCourseToEdit(null);
    setActiveView("add-edit");
  };

  const handleEditCourse = (course) => {
    setCourseToEdit(course);
    setActiveView("add-edit");
  };

  const handleOpenBuilder = (course) => {
    setSelectedCourse(course);
    setActiveView("builder");
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        await addCategory(newCategoryName.trim()).unwrap();
        setNewCategoryName("");
      } catch (err) {
        console.error("Failed to add category:", err);
      }
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
                  await deleteCategory(id).unwrap();
                  toast.success("Category deleted");
                  if (selectedCategory === id.toString()) {
                    setSelectedCategory("");
                  }
                } catch (err) {
                  console.error("Failed to delete category:", err);
                  const errorMsg = err?.data?.detail || "Failed to delete category";
                  toast.error(errorMsg);
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

  const handleSaveCourse = (formData) => {
    // API integration for saving would go here
    setActiveView("listing");
    setCourseToEdit(null);
  };

  if (activeView === "add-edit") {
    return (
      <AddEditCourse
        course={courseToEdit}
        onBack={() => setActiveView("listing")}
        onSave={handleSaveCourse}
      />
    );
  }

  if (activeView === "builder") {
    return (
      <CourseBuilder
        course={selectedCourse}
        onBack={() => setActiveView("listing")}
      />
    );
  }

  if (activeView === "live-sessions") {
    return <LiveSessions onBack={() => setActiveView("listing")} />;
  }

  return (
    <div className="pt-2 flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        {/* <button
          onClick={() => setActiveView("live-sessions")}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold arimo-font transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Video className="w-5 h-5" />
          Live
        </button> */}
        <button
          onClick={handleAddCourse}
          className="bg-greenTeal hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold arimo-font transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Course
        </button>
      </div>
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-12 z-20">
        {/* Category Filter */}
        <div className="flex flex-col gap-3 relative">
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="flex items-center gap-2 text-stone-700 hover:text-teal-700 transition-colors group"
          >
            <Filter className="w-4 h-4 text-stone-500 group-hover:text-teal-600" />
            <span className="text-sm font-bold font-['Arial'] leading-5 tracking-wide">
              {categories.find((c) => c.id === parseInt(selectedCategory))
                ?.name || "CATEGORY"}
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
              <div className="absolute top-8 left-0 mt-2 p-1 bg-white border border-stone-100 rounded-[1.5rem] shadow-2xl flex flex-col gap-1 min-w-[220px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <div className="max-h-60 overflow-y-auto p-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm text-left transition-all ${selectedCategory === ""
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-stone-600 hover:bg-stone-50"
                      }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${selectedCategory === cat.id.toString()
                        ? "bg-teal-50 text-teal-700 font-bold"
                        : "text-stone-600 hover:bg-stone-50"
                        }`}
                      onClick={() => {
                        setSelectedCategory(cat.id.toString());
                        setIsCategoryOpen(false);
                      }}
                    >
                      <span className="truncate">{cat.name}</span>
                      <button
                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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
                    onClick={handleAddCategory}
                    className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === ""
                ? "bg-gradient-to-b from-teal-600 to-cyan-900 text-white shadow-md scale-105"
                : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.id.toString()
                  ? "bg-gradient-to-b from-teal-600 to-cyan-900 text-white shadow-md scale-105"
                  : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-3 relative">
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className="flex items-center gap-2 text-stone-700 hover:text-teal-700 transition-colors group"
          >
            <Filter className="w-4 h-4 text-stone-500 group-hover:text-teal-600" />
            <span className="text-sm font-bold font-['Arial'] leading-5 tracking-wide">
              STATUS
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${isStatusOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isStatusOpen && (
            <div className="absolute top-8 left-0 mt-2 p-5 bg-white border border-stone-100 rounded-[1.5rem] shadow-2xl flex flex-col gap-1 min-w-[180px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {statuses.map((stat) => (
                <button
                  key={stat}
                  onClick={() => {
                    setSelectedStatus(stat);
                    setIsStatusOpen(false);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm text-left transition-all ${selectedStatus === stat
                    ? "bg-teal-50 text-teal-700 font-bold"
                    : "text-stone-600 hover:bg-stone-50"
                    }`}
                >
                  {stat}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {statuses.map((stat) => (
              <button
                key={stat}
                onClick={() => setSelectedStatus(stat)}
                className={`px-6 py-1.5 rounded-full text-xs font-medium transition-all ${selectedStatus === stat
                  ? "bg-gradient-to-b from-teal-600 to-cyan-900 text-white shadow-md scale-105"
                  : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by course title or instructor..."
            className="w-full h-10 pl-10 pr-4 bg-zinc-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-greenTeal/20 focus:border-greenTeal transition-all text-sm arimo-font"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* <div className="flex items-center gap-2 bg-zinc-50 border border-black/5 rounded-xl px-3 h-10 w-full md:w-auto">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              className="bg-transparent border-none focus:outline-none text-xs text-gray-600 arimo-font w-full md:w-[110px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
            />
            <span className="text-gray-300">-</span>
            <input
              type="date"
              className="bg-transparent border-none focus:outline-none text-xs text-gray-600 arimo-font w-full md:w-[110px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded hover:bg-red-100 transition-colors ml-1"
              >
                Clear
              </button>
            )}
          </div> */}

          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-greenTeal" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-greenTeal" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>{" "}
      {/* Course Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
            Total Courses
          </p>
          <h4 className="text-2xl font-bold text-neutral-900">
            {apiResponse?.count || 0}
          </h4>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm animate-pulse">
            Loading amazing courses...
          </p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-500 font-bold">Failed to load courses</p>
          <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 tracking-tight">
              {filteredCourses.map((c) => {
                const instructorName = getInstructorName(c.teacher);
                const statusLabel = getStatusLabel(c.status);
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-[2rem] border border-stone-200 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-64 w-full p-4">
                      <div className="absolute top-6 right-8 z-10 px-4 py-1.5 bg-white/80 backdrop-blur-md border border-stone-200 rounded-2xl text-stone-700 text-xs font-medium shadow-sm">
                        {c.category?.name || "Uncategorized"}
                      </div>
                      <img
                        src={c.thumbnail || "https://placehold.co/360x219"}
                        alt={c.title}
                        className="w-full h-full object-cover rounded-[1.5rem]"
                      />
                    </div>

                    <div className="px-6 pb-6 flex flex-col gap-5 flex-grow">
                      {/* Status Badge */}
                      <div className="flex">
                        <span
                          className={`px-4 py-1.5 rounded-[20px] text-xs font-semibold text-white flex items-center gap-2 ${statusLabel === "Upcoming"
                            ? "bg-lime-600"
                            : statusLabel === "Running"
                              ? "bg-red-700"
                              : "bg-sky-500"
                            }`}
                        >
                          {statusLabel === "Running" && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                          )}
                          {statusLabel}
                        </span>
                      </div>

                      {/* Title and Instructor */}
                      <div className="space-y-2">
                        <h4 className="text-stone-900 text-xl font-bold leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-teal-700 transition-colors">
                          {c.title}
                        </h4>
                        <div className="flex items-center justify-between gap-2 text-stone-600">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                              {c.teacher?.profile_picture ? (
                                <img
                                  src={c.teacher.profile_picture}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <Users className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-sm font-medium">
                              {instructorName}
                            </span>
                          </div>
                          {statusLabel === "Upcoming" && (
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">
                              Starts{" "}
                              {c.start_date
                                ? new Date(c.start_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                                : "TBD"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Course Stats */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                        <div className="flex items-center gap-2 text-stone-500 bg-stone-50 p-2 rounded-xl">
                          <BookOpen className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold whitespace-nowrap">
                            {c.total_lessons || 0} Lessons
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-500 bg-stone-50 p-2 rounded-xl">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold whitespace-nowrap">
                            {c.duration_in_weeks} Weeks
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-500 bg-stone-50 p-2 rounded-xl">
                          <Clock className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold whitespace-nowrap">
                            {c.total_hours} hr
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-500 bg-stone-50 p-2 rounded-xl">
                          <Clock className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold whitespace-nowrap line-clamp-1">
                            {c.hours_per_session} hr/session
                          </span>
                        </div>
                      </div>

                      {/* Footer: Price and Actions */}
                      <div className="pt-5 border-t border-stone-100 flex items-center justify-between mt-auto">
                        <span className="text-teal-800 text-2xl font-black">
                          ${c.price}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCourse(c)}
                            className="w-10 h-10 bg-white rounded-xl border border-stone-200 flex justify-center items-center text-stone-400 hover:text-teal-600 hover:border-teal-600 hover:bg-teal-50 transition-all shadow-sm"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenBuilder(c)}
                            className="w-10 h-10 bg-white rounded-xl border border-stone-200 flex justify-center items-center text-stone-400 hover:text-teal-600 hover:border-teal-600 hover:bg-teal-50 transition-all shadow-sm"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <table className="w-full text-sm text-left arimo-font font-medium">
                <thead className="bg-zinc-50 border-b border-black/5 text-neutral-500">
                  <tr>
                    <th className="py-4 px-6">Course Name</th>
                    <th className="py-4 px-6">Instructor</th>
                    <th className="py-4 px-6 text-center">Lessons</th>
                    <th className="py-4 px-6 text-center">Duration</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredCourses.map((c) => {
                    const instructorName = getInstructorName(c.teacher);
                    const statusLabel = getStatusLabel(c.status);
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 flex items-center gap-3">
                          <img
                            src={c.thumbnail || "https://placehold.co/360x219"}
                            className="w-12 h-8 rounded-lg object-cover border border-black/5"
                          />
                          <span className="text-neutral-950 font-bold">
                            {c.title}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-neutral-600">
                          {instructorName}
                        </td>
                        <td className="py-4 px-6 text-center text-neutral-600">
                          {c.total_lessons || 0}
                        </td>
                        <td className="py-4 px-6 text-center text-neutral-600">
                          {c.duration_in_weeks} Weeks
                        </td>
                        <td className="py-4 px-6 font-bold">${c.price}</td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <span
                              className={`px-3 py-1 rounded-[20px] text-[10px] font-bold uppercase ${statusLabel === "Upcoming"
                                ? "bg-lime-600 text-white"
                                : statusLabel === "Running"
                                  ? "bg-red-700 text-white"
                                  : "bg-sky-500 text-white"
                                }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditCourse(c)}
                              className="p-1.5 hover:bg-gray-100 rounded text-slate-400"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenBuilder(c)}
                              className="p-1.5 hover:bg-gray-100 rounded text-slate-400"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-8 border-t border-black/5 pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={apiResponse?.total_pages || 1}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Courses;
