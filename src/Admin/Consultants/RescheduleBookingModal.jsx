import React, { useEffect, useMemo, useState } from "react";
import { X, CalendarClock, Loader2, CircleAlert, CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetRescheduleOptionsQuery,
  useRescheduleConsultationPurchaseMutation,
} from "../../Api/adminApi";

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const slotLabel = (slot) =>
  `${new Date(slot.scheduled_start).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;

/**
 * Admin moves one session of a booking to another free slot, without a student
 * request. Same effect as accepting a reschedule request: old Zoom meeting and
 * calendar event removed, new ones created, student emailed.
 */
const RescheduleBookingModal = ({ isOpen, onClose, booking }) => {
  const [oldSlotId, setOldSlotId] = useState("");
  const [day, setDay] = useState("");
  const [newSlotId, setNewSlotId] = useState(null);
  const [reason, setReason] = useState("");
  // Custom time, for when no free slot exists at the time the admin needs.
  const [customStart, setCustomStart] = useState("");
  const [customDuration, setCustomDuration] = useState("60");
  const [conflicts, setConflicts] = useState(null);

  const bookedSlots = useMemo(() => booking?.booked_slots || [], [booking]);

  useEffect(() => {
    if (isOpen) {
      setOldSlotId(bookedSlots.length === 1 ? String(bookedSlots[0].id) : "");
      setDay("");
      setNewSlotId(null);
      setReason("");
      setCustomStart("");
      setCustomDuration("60");
      setConflicts(null);
    }
  }, [isOpen, bookedSlots]);

  // Default the custom duration to the length of the session being moved.
  useEffect(() => {
    const moving = bookedSlots.find((s) => String(s.id) === String(oldSlotId));
    if (moving) {
      const minutes = Math.round(
        (new Date(moving.scheduled_end) - new Date(moving.scheduled_start)) / 60000,
      );
      if (minutes >= 15 && minutes <= 480) setCustomDuration(String(minutes));
    }
  }, [oldSlotId, bookedSlots]);

  const { data: options, isFetching } = useGetRescheduleOptionsQuery(booking?.id, {
    skip: !isOpen || !booking,
  });
  const [reschedule, { isLoading }] = useRescheduleConsultationPurchaseMutation();

  const days = useMemo(() => {
    const map = new Map();
    (options || []).forEach((s) => {
      const k = dayKey(s.scheduled_start);
      if (!map.has(k)) map.set(k, { key: k, label: dayLabel(s.scheduled_start), slots: [] });
      map.get(k).slots.push(s);
    });
    return [...map.values()];
  }, [options]);

  const slotsForDay = days.find((d) => d.key === day)?.slots || [];
  const newSlot = (options || []).find((s) => s.id === newSlotId);

  if (!isOpen || !booking) return null;

  const durationOptions = [...new Set([30, 45, 60, 90, 120, Number(customDuration)])].sort(
    (a, b) => a - b,
  );
  const hasNewTime = !!newSlotId || !!customStart;

  const submit = async (allowOverlap = false) => {
    if (!oldSlotId) return toast.error("Choose the session to move.");
    if (!hasNewTime) return toast.error("Choose a new time.");
    if (customStart && new Date(customStart) <= new Date()) {
      return toast.error("The new time must be in the future.");
    }
    const body = { old_slot_id: Number(oldSlotId), reason: reason.trim() };
    if (customStart) {
      body.custom_start = new Date(customStart).toISOString();
      body.custom_duration_minutes = Number(customDuration);
      if (allowOverlap) body.allow_overlap = true;
    } else {
      body.new_slot_id = newSlotId;
    }
    try {
      await reschedule({ id: booking.id, body }).unwrap();
      toast.success("Session rescheduled. The student has been emailed.");
      onClose();
    } catch (err) {
      if (err?.status === 409 && err?.data?.conflicts) {
        setConflicts(err.data.conflicts);
        return;
      }
      toast.error(err?.data?.error || "Unable to reschedule this session. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConflicts(null);
    submit(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-stone-200/20 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-greenTeal" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 arimo-font">Reschedule Session</h2>
              <p className="text-xs text-stone-400 inter-font">
                {booking.customer.name} with {booking.consultant.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-xl transition-all text-stone-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              Session to move
            </label>
            <select
              value={oldSlotId}
              onChange={(e) => setOldSlotId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 inter-font"
            >
              <option value="">Select a session</option>
              {bookedSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {slotLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              New date
            </label>
            {isFetching ? (
              <div className="flex items-center gap-2 text-sm text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading available times...
              </div>
            ) : days.length === 0 ? (
              <p className="text-sm text-stone-500 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
                No free upcoming slots for this consultation. Add availability first, then come back.
              </p>
            ) : (
              <select
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  setNewSlotId(null);
                  setCustomStart("");
                  setConflicts(null);
                }}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 inter-font"
              >
                <option value="">Select a date</option>
                {days.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label} ({d.slots.length} free)
                  </option>
                ))}
              </select>
            )}
          </div>

          {day && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                New time
              </label>
              <div className="flex flex-wrap gap-2">
                {slotsForDay.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setNewSlotId(s.id);
                      setCustomStart("");
                      setConflicts(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      newSlotId === s.id
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-stone-600 border-stone-200 hover:border-teal-300"
                    }`}
                  >
                    {timeLabel(s.scheduled_start)} to {timeLabel(s.scheduled_end)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-400">Times are in your timezone ({timeZone}).</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
              <CalendarPlus className="w-3.5 h-3.5" />
              Or a custom date and time
            </label>
            <div className="bg-stone-50/60 border border-stone-200 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] text-stone-400">
                Use this when the time you need is not in the list. If a free slot already exists at
                exactly this time, that one is used. Otherwise a new session is created. Times are in
                your timezone ({timeZone}).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setConflicts(null);
                    if (e.target.value) {
                      setNewSlotId(null);
                      setDay("");
                    }
                  }}
                  className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 transition-all text-sm font-medium text-stone-800 inter-font"
                />
                <select
                  value={customDuration}
                  onChange={(e) => {
                    setCustomDuration(e.target.value);
                    setConflicts(null);
                  }}
                  className="sm:w-36 bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 transition-all text-sm font-medium text-stone-800 inter-font"
                >
                  {durationOptions.map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {conflicts && (
            <div className="rounded-xl px-4 py-3 border border-red-200 bg-red-50 space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <CircleAlert className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold inter-font">
                  This time overlaps sessions this teacher already has:
                </span>
              </div>
              <ul className="text-xs text-red-700 inter-font list-disc pl-10">
                {conflicts.map((c) => (
                  <li key={c.id}>
                    {c.consultation}, {slotLabel({ scheduled_start: c.start })} to {timeLabel(c.end)}{" "}
                    ({c.is_booked ? "booked" : "open slot, stays open"})
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => submit(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all inter-font disabled:opacity-50"
              >
                Reschedule anyway
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Kept on the record, not shown to the student"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm inter-font"
            />
          </div>

          <div className="flex items-start gap-2 text-amber-600/80 bg-amber-50 rounded-xl px-4 py-3 border border-amber-600/10">
            <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-[11px] font-bold inter-font">
              {newSlot
                ? `The session moves to ${slotLabel(newSlot)}. `
                : customStart
                  ? `The session moves to ${slotLabel({ scheduled_start: customStart })} (${customDuration} min). `
                  : "The session moves to the time you pick. "}
              The old Zoom meeting is removed, a new one is created, and the student is emailed.
            </span>
          </div>

          <div className="flex gap-4 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 py-3 rounded-xl font-bold transition-all inter-font"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading || !oldSlotId || !hasNewTime}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-900/10 active:scale-95 transition-all inter-font disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? "Rescheduling..." : "Reschedule"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleBookingModal;
