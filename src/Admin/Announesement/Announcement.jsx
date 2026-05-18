import React, { useState } from "react";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import CreatePopupAnnouncementModal from "./CreatePopupAnnouncementModal";
import EditPopupAnnouncementModal from "./EditPopupAnnouncementModal";
import { 
  useGetSiteAnnouncementsQuery, 
  useDeleteSiteAnnouncementMutation,
  useGetCoursesDataQuery,
  useGetCourseAnnouncementsQuery,
  useDeleteCourseAnnouncementMutation,
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";

import {
  Plus,
  Bell,
  Trash2,
  Calendar,
  User,
  ExternalLink,
  CheckCircle2,
  Image as ImageIcon,
  ChevronLeft,
  BookOpen,
  Edit2,
  Search,
  X,
  LayoutGrid,
  List,
  Clock,
  Award
} from "lucide-react";

const AnnouncementCard = ({ announcement, onEdit, onDelete }) => {
  const parseList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Not a JSON array, treat as single string
      }
      return [data];
    }
    return [];
  };

  const badgeList = parseList(announcement.badges);
  const highlightList = parseList(announcement.checklist || announcement.highlights);
  const formattedDate = announcement.publishedDate || (announcement.created_at ? new Date(announcement.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "Recently");

  return (
    <div
      className={`w-full bg-white rounded-[2.5rem] shadow-sm border border-black/5 flex flex-col md:flex-row overflow-hidden transition-all hover:shadow-xl group relative ${!announcement.isActive && announcement.is_active !== undefined && !announcement.is_active ? "opacity-75 grayscale-[0.5]" : ""}`}
    >
      {/* Badge Overlay */}
      <div className="absolute top-6 left-4 z-10 flex flex-wrap gap-2">
        {badgeList.map((badge, idx) => (
          <span
            key={idx}
            className="px-3 py-1 bg-white/90 backdrop-blur-md text-[#7AA4A5] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border border-black/5"
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Image Section */}
      <div className="w-full md:w-72 h-48 md:h-auto relative overflow-hidden shrink-0 bg-gray-50 border-r border-black/5">
        {announcement.imagePath || announcement.image ? (
          <img
            src={announcement.imagePath || announcement.image}
            alt={announcement.titleScript || announcement.main_title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent md:bg-gradient-to-t" />
      </div>

      {/* Content Section */}
      <div className="flex-1 p-8 flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              {/* Force minimum height/content so it never looks blank */}
              <p className="text-[#7AA4A5] text-xs font-bold uppercase tracking-[0.2em] min-h-[16px]">
                {announcement.titlePrefix || announcement.title_prefix || "Announcement"}
              </p>
              <h2 className="text-3xl font-black text-neutral-900 leading-tight arimo-font">
                {announcement.titleScript || announcement.main_title}
              </h2>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(announcement)}
                  className="p-2.5 text-neutral-400 hover:text-[#7AA4A5] hover:bg-[#7AA4A5]/5 rounded-xl transition-all"
                >
                  <Edit2 size={18} />
                </button>
              )}
              <button
                onClick={() => onDelete(announcement.id)}
                className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <p className="text-neutral-500 text-sm leading-relaxed max-w-2xl font-medium">
            {announcement.message}
          </p>

          {/* Highlights */}
          {highlightList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-2">
              {highlightList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-neutral-600 text-xs font-bold"
                >
                  <CheckCircle2 size={14} className="text-[#7AA4A5] shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-black/5">
          <div className="flex items-center gap-6 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#7AA4A5]" />
              <span>{formattedDate}</span>
            </div>
            {(announcement.author || announcement.created_at) && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-[#7AA4A5]" />
                <span>{announcement.author || "Admin"}</span>
              </div>
            )}
            {announcement.isActive === false || announcement.is_active === false ? (
              <span className="px-3 py-1 bg-gray-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                Inactive
              </span>
            ) : null}
          </div>

          <a
            href={announcement.ctaLink || announcement.cta_link || "#"}
            className="px-6 py-2.5 bg-[#7AA4A5] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#7AA4A5]/20 hover:bg-[#6A9495] transition-all active:scale-95 flex items-center gap-2"
          >
            {announcement.ctaText || announcement.cta_text || "Learn More"}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

const CourseAnnouncementCard = ({ announcement, onDelete }) => {
  const formattedDate = announcement.created_at ? new Date(announcement.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recently";

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-black/5 p-6 hover:shadow-lg transition-all relative group">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-neutral-900 arimo-font">{announcement.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-[#7AA4A5]" />
              <span>{announcement.created_by_name || "Admin"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[#7AA4A5]" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(announcement.id)}
          className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div 
        className="text-neutral-600 text-sm font-medium leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-black/5 quill-content"
        dangerouslySetInnerHTML={{ __html: announcement.body }}
      />
    </div>
  );
};

const Announcement = () => {
  const [activeTab, setActiveTab] = useState("announcements");
  const [viewMode, setViewMode] = useState("grid");
  
  const [isModalOpen, setIsModalOpen] = useState(false); // For Course Announcement Creates
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Reset pages when search changes
  React.useEffect(() => {
    setCurrentPage(1);
    setCoursePage(1);
    setCourseAnnouncementPage(1);
  }, [debouncedSearch]);

  // Popups Data
  const { data: popupsData, isLoading: isPopupsLoading } = useGetSiteAnnouncementsQuery({ 
    page: currentPage,
    search: debouncedSearch
  });
  const [deleteSiteAnnouncement] = useDeleteSiteAnnouncementMutation();
  const popups = popupsData?.results || [];

  // Course Announcements Data
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [coursePage, setCoursePage] = useState(1);
  const [courseAnnouncementPage, setCourseAnnouncementPage] = useState(1);

  const { data: coursesData, isLoading: isCoursesLoading } = useGetCoursesDataQuery({ 
    page: coursePage,
    search: debouncedSearch
  });
  const { data: courseAnnsData, isLoading: isCourseAnnsLoading } = useGetCourseAnnouncementsQuery(
    { 
      course_pk: selectedCourse?.id, 
      page: courseAnnouncementPage,
      search: debouncedSearch
    },
    { skip: !selectedCourse }
  );
  const [deleteCourseAnnouncement] = useDeleteCourseAnnouncementMutation();
  
  const coursesList = coursesData?.results || [];
  const courseAnnouncementsList = courseAnnsData?.results || [];

  const handleEditPopupTrigger = (popup) => {
    setCurrentPopup(popup);
    setIsEditPopupOpen(true);
  };

  const handleRemove = (id, type) => {
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1 arimo-font">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800 inter-font">
              Confirm Delete
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Are you sure you want to remove this {type}?
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
                if (type === "popup") {
                  try {
                    await deleteSiteAnnouncement(id).unwrap();
                    toast.success("Site popup removed successfully");
                  } catch (err) {
                    toast.error("Failed to delete popup");
                  }
                } else if (type === "course_announcement") {
                  try {
                    await deleteCourseAnnouncement({ course_pk: selectedCourse.id, id }).unwrap();
                    toast.success("Course announcement removed successfully");
                  } catch (err) {
                    toast.error("Failed to delete announcement");
                  }
                }
                toast.dismiss(t.id);
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
          minWidth: "400px",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.05)",
        },
      },
    );
  };

  // Prevent user from clicking "New Campaign" if they haven't picked a course when on course tab
  const canShowNewButton = activeTab === "popups" || (activeTab === "announcements" && selectedCourse);

  const handleNewButtonClick = () => {
    if (activeTab === "announcements") {
      setIsModalOpen(true);
    } else {
      setIsCreatePopupOpen(true);
    }
  };

  return (
    <div className="p-8 space-y-8 min-h-screen arimo-font bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-black/5 shadow-sm">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "announcements" ? "bg-[#7AA4A5] text-white shadow-lg" : "text-neutral-400 hover:text-neutral-600"}`}
          >
            Course Announcements
          </button>
          <button
            onClick={() => setActiveTab("popups")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "popups" ? "bg-[#7AA4A5] text-white shadow-lg" : "text-neutral-400 hover:text-neutral-600"}`}
          >
            Popups
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-zinc-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-[#7AA4A5]" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-[#7AA4A5]" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative group w-full sm:w-72 lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#7AA4A5] transition-colors" size={18} />
            <input
              type="text"
              placeholder={
                activeTab === "announcements" 
                  ? (selectedCourse ? `Search notices...` : "Search courses...") 
                  : "Search popups..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-black/5 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#7AA4A5]/10 focus:border-[#7AA4A5] transition-all text-sm font-medium placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {canShowNewButton && (
            <button
              onClick={handleNewButtonClick}
              className="flex items-center gap-2 bg-[#7AA4A5] hover:bg-[#6A8F8F] text-white px-8 py-3 rounded-2xl shadow-xl shadow-[#7AA4A5]/20 transition-all active:scale-95 text-xs font-black uppercase tracking-widest shrink-0 w-full sm:w-auto justify-center"
            >
              <Plus size={18} />
              {activeTab === "announcements" ? "New Notice" : "New Popup"}
            </button>
          )}
        </div>
      </div>

      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coursePk={selectedCourse?.id}
      />

      <CreatePopupAnnouncementModal
        isOpen={isCreatePopupOpen}
        onClose={() => setIsCreatePopupOpen(false)}
      />

      <EditPopupAnnouncementModal
        isOpen={isEditPopupOpen}
        onClose={() => {
          setIsEditPopupOpen(false);
          setCurrentPopup(null);
        }}
        announcement={currentPopup}
      />

      {/* Content */}
      {activeTab === "announcements" && (
        <div className="animate-in fade-in duration-500">
          {!selectedCourse ? (
             <div className="space-y-6">
               <h2 className="text-xl font-bold text-neutral-800">Select a Course to Manage Announcements</h2>
               
               {isCoursesLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(skele => (
                       <div key={skele} className="h-64 bg-white rounded-2xl border border-black/5 animate-pulse"></div>
                    ))}
                 </div>
               ) : coursesList.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border border-black/5">
                    <BookOpen className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-neutral-400 font-bold">
                      {debouncedSearch ? `No courses found matching "${debouncedSearch}"` : "No courses found."}
                    </p>
                    {debouncedSearch && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-[#7AA4A5] text-xs font-bold uppercase tracking-widest hover:underline"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
               ) : (
                 <>
                   <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
                      {coursesList.map((course) => (
                         <React.Fragment key={course.id}>
                           {viewMode === "grid" ? (
                             <div 
                               onClick={() => {
                                 setSelectedCourse(course);
                                 setCourseAnnouncementPage(1);
                               }}
                               className="bg-white rounded-3xl p-6 border border-black/5 hover:border-[#7AA4A5] hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[240px]"
                             >
                                <div>
                                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                      <BookOpen size={24} />
                                   </div>
                                   <h3 className="font-bold text-lg text-neutral-800 line-clamp-3 leading-tight mb-2 group-hover:text-[#7AA4A5] transition-colors">{course.title}</h3>
                                   {course.category && (
                                      <span className="text-xs font-bold bg-neutral-100 text-neutral-500 px-3 py-1 rounded-full uppercase tracking-wider">
                                        {course.category.name}
                                      </span>
                                   )}
                                </div>
                                <div className="flex items-center gap-2 mt-5 text-sm text-neutral-500 font-medium border-t border-black/5 pt-4">
                                   <img src={course.teacher?.profile_picture} alt="" className="w-6 h-6 rounded-full object-cover" onError={(e) => e.target.style.display='none'}/>
                                   <span className="truncate">{course.teacher?.user?.first_name} {course.teacher?.user?.last_name}</span>
                                </div>
                             </div>
                           ) : (
                             <div 
                               onClick={() => {
                                 setSelectedCourse(course);
                                 setCourseAnnouncementPage(1);
                               }}
                               className="bg-white rounded-2xl p-5 border border-black/5 hover:border-[#7AA4A5] hover:shadow-xl transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                             >
                                {/* Left: Thumbnail & Title & Meta */}
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                   {/* Thumbnail Image */}
                                   <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100 border border-black/5 relative flex items-center justify-center">
                                     {course.thumbnail ? (
                                       <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                     ) : (
                                       <BookOpen size={20} className="text-neutral-400" />
                                     )}
                                   </div>

                                   {/* Title, Category & Stats */}
                                   <div className="flex-1 min-w-0 space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                         <h3 className="font-bold text-lg text-neutral-800 line-clamp-1 group-hover:text-[#7AA4A5] transition-colors pr-2">{course.title}</h3>
                                         {course.category && (
                                            <span className="text-[10px] font-black bg-[#7AA4A5]/10 text-[#7AA4A5] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                              {course.category.name}
                                            </span>
                                         )}
                                         {course.level && (
                                            <span className="text-[10px] font-black bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
                                              {course.level}
                                            </span>
                                         )}
                                         {course.status && (
                                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                                              course.status === 'running' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : course.status === 'upcoming' 
                                                  ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                                  : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                              {course.status}
                                            </span>
                                         )}
                                      </div>

                                      {/* Stats Row */}
                                      <div className="flex flex-wrap items-center gap-3 pt-1">
                                         <div className="flex items-center gap-2 text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-black/5 shadow-sm text-xs font-bold">
                                            <Calendar size={14} className="text-[#7AA4A5]" />
                                            <span>{course.duration_in_weeks || 0} Weeks</span>
                                         </div>
                                         <div className="flex items-center gap-2 text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-black/5 shadow-sm text-xs font-bold">
                                            <Clock size={14} className="text-[#7AA4A5]" />
                                            <span>{course.total_hours ? parseFloat(course.total_hours) : 0} hr</span>
                                         </div>
                                         <div className="flex items-center gap-2 text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-black/5 shadow-sm text-xs font-bold">
                                            <Award size={14} className="text-[#7AA4A5]" />
                                            <span>{course.total_lessons || 0} Lessons</span>
                                         </div>
                                      </div>
                                   </div>
                                </div>

                                {/* Right: Teacher & Price */}
                                <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-neutral-100 pt-4 lg:pt-0 shrink-0">
                                   {/* Teacher */}
                                   {course.teacher && (
                                      <div className="flex items-center gap-2.5 text-sm text-neutral-500 font-medium">
                                         <img src={course.teacher.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover border border-black/5" />
                                         <div className="flex flex-col">
                                            <span className="font-bold text-neutral-800 line-clamp-1">{course.teacher.user?.first_name} {course.teacher.user?.last_name}</span>
                                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Instructor</span>
                                         </div>
                                      </div>
                                   )}

                                   {/* Price */}
                                   <div className="text-right">
                                      <span className="text-xl font-black text-teal-700 bg-teal-50/50 border border-teal-100 px-4 py-1.5 rounded-2xl block">
                                         ${course.price}
                                      </span>
                                   </div>
                                </div>
                             </div>
                           )}
                         </React.Fragment>
                      ))}
                   </div>
                   {coursesData?.total_pages > 1 && (
                      <Pagination
                        currentPage={coursePage}
                        totalPages={coursesData.total_pages}
                        onPageChange={setCoursePage}
                      />
                   )}
                 </>
               )}
             </div>
          ) : (
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedCourse(null)}
                    className="p-2 bg-white hover:bg-gray-100 border border-black/5 rounded-xl transition-colors"
                  >
                     <ChevronLeft size={20} className="text-neutral-600" />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-[#7AA4A5] uppercase tracking-widest">Managing Announcements For</p>
                    <h2 className="text-2xl font-black text-neutral-900 arimo-font">{selectedCourse.title}</h2>
                  </div>
                </div>

                {isCourseAnnsLoading ? (
                  <div className="space-y-4">
                    {[1,2].map((s) => <div key={s} className="h-32 bg-white rounded-2xl border border-black/5 animate-pulse"></div>)}
                  </div>
                ) : courseAnnouncementsList.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border border-black/5 shadow-sm">
                    <Bell className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-neutral-400 font-bold mb-6">
                      {debouncedSearch 
                        ? `No notices found for "${debouncedSearch}"` 
                        : "No notices have been posted for this course yet."}
                    </p>
                    {!debouncedSearch && (
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2.5 bg-[#7AA4A5]/10 text-[#7AA4A5] text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#7AA4A5]/20 transition-colors"
                      >
                        Create First Notice
                      </button>
                    )}
                    {debouncedSearch && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="text-[#7AA4A5] text-xs font-bold uppercase tracking-widest hover:underline"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
                     {courseAnnouncementsList.map((ann) => (
                        <CourseAnnouncementCard 
                          key={ann.id}
                          announcement={ann}
                          onDelete={(id) => handleRemove(id, "course_announcement")}
                        />
                     ))}
                  </div>
                )}
                {courseAnnsData?.total_pages > 1 && (
                  <Pagination 
                     currentPage={courseAnnouncementPage}
                     totalPages={courseAnnsData.total_pages}
                     onPageChange={setCourseAnnouncementPage}
                  />
                )}
             </div>
          )}
        </div>
      )}

      {activeTab === "popups" && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-700">
          {isPopupsLoading ? (
            <div className="h-[200px] w-full bg-neutral-100 rounded-[2.5rem] animate-pulse"></div>
          ) : popups.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border border-black/5">
              <Bell className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-neutral-400 font-bold">
                {debouncedSearch ? `No popups found matching "${debouncedSearch}"` : "No active popup campaigns found."}
              </p>
              {debouncedSearch && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-[#7AA4A5] text-xs font-bold uppercase tracking-widest hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {popups.map((popup) => (
                <AnnouncementCard
                  key={popup.id}
                  announcement={popup}
                  onEdit={(p) => handleEditPopupTrigger(p)}
                  onDelete={(id) => handleRemove(id, "popup")}
                />
              ))}
              {popupsData?.total_pages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={popupsData.total_pages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Announcement;
