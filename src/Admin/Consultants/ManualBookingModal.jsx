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
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";
import {
  useGetConsultationsQuery,
  useGetStudentProfilesQuery,
  useGetConsultationCalendarQuery,
  useGetConsultationTimeslotsQuery,
  useManualBookConsultationMutation,
} from "../../Api/adminApi";

const ManualBookingModal = ({ isOpen, onClose }) => {
  const [consultationSearch, setConsultationSearch] = useState("");
  // The whole picked plan is kept, not just its id, so searching again in the
  // picker never drops the selection.
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null); // { id, name, email }

  const [calendarDate, setCalendarDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);

  // One-off times typed in by the admin when no timeslot exists for them.
  const [customSlots, setCustomSlots] = useState([]); // { start: "YYYY-MM-DDTHH:mm", duration: number }
  const [customStart, setCustomStart] = useState("");
  const [customDuration, setCustomDuration] = useState("60");
  const [conflicts, setConflicts] = useState(null); // set when the teacher is already booked then

  const [priceOverride, setPriceOverride] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const resetAll = () => {
    setConsultationSearch("");
    setSelectedConsultation(null);
    setStudentSearch("");
    setSelectedStudent(null);
    setSelectedDate(null);
    setSelectedSlotIds([]);
    setCustomSlots([]);
    setCustomStart("");
    setCustomDuration("60");
    setConflicts(null);
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

  const totalSessions = selectedSlotIds.length + customSlots.length;
  const estimatedPrice =
    selectedConsultation && totalSessions
      ? (Number(selectedConsultation.standard_price || 0) * totalSessions).toFixed(2)
      : "0.00";

  const formatCustomStart = (value) =>
    new Date(value).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const addCustomSlot = () => {
    if (!customStart) {
      toast.error("Choose a date and time first.");
      return;
    }
    if (new Date(customStart) <= new Date()) {
      toast.error("The session must start in the future.");
      return;
    }
    if (customSlots.some((c) => c.start === customStart)) {
      toast.error("That time is already added.");
      return;
    }
    setCustomSlots((prev) => [...prev, { start: customStart, duration: Number(customDuration) }]);
    setCustomStart("");
    setConflicts(null);
  };

  const removeCustomSlot = (start) => {
    setCustomSlots((prev) => prev.filter((c) => c.start !== start));
    setConflicts(null);
  };

  const submitBooking = async (allowOverlap = false) => {

    if (!selectedConsultation) {
      toast.error("Please select a consultation plan.");
      return;
    }
    if (!selectedStudent) {
      toast.error("Please select a student.");
      return;
    }
    if (totalSessions === 0) {
      toast.error("Please select a timeslot or add a custom date and time.");
      return;
    }

    const body = {
      student_id: selectedStudent.id,
      timeslot_ids: selectedSlotIds,
      custom_slots: customSlots.map((c) => ({
        start: new Date(c.start).toISOString(),
        duration_minutes: c.duration,
      })),
    };
    if (allowOverlap) body.allow_overlap = true;
    if (priceOverride !== "") {
      body.total_price_paid = priceOverride;
    }
    if (paymentReference.trim()) {
      body.payment_reference = paymentReference.trim();
    }

    try {
      await manualBookConsultation({ id: selectedConsultation.id, body }).unwrap();
      toast.success(`Booked ${totalSessions} session(s) for ${selectedStudent.name}.`);
      onClose();
      resetAll();
    } catch (error) {
      if (error?.status === 409 && error?.data?.conflicts) {
        setConflicts(error.data.conflicts);
        return;
      }
      console.error("Failed to manually book consultation:", error);
      const detail =
        error?.data?.error ||
        error?.data?.non_field_errors?.[0] ||
        error?.data?.custom_slots?.[0]?.start?.[0];
      toast.error(detail || "Unable to book this consultation. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConflicts(null);
    submitBooking(false);
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
            <SearchableSelect
              options={consultations.map((c) => {
                const teacherName =
                  `${c.teacher?.user?.first_name || ""} ${c.teacher?.user?.last_name || ""}`.trim() ||
                  c.teacher?.user?.email;
                return {
                  value: String(c.id),
                  label: c.title,
                  description: `${teacherName}${c.standard_price ? ` · $${c.standard_price}` : ""}`,
                };
              })}
              selected={
                selectedConsultation
                  ? { value: String(selectedConsultation.id), label: selectedConsultation.title }
                  : null
              }
              onSelect={(option) => {
                setSelectedConsultation(
                  consultations.find((c) => String(c.id) === option.value) || null,
                );
                setSelectedDate(null);
                setSelectedSlotIds([]);
                setConflicts(null);
              }}
              search={consultationSearch}
              onSearchChange={setConsultationSearch}
              isLoading={isFetchingConsultations}
              placeholder="Choose a consultation plan..."
              searchPlaceholder="Search by title, teacher name or email..."
              emptyText="No consultation plans found"
            />
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
            <SearchableSelect
              options={studentProfiles.map((p) => ({
                value: String(p.user.id),
                label:
                  `${p.user.first_name || ""} ${p.user.last_name || ""}`.trim() || "Unnamed",
                description: p.user.email,
              }))}
              selected={
                selectedStudent
                  ? { value: String(selectedStudent.id), label: selectedStudent.name }
                  : null
              }
              onSelect={(option) => {
                const profile = studentProfiles.find((p) => String(p.user.id) === option.value);
                if (!profile) return;
                setSelectedStudent({
                  id: profile.user.id,
                  name: option.label === "Unnamed" ? profile.user.email : option.label,
                  email: profile.user.email,
                });
              }}
              search={studentSearch}
              onSearchChange={setStudentSearch}
              isLoading={isFetchingStudents}
              placeholder="Choose a student..."
              searchPlaceholder="Search students by name or email..."
              emptyText="No students found"
            />
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
                      const isAvailable = status === "available" || status === "too_soon"; // admins may book inside the notice window
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

          {/* Custom date and time, for when no timeslot exists */}
          {selectedConsultation && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
                <CalendarPlus className="w-4 h-4 text-stone-400" />
                Custom Date &amp; Time
                {customSlots.length > 0 && (
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg ml-auto">
                    {customSlots.length} added
                  </span>
                )}
              </label>
              <div className="bg-stone-50/60 border border-stone-200 rounded-2xl p-4 space-y-3">
                <p className="text-[11px] text-stone-400">
                  Use this when the time you need is not in the list above. A new session is
                  created at exactly this time. Times are in your timezone ({timeZone}).
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="datetime-local"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 transition-all text-sm font-medium text-stone-800 inter-font"
                  />
                  <select
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="sm:w-36 bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 transition-all text-sm font-medium text-stone-800 inter-font"
                  >
                    {[30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addCustomSlot}
                    className="flex items-center justify-center gap-1.5 bg-white border border-teal-500 text-teal-700 hover:bg-teal-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all inter-font"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {customSlots.length > 0 && (
                  <div className="space-y-2">
                    {customSlots.map((c) => (
                      <div
                        key={c.start}
                        className="flex items-center justify-between bg-white border border-teal-500 rounded-xl px-3 py-2.5"
                      >
                        <span className="text-sm font-bold text-stone-800 inter-font">
                          {formatCustomStart(c.start)}
                          <span className="text-stone-400 font-medium"> · {c.duration} min</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCustomSlot(c.start)}
                          aria-label="Remove custom time"
                          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

          {conflicts && (
            <div className="rounded-xl px-4 py-3 border border-red-200 bg-red-50 space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <CircleAlert className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold inter-font">
                  The teacher already has a booked session at this time:
                </span>
              </div>
              <ul className="text-xs text-red-700 inter-font list-disc pl-10">
                {conflicts.map((c) => (
                  <li key={c.id}>
                    {c.consultation}, {formatCustomStart(c.start)} to{" "}
                    {new Date(c.end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isBooking}
                onClick={() => submitBooking(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all inter-font disabled:opacity-50"
              >
                Book anyway
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-amber-600/80 bg-amber-50 rounded-xl px-4 py-3 border border-amber-600/10">
            <CircleAlert className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold inter-font">
              This confirms the booking immediately: the slot is marked booked and the student is
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
