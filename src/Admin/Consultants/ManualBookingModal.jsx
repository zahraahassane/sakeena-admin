import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  CalendarPlus,
  User,
  Layout,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  StickyNote,
  Loader2,
  CircleAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetConsultationsQuery,
  useGetStudentProfilesQuery,
  useGetConsultationCalendarQuery,
  useGetConsultationTimeslotsQuery,
  useManualBookConsultationMutation,
} from "../../Api/adminApi";

const ManualBookingModal = ({ isOpen, onClose }) => {
  const [consultationSearch, setConsultationSearch] = useState("");
  const [selectedConsultationId, setSelectedConsultationId] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null); // { id, name, email }

  const [calendarDate, setCalendarDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);

  const [priceOverride, setPriceOverride] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const resetAll = () => {
    setConsultationSearch("");
    setSelectedConsultationId("");
    setStudentSearch("");
    setSelectedStudent(null);
    setSelectedDate(null);
    setSelectedSlotIds([]);
    setPriceOverride("");
    setPaymentReference("");
  };

  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen]);

  const { data: consultationsData, isFetching: isFetchingConsultations } =
    useGetConsultationsQuery(
      { search: consultationSearch, page_size: 20 },
      { skip: !isOpen },
    );
  const consultations = useMemo(
    () => consultationsData?.results || (Array.isArray(consultationsData) ? consultationsData : []),
    [consultationsData],
  );
  const selectedConsultation = useMemo(
    () => consultations.find((c) => String(c.id) === String(selectedConsultationId)) || null,
    [consultations, selectedConsultationId],
  );

  const { data: studentsData, isFetching: isFetchingStudents } =
    useGetStudentProfilesQuery(
      { search: studentSearch },
      { skip: !isOpen },
    );
  const studentProfiles = useMemo(() => studentsData?.results || [], [studentsData]);

  const monthString = `${calendarDate.getFullYear()}-${String(
    calendarDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const { data: calendarData, isFetching: isCalendarFetching } =
    useGetConsultationCalendarQuery(
      { id: selectedConsultation?.id, month: monthString, timezone: timeZone },
      { skip: !isOpen || !selectedConsultation },
    );

  const { data: timeslotsData, isFetching: isTimeslotsFetching } =
    useGetConsultationTimeslotsQuery(
      { id: selectedConsultation?.id, date: selectedDate, timezone: timeZone },
      { skip: !isOpen || !selectedConsultation || !selectedDate },
    );
  const slotsForSelectedDate = timeslotsData?.results || [];

  const [manualBookConsultation, { isLoading: isBooking }] =
    useManualBookConsultationMutation();

  if (!isOpen) return null;

  const monthLabel = calendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const startDay = calendarDate.getDay();
  const daysInMonth = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    0,
  ).getDate();

  const calendarCells = [];
  for (let i = 0; i < startDay; i += 1) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const yearStr = calendarDate.getFullYear();
    const monthStr = String(calendarDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    calendarCells.push({ day, iso: `${yearStr}-${monthStr}-${dayStr}` });
  }

  const getCellStatus = (iso) => calendarData?.[iso]?.status || "unavailable";

  const toggleSlot = (slotId) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId],
    );
  };

  const estimatedPrice =
    selectedConsultation && selectedSlotIds.length
      ? (Number(selectedConsultation.standard_price || 0) * selectedSlotIds.length).toFixed(2)
      : "0.00";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedConsultation) {
      toast.error("Please select a consultation plan.");
      return;
    }
    if (!selectedStudent) {
      toast.error("Please select a student.");
      return;
    }
    if (selectedSlotIds.length === 0) {
      toast.error("Please select at least one timeslot.");
      return;
    }

    const body = {
      student_id: selectedStudent.id,
      timeslot_ids: selectedSlotIds,
    };
    if (priceOverride !== "") {
      body.total_price_paid = priceOverride;
    }
    if (paymentReference.trim()) {
      body.payment_reference = paymentReference.trim();
    }

    try {
      await manualBookConsultation({ id: selectedConsultation.id, body }).unwrap();
      toast.success(`Booked ${selectedSlotIds.length} session(s) for ${selectedStudent.name}.`);
      onClose();
      resetAll();
    } catch (error) {
      console.error("Failed to manually book consultation:", error);
      toast.error(error?.data?.error || "Unable to book this consultation. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-stone-200/20 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-greenTeal" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 arimo-font">
                Book Manually
              </h2>
              <p className="text-xs text-stone-400 inter-font">
                For bookings taken over the phone, cash, or as a courtesy — skips checkout.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetAll();
            }}
            className="p-2 hover:bg-stone-50 rounded-xl transition-all text-stone-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar"
        >
          {/* Consultation picker */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
              <Layout className="w-4 h-4 text-stone-400" />
              Consultation Plan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, teacher name or email..."
                value={consultationSearch}
                onChange={(e) => setConsultationSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all mb-2"
              />
            </div>
            <select
              required
              value={selectedConsultationId}
              onChange={(e) => {
                setSelectedConsultationId(e.target.value);
                setSelectedDate(null);
                setSelectedSlotIds([]);
              }}
              className={`w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font appearance-none ${
                isFetchingConsultations ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <option value="">
                {isFetchingConsultations ? "Loading..." : "Choose a consultation plan..."}
              </option>
              {!isFetchingConsultations && consultations.length === 0 && (
                <option value="" disabled>
                  No consultation plans found
                </option>
              )}
              {consultations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {`${c.teacher?.user?.first_name || ""} ${c.teacher?.user?.last_name || ""}`.trim() || c.teacher?.user?.email}
                  {c.standard_price ? ` ($${c.standard_price})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Student picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
                <User className="w-4 h-4 text-stone-400" />
                Student <span className="text-red-500">*</span>
              </label>
              {selectedStudent && (
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                  Selected: {selectedStudent.name}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all mb-2"
              />
            </div>
            <select
              required
              value={selectedStudent?.id || ""}
              onChange={(e) => {
                const profile = studentProfiles.find(
                  (p) => String(p.user.id) === String(e.target.value),
                );
                setSelectedStudent(
                  profile
                    ? {
                        id: profile.user.id,
                        name: `${profile.user.first_name || ""} ${profile.user.last_name || ""}`.trim() || profile.user.email,
                        email: profile.user.email,
                      }
                    : null,
                );
              }}
              className={`w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font appearance-none ${
                isFetchingStudents ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <option value="">
                {isFetchingStudents ? "Loading..." : "Choose a student..."}
              </option>
              {!isFetchingStudents && studentProfiles.length === 0 && (
                <option value="" disabled>
                  No students found
                </option>
              )}
              {studentProfiles.map((p) => (
                <option key={p.id} value={p.user.id}>
                  {`${p.user.first_name || ""} ${p.user.last_name || ""}`.trim() || "Unnamed"} ({p.user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Timeslot picker */}
          {selectedConsultation && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
                <Clock className="w-4 h-4 text-stone-400" />
                Timeslots <span className="text-red-500">*</span>
                {selectedSlotIds.length > 0 && (
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg ml-auto">
                    {selectedSlotIds.length} selected
                  </span>
                )}
              </label>
              <div className="flex flex-col sm:flex-row gap-4 bg-stone-50/60 border border-stone-200 rounded-2xl p-4">
                <div className="w-full sm:w-[260px] shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-700">{monthLabel}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
                        }
                        className="p-1 hover:bg-stone-200/60 rounded-md"
                      >
                        <ChevronLeft className="w-4 h-4 text-stone-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
                        }
                        className="p-1 hover:bg-stone-200/60 rounded-md"
                      >
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d} className="text-[9px] font-bold text-stone-400 text-center">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((cell, index) => {
                      if (!cell) return <div key={`empty-${index}`} className="aspect-square" />;
                      const status = getCellStatus(cell.iso);
                      const isAvailable = status === "available";
                      const isSelected = selectedDate === cell.iso;
                      let cls = "text-stone-300 cursor-not-allowed";
                      if (isSelected) cls = "bg-teal-600 text-white shadow-sm cursor-pointer";
                      else if (isAvailable)
                        cls = "text-teal-700 bg-teal-50 hover:bg-teal-100 cursor-pointer border border-teal-100";
                      else if (status === "fully_booked")
                        cls = "text-stone-400 bg-stone-100 border border-stone-200 cursor-not-allowed";
                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          disabled={!isAvailable && !isSelected}
                          onClick={() => {
                            setSelectedDate(cell.iso);
                            setSelectedSlotIds([]);
                          }}
                          className={`aspect-square rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center ${cls}`}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>
                  {isCalendarFetching && (
                    <div className="flex justify-center mt-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2 max-h-[240px] overflow-y-auto pr-1 no-scrollbar">
                  {!selectedDate ? (
                    <div className="h-full flex items-center justify-center text-center text-xs text-stone-400 font-medium py-8">
                      Select an available date to view open timeslots.
                    </div>
                  ) : isTimeslotsFetching ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    </div>
                  ) : slotsForSelectedDate.filter((s) => !s.is_booked).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-xs text-stone-400 font-medium py-8">
                      No open timeslots on this date.
                    </div>
                  ) : (
                    slotsForSelectedDate
                      .filter((s) => !s.is_booked)
                      .map((slot) => {
                        const isChecked = selectedSlotIds.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => toggleSlot(slot.id)}
                            className={`w-full text-left bg-white border rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all ${
                              isChecked
                                ? "border-teal-500 bg-teal-50 shadow-sm"
                                : "border-stone-200 hover:border-teal-500 hover:bg-teal-50/30"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                isChecked ? "bg-teal-600 border-teal-600" : "border-stone-300"
                              }`}
                            >
                              {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                            </div>
                            <span className="text-sm font-bold text-stone-800 inter-font">
                              {new Date(slot.scheduled_start).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(slot.scheduled_end).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Price + note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
                <DollarSign className="w-4 h-4 text-stone-400" />
                Price Override
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={`Auto: $${estimatedPrice}`}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
              />
              <p className="text-[11px] text-stone-400">
                Leave empty to charge the standard rate (with bundle discount applied).
              </p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
                <StickyNote className="w-4 h-4 text-stone-400" />
                Payment Note
              </label>
              <input
                type="text"
                placeholder="e.g. Paid in cash at the office"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                maxLength={255}
                className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-600/80 bg-amber-50 rounded-xl px-4 py-3 border border-amber-600/10">
            <CircleAlert className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold inter-font">
              This confirms the booking immediately — the slot is marked booked and the student is
              emailed their Zoom link once it's ready, no payment is collected through Stripe.
            </span>
          </div>

          <div className="flex gap-4 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetAll();
              }}
              className="flex-1 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 py-3 rounded-xl font-bold transition-all inter-font"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBooking}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-900/10 active:scale-95 transition-all inter-font disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isBooking && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isBooking ? "Booking..." : "Confirm Booking"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualBookingModal;
