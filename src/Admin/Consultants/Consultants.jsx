import React, { useState } from "react";

import {
  User,
  Mail,
  Calendar,
  Video,
  Plus,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ArrowRight,
  Search,
  Layout,
} from "lucide-react";
import ScheduleConsultationModal from "./ScheduleConsultationModal";
import ConsultationDetailsModal from "./ConsultationDetailsModal";
import RescheduleDetailsModal from "./RescheduleDetailsModal";
import Pagination from "../../components/Pagination";
import {
  useGetConsultationsQuery,
  useGetTeacherProfilesQuery,
  useGetRescheduleRequestsQuery,
} from "../../Api/adminApi";
import { toast } from "react-hot-toast";

const Consultants = () => {
  const [activeTab, setActiveTab] = useState("Consultations"); // 'Consultations' or 'Reschedule Requests'
  const [activeView, setActiveView] = useState("teachers"); // 'teachers' or 'consultations' (for the teachers tab)
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeMonths, setActiveMonths] = useState({});
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Reschedule state
  const [teacherPage, setTeacherPage] = useState(1);
  const [consultationPage, setConsultationPage] = useState(1);
  const [reschedulePage, setReschedulePage] = useState(1);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedReschedule, setSelectedReschedule] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reset pages when search query changes to prevent "out of bounds" pagination on new results
  React.useEffect(() => {
    setTeacherPage(1);
    setConsultationPage(1);
    setReschedulePage(1);
  }, [searchQuery]);

  // Fetch Teachers (Paginated)
  const {
    data: teachersData,
    isLoading: isLoadingTeachers,
    isError: isTeachersError,
  } = useGetTeacherProfilesQuery({
    offers_consultations: true,
    page: teacherPage,
    search: searchQuery,
  }, { skip: activeTab !== "Consultations" || activeView === "consultations" });
  const teachers = teachersData?.results || [];
  const totalTeacherPages = teachersData?.total_pages || 1;

  // Only fetch consultations when a teacher is selected and in the correct view/tab
  const shouldFetchConsultations =
    !!selectedTeacher &&
    activeView === "consultations" &&
    activeTab === "Consultations";
  const {
    data: consultationsDataRaw,
    isLoading: isLoadingConsultations,
    isError: isConsultationsError,
  } = useGetConsultationsQuery(
    { teacher: selectedTeacher?.id, search: searchQuery, page: consultationPage },
    { skip: !shouldFetchConsultations }
  );
  const consultations = consultationsDataRaw?.results || (Array.isArray(consultationsDataRaw) ? consultationsDataRaw : []);
  const totalConsultationPages = consultationsDataRaw?.total_pages || 1;

  // Fetch Reschedule Requests
  const {
    data: rescheduleData,
    isLoading: isLoadingReschedule,
    isError: isRescheduleError,
  } = useGetRescheduleRequestsQuery(
    {
      page: reschedulePage,
      search: searchQuery,
    },
    { skip: activeTab !== "Reschedule Requests" },
  );

  const rescheduleRequests = rescheduleData?.results || [];
  const totalReschedulePages = rescheduleData?.total_pages || 1;

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (dateOrTimeString) => {
    if (!dateOrTimeString) return "N/A";
    let date;
    if (dateOrTimeString.includes("T")) {
      date = new Date(dateOrTimeString);
    } else {
      date = new Date(`1970-01-01T${dateOrTimeString}`);
    }
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatSlotDate = (slot) => {
    if (!slot) return "N/A";
    return formatDate(slot.day || slot.scheduled_start);
  };

  const buildSlotSummaries = (slots) => {
    if (!slots?.length) return [];
    const sortedSlots = [...slots].sort(
      (a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start),
    );

    return sortedSlots.map((slot) => {
      const date = new Date(slot.scheduled_start);
      const monthYear = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      
      return {
        id: slot.id,
        dateLabel: formatDate(slot.scheduled_start),
        monthYear,
        startTime: formatTime(slot.scheduled_start),
        endTime: formatTime(slot.scheduled_end),
        isBooked: slot.is_booked
      };
    });
  };

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setActiveView("consultations");
    setSearchQuery("");
    setConsultationPage(1);
  };

  const handleBackToTeachers = () => {
    setActiveView("teachers");
    setSelectedTeacher(null);
    setSearchQuery("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (tab === "Consultations") {
      setActiveView("teachers");
      setSelectedTeacher(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-100">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-100">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 pb-20 p-6 md:p-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          {activeView === "consultations" && activeTab === "Consultations" && (
            <button
              onClick={handleBackToTeachers}
              className="p-2.5 md:p-3 bg-white border border-stone-100 rounded-2xl text-stone-400 hover:text-teal-600 hover:border-teal-100 hover:bg-teal-50 shadow-sm transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 arimo-font tracking-tight">
            Consultation Hub
          </h1>
        </div>

        {/* Logical Button Placement - Only show when managing consultations */}
        {/* Logical Button Placement - Only show when managing consultations */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 flex-1 md:justify-end">
          {/* Search Field */}
          <div className="flex-1 max-w-full md:max-w-md relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" />
            <input
              type="text"
              placeholder={
                activeTab === "Consultations"
                  ? activeView === "teachers" 
                    ? "Search teachers..." 
                    : "Search consultation plans..."
                  : "Search reschedule requests..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-stone-300 shadow-sm"
            />
          </div>

          {/* Logical Button Placement - Only show when managing consultations */}
          {activeTab === "Consultations" && (
            <button
              onClick={() => setIsConsultationModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-greenTeal hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-teal-900/10 inter-font w-full sm:w-fit active:scale-95 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Add New</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
        {/* Tab Switcher */}
        <div className="flex border-b border-stone-100 p-2 gap-2 bg-stone-50/30 overflow-x-auto no-scrollbar">
          {["Consultations", "Reschedule Requests"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 md:px-8 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all inter-font whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white text-teal-600 shadow-sm border border-stone-100"
                  : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-stone-400 font-bold uppercase tracking-widest text-[10px] inter-font flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              {activeTab === "Consultations"
                ? activeView === "teachers"
                  ? "Select a Teacher"
                  : `Plans for ${selectedTeacher?.user?.first_name}`
                : "Manage Reschedule Inquiries"}
            </h2>
          </div>

          {activeTab === "Consultations" ? (
            <>
              {activeView === "teachers" ? (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 content-start">
                    {isLoadingTeachers ? (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                          <User className="w-10 h-10 text-stone-300 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900">
                          Loading Teachers...
                        </h3>
                      </div>
                    ) : teachers.length > 0 ? (
                      teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          onClick={() => handleTeacherClick(teacher)}
                          className="group bg-white rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-200 transition-all duration-500 p-5 md:p-6 cursor-pointer relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-teal-50 text-teal-600 p-2 rounded-xl">
                              <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                          <div className="flex items-center gap-5">
                            <div className="relative shrink-0">
                              {teacher.profile_picture ? (
                                <img
                                  src={teacher.profile_picture}
                                  alt=""
                                  className="w-20 h-20 rounded-[1.5rem] object-cover border border-stone-100 group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-stone-50 rounded-[1.5rem] flex items-center justify-center border border-stone-100">
                                  <User className="w-10 h-10 text-stone-300" />
                                </div>
                              )}
                              {teacher.offers_consultations && (
                                <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white p-1.5 rounded-xl border-4 border-white shadow-sm scale-90">
                                  <Video className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-black text-stone-900 arimo-font tracking-tight mb-0.5 group-hover:text-teal-900 truncate">
                                {teacher.user?.first_name}{" "}
                                {teacher.user?.last_name}
                              </h4>
                              <p className="text-[11px] font-bold text-stone-400 mb-3 truncate inter-font uppercase tracking-wider">
                                {teacher.professional_title || "Teacher"}
                              </p>
                              <div className="inline-flex items-center gap-1.5 bg-stone-50 text-stone-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                                ${teacher.consultation_rate || "0"}/hr
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                          <User className="w-10 h-10 text-stone-300" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900">
                          No teachers found
                        </h3>
                      </div>
                    )}
                  </div>

                  {/* Pagination for Teachers */}
                  <div className="mt-auto pt-8 border-t border-stone-50">
                    <Pagination
                      currentPage={teacherPage}
                      totalPages={totalTeacherPages}
                      onPageChange={setTeacherPage}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Filter Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-teal-50/50 p-6 rounded-[2rem] border border-teal-100/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                        <h2 className="text-xl font-black text-stone-900 arimo-font tracking-tight">
                          Consultation Plans for {selectedTeacher?.user?.first_name} {selectedTeacher?.user?.last_name}
                        </h2>
                      </div>
                      <p className="text-xs text-stone-500 font-medium inter-font ml-4">
                        {consultationsDataRaw?.count || 0} plans found for this teacher
                      </p>
                    </div>
                    {totalConsultationPages > 1 && (
                      <div className="bg-white px-4 py-2 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-3">
                         <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                           Page {consultationPage} of {totalConsultationPages}
                         </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                  {isLoadingConsultations ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                        <Calendar className="w-10 h-10 text-stone-300 animate-pulse" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-900">
                        Loading consultations...
                      </h3>
                    </div>
                  ) : isConsultationsError ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center border-2 border-dashed border-rose-200">
                        <AlertCircle className="w-10 h-10 text-rose-300" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-900">
                        Failed to load consultations
                      </h3>
                      <p className="text-sm text-stone-500 max-w-xs mx-auto">
                        There was an error connecting to the server. Please try again.
                      </p>
                    </div>
                  ) : consultations.length > 0 ? (
                    consultations.map((consultation) => {
                      const slotSummariesList = buildSlotSummaries(
                        consultation.timeslots,
                      );
                      const uniqueMonths = [...new Set(slotSummariesList.map(s => s.monthYear))];
                      const currentActiveMonth = activeMonths[consultation.id] || uniqueMonths[0];
                      const filteredSlots = slotSummariesList.filter(s => s.monthYear === currentActiveMonth);
                      
                      const currentIndex = uniqueMonths.indexOf(currentActiveMonth);
                      const canGoPrev = currentIndex > 0;
                      const canGoNext = currentIndex < uniqueMonths.length - 1;

                      const goToPrev = () => {
                        if (canGoPrev) {
                          setActiveMonths({ ...activeMonths, [consultation.id]: uniqueMonths[currentIndex - 1] });
                        }
                      };

                      const goToNext = () => {
                        if (canGoNext) {
                          setActiveMonths({ ...activeMonths, [consultation.id]: uniqueMonths[currentIndex + 1] });
                        }
                      };

                      return (
                        <div key={consultation.id} className="space-y-8">
                          {/* Precise Plan Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100/50 pb-8 mt-12 first:mt-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 border border-teal-100/50 shadow-sm">
                                <Layout className="w-7 h-7" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-2xl font-black text-stone-900 arimo-font tracking-tight leading-none">
                                  {consultation.title || `${consultation.teacher?.user?.first_name}'s Plan`}
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-[0.1em]">
                                  <span className="text-teal-600">
                                    {consultation.teacher?.user?.first_name} {consultation.teacher?.user?.last_name}
                                  </span>
                                  <span className="text-stone-300">•</span>
                                  <span>ID: #{consultation.id}</span>
                                  <span className="text-stone-300">•</span>
                                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                                    {consultation.timeslots?.length || 0} Slots
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedConsultation(consultation);
                                setIsDetailsModalOpen(true);
                              }}
                              className="flex items-center gap-3 bg-stone-900 hover:bg-teal-700 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-stone-900/10 active:scale-95 shrink-0"
                            >
                              <span>Manage Consultation</span>
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </button>
                          </div>

                          {/* Precise Discrete Month Navigator */}
                          {uniqueMonths.length > 1 && (
                            <div className="flex items-center justify-between bg-stone-50/50 p-2.5 rounded-full border border-stone-100 w-full max-w-2xl mx-auto shadow-sm mb-10">
                              <button
                                onClick={goToPrev}
                                disabled={!canGoPrev}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                  canGoPrev 
                                    ? "bg-white text-stone-900 shadow-xl shadow-stone-900/5 hover:bg-stone-900 hover:text-white active:scale-95" 
                                    : "bg-transparent text-stone-200 cursor-not-allowed"
                                }`}
                              >
                                <ChevronLeft className="w-6 h-6" />
                              </button>
                              
                              <div className="flex flex-col items-center justify-center text-center px-8 min-w-[200px]">
                                <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.4em] mb-2 block leading-none">
                                  Navigation • {currentIndex + 1}/{uniqueMonths.length}
                                </span>
                                <h4 className="text-xl font-black text-stone-900 uppercase tracking-[0.15em] arimo-font leading-none">
                                  {currentActiveMonth}
                                </h4>
                              </div>

                              <button
                                onClick={goToNext}
                                disabled={!canGoNext}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                  canGoNext 
                                    ? "bg-white text-stone-900 shadow-xl shadow-stone-900/5 hover:bg-stone-900 hover:text-white active:scale-95" 
                                    : "bg-transparent text-stone-200 cursor-not-allowed"
                                }`}
                              >
                                <ChevronRight className="w-6 h-6" />
                              </button>
                            </div>
                          )}

                          {/* Precise Slots Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredSlots.length > 0 ? (
                              filteredSlots.map((slot) => (
                                <div
                                  key={slot.id}
                                  className={`group/slot bg-white rounded-[2rem] border p-6 flex flex-col gap-5 shadow-sm hover:shadow-2xl hover:shadow-stone-900/5 transition-all duration-500 border-t-2 border-t-transparent ${slot.isBooked ? 'opacity-70 grayscale-[0.5] border-stone-100' : 'hover:border-t-teal-500 border-stone-100'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] block leading-none">
                                        Availability
                                      </span>
                                      <span className="text-[11px] font-black text-stone-900 uppercase tracking-wider block">
                                        {slot.dateLabel}
                                      </span>
                                    </div>
                                    {slot.isBooked && (
                                      <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-2 py-1 rounded-full uppercase tracking-tighter">
                                        Booked
                                      </span>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 font-bold text-xs transition-colors ${
                                    slot.isBooked 
                                      ? 'bg-stone-50 border-stone-100 text-stone-400' 
                                      : 'bg-stone-50 border-stone-100 text-stone-600 group-hover/slot:bg-teal-50 group-hover/slot:border-teal-100 group-hover/slot:text-teal-700'
                                  }`}>
                                    <Clock className={`w-4 h-4 ${slot.isBooked ? 'text-stone-300' : 'text-stone-300 group-hover/slot:text-teal-500'}`} />
                                    <span className="font-black text-[11px] tracking-tight">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-stone-50/30 rounded-[3rem] border-2 border-dashed border-stone-100">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                                  <Calendar className="w-10 h-10 text-stone-100" />
                                </div>
                                <p className="text-stone-400 text-xs font-black uppercase tracking-[0.2em]">
                                  No slots for {currentActiveMonth}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                        <Calendar className="w-10 h-10 text-stone-300" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-900">
                        No consultations scheduled
                      </h3>
                      <p className="text-stone-500">
                        This teacher has no consultation plans yet.
                      </p>
                    </div>
                  )}
                  {/* Pagination for Consultations */}
                  {consultations.length > 0 && (
                    <div className="mt-auto pt-8 border-t border-stone-50">
                      <Pagination
                        currentPage={consultationPage}
                        totalPages={totalConsultationPages}
                        onPageChange={setConsultationPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
            /* Reschedule Requests Tab Content */
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 content-start">
                {isLoadingReschedule ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                      <Clock className="w-10 h-10 text-stone-300 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900">
                      Loading Reschedule Requests...
                    </h3>
                  </div>
                ) : rescheduleRequests.length > 0 ? (
                  rescheduleRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => {
                        setSelectedReschedule(request);
                        setIsRescheduleModalOpen(true);
                      }}
                      className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-200 transition-all duration-500 p-5 md:p-6 cursor-pointer flex flex-col gap-6 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors shrink-0">
                            <User className="w-5 h-5 text-stone-400 group-hover:text-teal-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-stone-900 truncate">
                              {request.student_email || "Student"}
                            </p>
                            <p className="text-[10px] text-stone-400 font-medium">
                              Requested on {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 bg-stone-50/50 rounded-3xl p-5 border border-stone-100 group-hover:bg-teal-50/30 group-hover:border-teal-50 transition-all">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                              Old Slot
                            </span>
                            <p className="text-xs font-bold text-stone-600">
                              {formatDate(request.old_slot_time, true)}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-stone-100 text-stone-300">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-1 text-right">
                            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block">
                              New Request
                            </span>
                            <p className="text-xs font-black text-teal-700">
                              {formatDate(request.requested_slot_time, true)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="px-1 line-clamp-2">
                          <p className="text-stone-500 text-xs italic inter-font">
                            &ldquo;{request.reason}&rdquo;
                          </p>
                        </div>
                      )}

                      <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em]">
                          View Details
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                      <Clock className="w-10 h-10 text-stone-300" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900">
                      No reschedule requests
                    </h3>
                    <p className="text-stone-500">Everything up to date!</p>
                  </div>
                )}
              </div>

              {/* Pagination for Reschedule */}
              <div className="mt-auto pt-8 border-t border-stone-50">
                <Pagination
                  currentPage={reschedulePage}
                  totalPages={totalReschedulePages}
                  onPageChange={setReschedulePage}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ScheduleConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onSchedule={(newConsultation) => {
          // RTK query invalidates so we just close
          setIsConsultationModalOpen(false);
        }}
      />

      <ConsultationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        consultation={selectedConsultation}
      />

      <RescheduleDetailsModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        request={selectedReschedule}
      />
    </div>
  );
};

export default Consultants;
