import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Clock,
  User,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useGetConsultationCalendarQuery,
  useGetConsultationTimeslotsQuery,
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";

const ConsultationDetailsModal = ({ isOpen, onClose, consultation }) => {
  if (!isOpen || !consultation) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    // We append noon so timezone drift doesn't accidentally shift the day back one step
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const [calendarDate, setCalendarDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const monthString = `${calendarDate.getFullYear()}-${String(
    calendarDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const { data: calendarData, isLoading: isCalendarLoading } =
    useGetConsultationCalendarQuery(
      { id: consultation.id, month: monthString },
      { skip: !isOpen || !consultation },
    );

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: timeslotsPageData,
    isLoading: isTimeslotsLoading,
    isFetching: isTimeslotsFetching,
  } = useGetConsultationTimeslotsQuery(
    { id: consultation.id, date: selectedDate, page: currentPage },
    { skip: !isOpen || !consultation || !selectedDate },
  );

  const slotsForSelectedDate = timeslotsPageData?.results || [];

  const monthLabel = useMemo(
    () =>
      calendarDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [calendarDate],
  );

  const startDay = calendarDate.getDay();
  const daysInMonth = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    0,
  ).getDate();

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < startDay; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const yearStr = calendarDate.getFullYear();
      const monthStr = String(calendarDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const iso = `${yearStr}-${monthStr}-${dayStr}`;
      cells.push({ day, iso });
    }
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < trailing; i += 1) {
      cells.push(null);
    }
    return cells;
  }, [calendarDate, daysInMonth, startDay]);

  const previousMonth = () =>
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );

  const getCellStatus = (iso) => {
    if (!calendarData || !calendarData[iso]) return "unavailable";
    return calendarData[iso].status; // Can be "available" or "fully_booked"
  };

  const handleDateClick = (iso, status) => {
    if (status !== "unavailable") {
      setSelectedDate(iso);
      setSelectedSlotId(null);
      setCurrentPage(1);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-stone-50 rounded-[2rem] shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-6 py-5 md:px-8 md:py-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-zinc-900 arimo-font">
              Consultation with{" "}
              {`${consultation.teacher?.user?.first_name || ""} ${
                consultation.teacher?.user?.last_name || ""
              }`.trim() || "Teacher"}
            </h2>
            <p className="text-stone-500 text-sm inter-font">
              Review schedule and consultation details
            </p>
          </div>
          <button
            onClick={onClose}
            className="self-start p-2 hover:bg-stone-200/50 rounded-xl transition-all text-stone-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-8 md:px-8 flex flex-col gap-8 lg:flex-row">
          {/* Left Column: Teacher & Slots */}
          <div className="flex-1 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center border-2 border-stone-50 overflow-hidden shrink-0">
                {consultation.teacher?.profile_picture ? (
                  <img 
                    src={consultation.teacher.profile_picture} 
                    alt={consultation.teacher?.user?.first_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-stone-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-stone-900 inter-font">
                  {`${consultation.teacher?.user?.first_name || ""} ${
                    consultation.teacher?.user?.last_name || ""
                  }`.trim() || "Teacher"}
                </h3>
                <p className="text-xs text-stone-500 font-medium inter-font flex items-center gap-2">
                  <span>{consultation.teacher?.professional_title || "Professional"}</span>
                  {consultation.teacher?.location && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span>{consultation.teacher.location}</span>
                    </>
                  )}
                </p>
                {consultation.teacher?.about && (
                  <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
                    {consultation.teacher.about}
                  </p>
                )}
              </div>
              <div className="text-stone-900 font-bold text-lg">
                ${consultation.teacher?.consultation_rate ?? "N/A"}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-bold text-stone-600 inter-font">
                  Available Time Slots
                </h4>
                <span className="text-xs text-stone-500 inter-font">
                  {selectedDate ? formatDate(selectedDate) : "Select a date"}
                </span>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {!selectedDate ? (
                  <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center">
                    <Clock className="w-8 h-8 text-stone-200" />
                    <span className="text-sm font-medium text-stone-500 inter-font">
                      Please select an available date from the calendar to view
                      time slots.
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
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`w-full text-left bg-white border rounded-xl p-3 flex items-center justify-between gap-3 transition-all outline-none ${
                            isUnavailable
                              ? "opacity-50 grayscale bg-stone-50 border-stone-200 cursor-not-allowed"
                              : selectedSlotId === slot.id
                                ? "border-teal-500 bg-teal-50 shadow-sm"
                                : "border-stone-200 hover:border-teal-500 hover:bg-teal-50/30"
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
                                {formatTime(slot.scheduled_start)} -{" "}
                                {formatTime(slot.scheduled_end)}
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
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] font-black text-teal-600 hover:text-teal-700 underline underline-offset-2 uppercase tracking-widest"
                                  >
                                    Join Meeting
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          {isUnavailable && (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Booked
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {timeslotsPageData?.total_pages > 1 && (
                      <div className="pt-2">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={timeslotsPageData.total_pages}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white border border-stone-200 rounded-xl p-6 flex items-center justify-center text-center">
                    <span className="text-sm font-medium text-stone-500 inter-font">
                      No time slots found for this date.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Calendar */}
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

                  const status = getCellStatus(cell.iso);
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
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Available
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Full
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {consultation.bundle_sessions && (
          <div className="px-6 pb-8 md:px-8">
            <div className="relative bg-white rounded-3xl border-2 border-amber-600 shadow-xl p-6 flex flex-col items-center text-center group">
              <div className="absolute -top-4 bg-amber-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg transform transition-transform group-hover:scale-110">
                Best Value
              </div>
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border-2 border-amber-100 mb-4 shadow-inner">
                <Package className="w-8 h-8 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-stone-900 arimo-font tracking-tight">
                  Complete Bundle
                </h3>
                <p className="text-sm font-bold text-stone-500 inter-font uppercase tracking-widest">
                  {consultation.bundle_sessions} sessions included
                </p>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-black text-amber-600 arimo-font tracking-tighter">
                  $
                  {(
                    Number(consultation.teacher?.consultation_rate || 0) *
                    consultation.bundle_sessions *
                    (1 - (parseFloat(consultation.discount_percentage) || 0) / 100)
                  ).toFixed(0)}
                </span>
                <span className="text-lg font-bold text-stone-300 line-through decoration-amber-200/50">
                  ${(Number(consultation.teacher?.consultation_rate || 0) * consultation.bundle_sessions).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationDetailsModal;
