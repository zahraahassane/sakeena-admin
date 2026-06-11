import React, { useState, useMemo } from "react";

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
  LayoutGrid,
  List,
} from "lucide-react";
import ScheduleConsultationModal from "./ScheduleConsultationModal";
import ConsultationDetailsModal from "./ConsultationDetailsModal";
import RescheduleDetailsModal from "./RescheduleDetailsModal";
import ManageRecurringSchedulesModal from "./ManageRecurringSchedulesModal";
import Pagination from "../../components/Pagination";
import {
  useGetConsultationsQuery,
  useGetTeacherProfilesQuery,
  useGetRescheduleRequestsQuery,
  useGetConsultationCalendarQuery,
  useGetConsultationTimeslotsQuery,
  useGetBookedConsultationsQuery,
} from "../../Api/adminApi";
import { toast } from "react-hot-toast";

// Consultation Card Component with Calendar
const ConsultationCard = ({
  consultation,
  calendarDates,
  setCalendarDates,
  selectedDates,
  setSelectedDates,
  timeslotPages,
  setTimeslotPages,
  setSelectedConsultation,
  setIsDetailsModalOpen,
  setIsManageRecurringModalOpen,
  formatDate,
  formatTime,
}) => {
  // Helper functions
  const getMonthString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMonthLabel = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getCalendarCells = (date) => {
    const startDay = date.getDay();
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    const cells = [];
    for (let i = 0; i < startDay; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const yearStr = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const iso = `${yearStr}-${monthStr}-${dayStr}`;
      cells.push({ day, iso });
    }
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < trailing; i += 1) {
      cells.push(null);
    }
    return cells;
  };

  const getCellStatus = (iso, calendarData) => {
    if (!calendarData || !calendarData[iso]) return "unavailable";
    return calendarData[iso].status; // Can be "available" or "fully_booked"
  };

  // Get calendar state for this consultation
  const calendarDate = calendarDates[consultation.id] || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const selectedDate = selectedDates[consultation.id] || null;
  const timeslotPage = timeslotPages[consultation.id] || 1;
  const monthString = getMonthString(calendarDate);
  
  // Fetch calendar and timeslots
  const { data: calendarData, isLoading: isCalendarLoading } = useGetConsultationCalendarQuery(
    { id: consultation.id, month: monthString }
  );
  
  const { data: timeslotsData, isLoading: isTimeslotsLoading, isFetching: isTimeslotsFetching } = useGetConsultationTimeslotsQuery(
    { id: consultation.id, date: selectedDate, page: timeslotPage },
    { skip: !selectedDate }
  );
  
  const slotsForSelectedDate = timeslotsData?.results || [];
  
  // Calendar handlers
  const previousMonth = () => {
    setCalendarDates({
      ...calendarDates,
      [consultation.id]: new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
    });
  };
  
  const nextMonth = () => {
    setCalendarDates({
      ...calendarDates,
      [consultation.id]: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
    });
  };
  
  const handleDateClick = (iso, status) => {
    if (status !== "unavailable") {
      setSelectedDates({
        ...selectedDates,
        [consultation.id]: iso
      });
      setTimeslotPages({
        ...timeslotPages,
        [consultation.id]: 1
      });
    }
  };
  
  const calendarCells = getCalendarCells(calendarDate);
  const monthLabel = getMonthLabel(calendarDate);

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
              {consultation.title ||
                `${consultation.teacher?.user?.first_name}'s Plan`}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-[0.1em]">
              <span className="text-teal-600">
                {consultation.teacher?.user?.first_name}{" "}
                {consultation.teacher?.user?.last_name}
              </span>
              <span className="text-stone-300">•</span>
              <span>ID: #{consultation.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setSelectedConsultation(consultation);
              setIsManageRecurringModalOpen(true);
            }}
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-900 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            <Calendar className="w-4 h-4 opacity-50" />
            <span>Reschedule</span>
          </button>
          <button
            onClick={() => {
              setSelectedConsultation(consultation);
              setIsDetailsModalOpen(true);
            }}
            className="flex items-center gap-3 bg-stone-900 hover:bg-teal-700 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-stone-900/10 active:scale-95"
          >
            <span>Manage Consultation</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Timeslots */}
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-bold text-stone-600 inter-font">
                Available Time Slots
              </h4>
              <span className="text-xs text-stone-500 inter-font">
                {selectedDate ? formatDate(selectedDate) : "Select a date"}
              </span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {!selectedDate ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center">
                  <Clock className="w-10 h-10 text-stone-200" />
                  <span className="text-sm font-medium text-stone-500 inter-font">
                    Please select an available date from the calendar to view time slots.
                  </span>
                </div>
              ) : isTimeslotsLoading || isTimeslotsFetching ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
              ) : slotsForSelectedDate.length > 0 ? (
                <>
                  {slotsForSelectedDate.map((slot) => {
                    const isUnavailable = slot.is_booked;

                    return (
                      <div
                        key={slot.id}
                        className={`w-full text-left bg-white border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all ${
                          isUnavailable
                            ? "opacity-70 grayscale-[0.5] bg-stone-50 border-stone-100 cursor-not-allowed"
                            : "border-stone-200 hover:border-teal-500 hover:bg-teal-50/30 cursor-pointer"
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <Clock
                              className={`w-4 h-4 ${
                                isUnavailable
                                  ? "text-stone-300"
                                  : "text-teal-500"
                              }`}
                            />
                            <span
                              className={`text-sm font-bold inter-font ${
                                isUnavailable
                                  ? "text-stone-400"
                                  : "text-stone-800"
                              }`}
                            >
                              {formatTime(slot.scheduled_start)} - {formatTime(slot.scheduled_end)}
                            </span>
                          </div>

                          {isUnavailable && slot.student && (
                            <div className="ml-7 flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                Booked by: {slot.student.user?.first_name} {slot.student.user?.last_name}
                              </span>
                              {slot.meeting_link && (
                                <a
                                  href={slot.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-black text-teal-600 hover:text-teal-700 underline underline-offset-2 uppercase tracking-widest"
                                >
                                  Join Meeting
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        {isUnavailable && (
                          <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-2 py-1 rounded-full uppercase tracking-tighter">
                            Booked
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {timeslotsData?.total_pages > 1 && (
                    <div className="pt-2">
                      <Pagination
                        currentPage={timeslotPage}
                        totalPages={timeslotsData.total_pages}
                        onPageChange={(page) => {
                          setTimeslotPages({
                            ...timeslotPages,
                            [consultation.id]: page
                          });
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 flex items-center justify-center text-center">
                  <span className="text-sm font-medium text-stone-500 inter-font">
                    No time slots found for this date.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right: Calendar */}
        <div className="w-full lg:w-[320px] space-y-4">
          <h4 className="text-sm font-bold text-stone-600 inter-font flex justify-between items-center">
            Select Date
            {isCalendarLoading && (
              <div className="animate-spin h-3 w-3 border-b-2 border-stone-600 rounded-full"></div>
            )}
          </h4>
          <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-sm relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-stone-800">
                {monthLabel}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="p-1 hover:bg-stone-100 rounded-md"
                >
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-stone-100 rounded-md"
                >
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-bold text-stone-400 text-center"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 relative">
              {calendarCells.map((cell, index) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square rounded-lg"
                    />
                  );
                }

                const status = getCellStatus(cell.iso, calendarData);
                const isAvailable = status === "available";
                const isFullyBooked = status === "fully_booked";
                const isSelected = selectedDate === cell.iso;

                let cellClasses = "text-stone-300 cursor-not-allowed"; // default unavailable
                if (isSelected) {
                  cellClasses =
                    "bg-teal-600 text-white shadow-md shadow-teal-900/10 cursor-pointer";
                } else if (isAvailable) {
                  cellClasses =
                    "text-teal-700 bg-teal-50 hover:bg-teal-100 cursor-pointer border border-teal-100";
                } else if (isFullyBooked) {
                  cellClasses =
                    "text-stone-500 bg-stone-100 border border-stone-200 cursor-pointer hover:bg-stone-200";
                }

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => handleDateClick(cell.iso, status)}
                    className={`aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center relative ${cellClasses}`}
                  >
                    {cell.day}
                    {/* Show tiny dot indicator for fully booked slots that aren't selected */}
                    {isFullyBooked && !isSelected && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-50 border border-teal-200"></div>
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                  Available
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                  Full
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Consultants = () => {
  const [activeTab, setActiveTab] = useState("Consultations"); // 'Consultations' or 'Reschedule Requests' or 'Booked Consultations'
  const [activeView, setActiveView] = useState("teachers"); // 'teachers' or 'consultations' (for the teachers tab)
  const [bookedConsultationsView, setBookedConsultationsView] = useState("cards"); // 'cards' or 'table'
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isManageRecurringModalOpen, setIsManageRecurringModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  
  // Calendar state per consultation
  const [consultationCalendarDates, setConsultationCalendarDates] = useState({});
  const [consultationSelectedDates, setConsultationSelectedDates] = useState({});
  const [consultationTimeslotPages, setConsultationTimeslotPages] = useState({});

  // Reschedule state
  const [teacherPage, setTeacherPage] = useState(1);
  const [consultationPage, setConsultationPage] = useState(1);
  const [reschedulePage, setReschedulePage] = useState(1);
  const [bookedConsultationsPage, setBookedConsultationsPage] = useState(1);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedReschedule, setSelectedReschedule] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset pages when search query changes to prevent "out of bounds" pagination on new results
  React.useEffect(() => {
    setTeacherPage(1);
    setConsultationPage(1);
    setReschedulePage(1);
    setBookedConsultationsPage(1);
  }, [searchQuery]);

  // Fetch Teachers (Paginated)
  const {
    data: teachersData,
    isLoading: isLoadingTeachers,
    isError: isTeachersError,
  } = useGetTeacherProfilesQuery(
    {
      offers_consultations: true,
      page: teacherPage,
      search: searchQuery,
    },
    { skip: activeTab !== "Consultations" || activeView === "consultations" },
  );
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
    {
      teacher: selectedTeacher?.id,
      search: searchQuery,
      page: consultationPage,
    },
    { skip: !shouldFetchConsultations },
  );
  const consultations =
    consultationsDataRaw?.results ||
    (Array.isArray(consultationsDataRaw) ? consultationsDataRaw : []);
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

  const {
    data: bookedConsultationsData,
    isLoading: isLoadingBookedConsultations,
  } = useGetBookedConsultationsQuery(bookedConsultationsPage, {
    skip: activeTab !== "Booked Consultations",
  });

  const bookedConsultations = bookedConsultationsData?.results || [];
  const totalBookedConsultationsPages = bookedConsultationsData?.total_pages || 1;

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";
    let date;
    if (includeTime) {
      date = new Date(dateString);
    } else {
      // We append noon so timezone drift doesn't accidentally shift the day back one step for calendar dates
      date = new Date(dateString + "T12:00:00");
    }
    if (Number.isNaN(date.getTime())) return "N/A";

    const options = {
      year: "numeric",
      month: includeTime ? "short" : "long",
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
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-stone-50 text-stone-500 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">
            {status}
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
          {/* Search Field - Hide on Booked Consultations */}
          {activeTab !== "Booked Consultations" && (
            <div className="flex-1 max-w-full md:max-w-md relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" />
              <input
                type="text"
                placeholder={
                  activeTab === "Consultations"
                    ? activeView === "teachers"
                      ? "Search teachers..."
                      : "Search consultation plans..."
                    : activeTab === "Reschedule Requests"
                      ? "Search reschedule requests..."
                      : "Search booked consultations..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-stone-300 shadow-sm"
              />
            </div>
          )}

          {/* Toggle Button for Booked Consultations View */}
          {activeTab === "Booked Consultations" && (
            <div className="flex items-center gap-2 bg-stone-100 rounded-2xl p-1">
              <button
                onClick={() => setBookedConsultationsView("cards")}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  bookedConsultationsView === "cards"
                    ? "bg-white text-teal-600 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBookedConsultationsView("table")}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  bookedConsultationsView === "table"
                    ? "bg-white text-teal-600 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

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
          {["Consultations", "Reschedule Requests", "Booked Consultations"].map((tab) => (
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
                : activeTab === "Reschedule Requests"
                  ? "Manage Reschedule Inquiries"
                  : "Booked Consultations"}
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
                          Consultation Plans for{" "}
                          {selectedTeacher?.user?.first_name}{" "}
                          {selectedTeacher?.user?.last_name}
                        </h2>
                      </div>
                      <p className="text-xs text-stone-500 font-medium inter-font ml-4">
                        {consultationsDataRaw?.count || 0} plans found for this
                        teacher
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
                          There was an error connecting to the server. Please
                          try again.
                        </p>
                      </div>
                    ) : consultations.length > 0 ? (
                      consultations.map((consultation) => (
                        <ConsultationCard
                          key={consultation.id}
                          consultation={consultation}
                          calendarDates={consultationCalendarDates}
                          setCalendarDates={setConsultationCalendarDates}
                          selectedDates={consultationSelectedDates}
                          setSelectedDates={setConsultationSelectedDates}
                          timeslotPages={consultationTimeslotPages}
                          setTimeslotPages={setConsultationTimeslotPages}
                          setSelectedConsultation={setSelectedConsultation}
                          setIsDetailsModalOpen={setIsDetailsModalOpen}
                          setIsManageRecurringModalOpen={setIsManageRecurringModalOpen}
                          formatDate={formatDate}
                          formatTime={formatTime}
                        />
                      ))
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
          ) : activeTab === "Reschedule Requests" ? (
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
          ) : (
            /* Booked Consultations Tab Content */
            <div className="flex-1 flex flex-col">
              {isLoadingBookedConsultations ? (
                <div className="flex-1 py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                    <Calendar className="w-10 h-10 text-stone-300 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Loading Booked Consultations...
                  </h3>
                </div>
              ) : bookedConsultations.length > 0 ? (
                <>
                  {bookedConsultationsView === "cards" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 content-start">
                      {bookedConsultations.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-200 transition-all duration-500 p-5 md:p-6 flex flex-col gap-6"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100 shrink-0">
                                <User className="w-5 h-5 text-stone-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-stone-900 truncate">
                                  {booking.customer.name}
                                </p>
                                <p className="text-[10px] text-stone-400 font-medium">
                                  {booking.customer.email}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>

                          <div className="flex flex-col gap-4 bg-stone-50/50 rounded-3xl p-5 border border-stone-100">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 space-y-1">
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                                  Consultant
                                </span>
                                <p className="text-xs font-bold text-stone-600">
                                  {booking.consultant.name}
                                </p>
                                <p className="text-[9px] text-stone-400">
                                  {booking.consultant.consultation_title}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block">
                                  Paid
                                </span>
                                <p className="text-sm font-black text-teal-700">
                                  ${booking.total_price_paid}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-stone-100 pt-4 space-y-2">
                              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                                Booked Slots ({booking.booked_slots.length})
                              </span>
                              <div className="space-y-2">
                                {booking.booked_slots.map((slot) => (
                                  <div
                                    key={slot.id}
                                    className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-xl border border-stone-100"
                                  >
                                    <span className="text-stone-600">
                                      {formatDate(slot.scheduled_start, true)}
                                    </span>
                                    <span className="text-stone-400">
                                      to {formatTime(slot.scheduled_end)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-stone-400 font-medium">
                              Booked on {formatDate(booking.created_at)}
                            </span>
                            <span className="text-[9px] font-black text-teal-600 uppercase tracking-wider">
                              {booking.sessions_purchased} Session{booking.sessions_purchased !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200">
                            <th className="px-4 py-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Customer</th>
                            <th className="px-4 py-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Consultant</th>
                            <th className="px-4 py-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Paid</th>
                            <th className="px-4 py-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Sessions</th>
                            <th className="px-4 py-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Status</th>
                            {/* <th className="px-4 py-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">Booked On</th> */}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {bookedConsultations.map((booking) => (
                            <tr key={booking.id} className="hover:bg-stone-50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100 shrink-0">
                                    <User className="w-5 h-5 text-stone-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-stone-900">{booking.customer.name}</p>
                                    <p className="text-[10px] text-stone-400">{booking.customer.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div>
                                  <p className="text-sm font-bold text-stone-900">{booking.consultant.name}</p>
                                  <p className="text-[10px] text-stone-400">{booking.consultant.consultation_title}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-sm font-black text-teal-700">${booking.total_price_paid}</p>
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-wider">
                                  {booking.sessions_purchased} Session{booking.sessions_purchased !== 1 ? "s" : ""}
                                </p>
                              </td>
                              <td className="px-4 py-4">
                                {getStatusBadge(booking.status)}
                              </td>
                              {/* <td className="px-4 py-4">
                                <p className="text-[10px] text-stone-400 font-medium">
                                  {formatDate(booking.created_at)}
                                </p>
                              </td> */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination for Booked Consultations */}
                  <div className="mt-auto pt-8 border-t border-stone-50">
                    <Pagination
                      currentPage={bookedConsultationsPage}
                      totalPages={totalBookedConsultationsPages}
                      onPageChange={setBookedConsultationsPage}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center border-2 border-dashed border-stone-200">
                    <Calendar className="w-10 h-10 text-stone-300" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900">
                    No booked consultations
                  </h3>
                  <p className="text-stone-500">
                    No consultations have been booked yet!
                  </p>
                </div>
              )}
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

      <ManageRecurringSchedulesModal
        isOpen={isManageRecurringModalOpen}
        onClose={() => setIsManageRecurringModalOpen(false)}
        consultation={selectedConsultation}
      />
    </div>
  );
};

export default Consultants;
