import React, { useEffect, useMemo, useState } from "react";
import { X, CalendarClock, Loader2, CircleAlert } from "lucide-react";
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

  const bookedSlots = useMemo(() => booking?.booked_slots || [], [booking]);

  useEffect(() => {
    if (isOpen) {
      setOldSlotId(bookedSlots.length === 1 ? String(bookedSlots[0].id) : "");
      setDay("");
      setNewSlotId(null);
      setReason("");
    }
  }, [isOpen, bookedSlots]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!oldSlotId) return toast.error("Choose the session to move.");
    if (!newSlotId) return toast.error("Choose the new date and time.");
    try {
      await reschedule({
        id: booking.id,
        body: {
          old_slot_id: Number(oldSlotId),
          new_slot_id: newSlotId,
          reason: reason.trim(),
        },
      }).unwrap();
      toast.success("Session rescheduled. The student has been emailed.");
      onClose();
    } catch (err) {
      toast.error(err?.data?.error || "Unable to reschedule this session. Please try again.");
    }
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
                    onClick={() => setNewSlotId(s.id)}
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
              disabled={isLoading || !oldSlotId || !newSlotId}
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
