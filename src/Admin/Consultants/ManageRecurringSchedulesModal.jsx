import React, { useState, useEffect } from "react";
import { X, Clock, Edit2, Trash2, Calendar, Loader2, Save, Plus } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetConsultationRecurringsQuery,
  useUpdateConsultationRecurringMutation,
  useDeleteConsultationRecurringMutation,
  useCreateConsultationRecurringMutation,
} from "../../Api/adminApi";

const ManageRecurringSchedulesModal = ({ isOpen, onClose, consultation }) => {
  if (!isOpen || !consultation) return null;

  const { data: recurringsData, isLoading, refetch } = useGetConsultationRecurringsQuery(consultation.id, { skip: !isOpen || !consultation });
  
  const [updateRecurring, { isLoading: isUpdating }] = useUpdateConsultationRecurringMutation();
  const [deleteRecurring, { isLoading: isDeleting }] = useDeleteConsultationRecurringMutation();
  const [createRecurring, { isLoading: isCreating }] = useCreateConsultationRecurringMutation();

  const recurrings = Array.isArray(recurringsData) ? recurringsData : recurringsData?.results || [];

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekdayMap = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const calculateDurationMinutes = (start, end) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date();
    endDate.setHours(endH, endM, 0, 0);
    const diff = (endDate - startDate) / 60000;
    return diff > 0 ? diff : 0;
  };

  const startEdit = (rec) => {
    setEditingId(rec.id);
    setIsAddingNew(false);
    setEditFormData({
      weekday: rec.weekday,
      start_time: rec.start_time,
      end_time: rec.end_time,
      valid_from: rec.valid_from,
      valid_until: rec.valid_until || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setEditFormData({});
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editFormData.start_time || !editFormData.end_time || editFormData.weekday === undefined) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        weekday: editFormData.weekday,
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        session_duration_minutes: calculateDurationMinutes(editFormData.start_time, editFormData.end_time),
        valid_from: editFormData.valid_from,
        valid_until: editFormData.valid_until || null,
      };

      if (isAddingNew) {
        await createRecurring({
          consultationId: consultation.id,
          body: payload,
        }).unwrap();
        toast.success("Schedule created successfully");
      } else {
        await updateRecurring({
          consultationId: consultation.id,
          id: editingId,
          body: payload,
        }).unwrap();
        toast.success("Schedule updated successfully");
      }
      cancelEdit();
      refetch();
    } catch (err) {
      toast.error(isAddingNew ? "Failed to create schedule" : "Failed to update schedule");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteRecurring({ consultationId: consultation.id, id }).unwrap();
        toast.success("Schedule deleted");
        refetch();
      } catch (err) {
        toast.error("Failed to delete schedule");
      }
    }
  };

  const formatTimeStr = (timeStr) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-stone-50 rounded-[2rem] shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-zinc-900 arimo-font">
              Manage Recurring Schedules
            </h2>
            <p className="text-stone-500 text-sm inter-font">
              {consultation.title || `${consultation.teacher?.user?.first_name}'s Plan`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-all text-stone-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-widest inter-font flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-500" />
              Existing Schedules
            </h3>
            {!isAddingNew && !editingId && (
              <button 
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingId("new");
                  setEditFormData({
                    weekday: 0,
                    start_time: "",
                    end_time: "",
                    valid_from: new Date().toISOString().split("T")[0],
                    valid_until: "",
                  });
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Schedule
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {isAddingNew && (
                <form onSubmit={handleUpdate} className="bg-white border-2 border-teal-500/20 p-5 rounded-2xl space-y-4 shadow-sm mb-6">
                  <h4 className="text-sm font-bold text-teal-700 inter-font">Create New Schedule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500">Day <span className="text-red-500">*</span></label>
                      <select 
                        required
                        value={editFormData.weekday} 
                        onChange={(e) => setEditFormData({ ...editFormData, weekday: parseInt(e.target.value) })}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                      >
                        {days.map((day, idx) => (
                          <option key={day} value={idx}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500">Start Time <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="time" 
                        value={editFormData.start_time} 
                        onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500">End Time <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="time" 
                        value={editFormData.end_time} 
                        onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500">Valid From <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="date" 
                        value={editFormData.valid_from} 
                        onChange={(e) => setEditFormData({ ...editFormData, valid_from: e.target.value })}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-stone-500">Valid Until</label>
                      <input 
                        type="date" 
                        value={editFormData.valid_until} 
                        onChange={(e) => setEditFormData({ ...editFormData, valid_until: e.target.value })}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={cancelEdit} className="px-4 py-2 text-sm font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isCreating} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors disabled:opacity-50">
                      {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Create Schedule
                    </button>
                  </div>
                </form>
              )}

              {recurrings.length === 0 && !isAddingNew ? (
                <div className="py-10 text-center text-stone-400 bg-white border border-dashed border-stone-200 rounded-2xl">
                  No recurring schedules found for this consultation.
                </div>
              ) : (
                recurrings.map(rec => (
                  <div key={rec.id} className="bg-white border border-stone-100 p-5 rounded-2xl shadow-sm hover:border-teal-100 transition-colors">
                    {editingId === rec.id && !isAddingNew ? (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500">Day <span className="text-red-500">*</span></label>
                            <select 
                              required
                              value={editFormData.weekday} 
                              onChange={(e) => setEditFormData({ ...editFormData, weekday: parseInt(e.target.value) })}
                              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                            >
                              {days.map((day, idx) => (
                                <option key={day} value={idx}>{day}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500">Start Time <span className="text-red-500">*</span></label>
                            <input 
                              required
                              type="time" 
                              value={formatTimeStr(editFormData.start_time)} 
                              onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500">End Time <span className="text-red-500">*</span></label>
                            <input 
                              required
                              type="time" 
                              value={formatTimeStr(editFormData.end_time)} 
                              onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500">Valid From <span className="text-red-500">*</span></label>
                            <input 
                              required
                              type="date" 
                              value={editFormData.valid_from} 
                              onChange={(e) => setEditFormData({ ...editFormData, valid_from: e.target.value })}
                              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-bold text-stone-500">Valid Until</label>
                            <input 
                              type="date" 
                              value={editFormData.valid_until || ""} 
                              onChange={(e) => setEditFormData({ ...editFormData, valid_until: e.target.value })}
                              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-stone-50">
                          <button type="button" onClick={cancelEdit} className="px-4 py-2 text-sm font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors">
                            Cancel
                          </button>
                          <button type="submit" disabled={isUpdating} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors disabled:opacity-50">
                            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Save className="w-4 h-4" /> Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 font-bold shrink-0">
                              {rec.weekday_display?.substring(0, 3) || days[rec.weekday]?.substring(0, 3)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-stone-800">{rec.weekday_display || days[rec.weekday]}</h4>
                              <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatTimeStr(rec.start_time)} - {formatTimeStr(rec.end_time)}</span>
                                <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-400 font-medium">
                                  {rec.session_duration_minutes}m
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-bold text-stone-400 bg-stone-50/50 p-2 rounded-lg inline-flex">
                            <span>From: {rec.valid_from}</span>
                            <span>Until: {rec.valid_until || "Ongoing"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => startEdit(rec)}
                            disabled={editingId !== null}
                            className="p-2 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-stone-400"
                            title="Edit schedule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(rec.id)}
                            disabled={isDeleting || editingId !== null}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-stone-400"
                            title="Delete schedule"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageRecurringSchedulesModal;
