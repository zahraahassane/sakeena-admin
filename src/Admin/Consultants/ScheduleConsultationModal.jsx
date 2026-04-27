import React, { useMemo, useState } from "react";
import { X, Video, User, Package, DollarSign, CircleAlert } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetTeacherProfilesQuery,
  useCreateConsultationMutation,
  useCreateConsultationRecurringMutation,
  useCreateConsultationBundleMutation,
} from "../../Api/adminApi";

const ScheduleConsultationModal = ({ isOpen, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    teacherId: "",
    teacherName: "",
    teacherEmail: "",
    standardPrice: "",
    bundleSessions: "",
    discount: "",
    schedules: [
      { id: Date.now(), day: "", startTime: "", endTime: "", validFrom: "", validUntil: "" }
    ],
  });

  const { data: teacherData, isError: isTeacherError } =
    useGetTeacherProfilesQuery({ page: 1, offers_consultations: true });

  const [createConsultation, { isLoading: isCreatingConsultation }] =
    useCreateConsultationMutation();
  const [createConsultationRecurring, { isLoading: isCreatingRecurring }] =
    useCreateConsultationRecurringMutation();
  const [createConsultationBundle, { isLoading: isCreatingBundle }] =
    useCreateConsultationBundleMutation();
  const isSaving =
    isCreatingConsultation || isCreatingRecurring || isCreatingBundle;

  const teacherProfiles = useMemo(
    () => teacherData?.results || [],
    [teacherData],
  );

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const weekdayMap = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
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

  if (!isOpen) return null;

  const handleTeacherChange = (teacherId) => {
    const selectedTeacher = teacherProfiles.find(
      (teacher) => String(teacher.id) === String(teacherId),
    );
    setFormData({
      ...formData,
      teacherId,
      teacherName: selectedTeacher
        ? `${selectedTeacher.first_name || ""} ${selectedTeacher.last_name || ""}`.trim()
        : "",
      teacherEmail: selectedTeacher?.email || "",
    });
  };

  const resetForm = () => {
    setFormData({
      teacherId: "",
      teacherName: "",
      teacherEmail: "",
      standardPrice: "",
      bundleSessions: "",
      discount: "",
      schedules: [
        { id: Date.now(), day: "", startTime: "", endTime: "", validFrom: "", validUntil: "" }
      ],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teacherId) {
      toast.error("Please select a teacher.");
      return;
    }

    if (
      formData.schedules.some((s) => !s.day || !s.startTime || !s.endTime)
    ) {
      toast.error("Please select a recurring day and time for all schedules.");
      return;
    }

    try {
      const consultationBody = {
        teacher_id: Number(formData.teacherId),
      };
      if (formData.standardPrice) {
        consultationBody.standard_price = formData.standardPrice;
      }

      const consultation = await createConsultation(consultationBody).unwrap();
      
      const recurringPromises = formData.schedules.map((schedule) => {
        const recurringPayload = {
          weekday: weekdayMap[schedule.day],
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          session_duration_minutes: calculateDurationMinutes(
            schedule.startTime,
            schedule.endTime,
          ),
          valid_from: schedule.validFrom || new Date().toISOString().split("T")[0],
        };
        if (schedule.validUntil) {
          recurringPayload.valid_until = schedule.validUntil;
        }

        return createConsultationRecurring({
          consultationId: consultation.id,
          body: recurringPayload,
        }).unwrap();
      });

      const recurrings = await Promise.all(recurringPromises);

      let bundle = null;
      if (formData.bundleSessions) {
        const bundleBody = {
          num_sessions: Number(formData.bundleSessions),
        };
        if (formData.discount) {
          bundleBody.discount_percentage = Number(formData.discount);
        }
        bundle = await createConsultationBundle({
          consultationId: consultation.id,
          body: bundleBody,
        }).unwrap();
      }

      onSchedule({ consultation, recurring: recurrings[0], bundle });
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to schedule consultation:", error);
      toast.error("Unable to schedule consultation. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-stone-200/20 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-greenTeal" />
            </div>
            <h2 className="text-xl font-black text-stone-900 arimo-font">
              Schedule New Consultation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-50 rounded-xl transition-all text-stone-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar"
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
              <User className="w-4 h-4 text-stone-400" />
              Select Teacher <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.teacherId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font appearance-none"
            >
              <option value="">Choose a teacher...</option>
              {isTeacherError && (
                <option value="" disabled>
                  Failed to load teachers
                </option>
              )}
              {teacherProfiles.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {`${teacher.user.first_name || ""} ${teacher.user.last_name || ""}`.trim()}{" "}
                  ({teacher.user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 inter-font">
                <DollarSign className="w-4 h-4 text-stone-400" />
                Standard Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 45.00"
                value={formData.standardPrice}
                onChange={(e) =>
                  setFormData({ ...formData, standardPrice: e.target.value })
                }
                className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
              />
              <p className="text-[11px] text-stone-400">
                Optional. Leave empty to use the default teacher rate.
              </p>
            </div>
            {/* <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 inter-font">
                Teacher Email
              </label>
              <input
                type="email"
                value={formData.teacherEmail}
                readOnly
                className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none text-stone-600 inter-font"
              />
            </div> */}
          </div>

          {formData.schedules.map((schedule, index) => (
            <div key={schedule.id} className="p-6 bg-teal-50/20 rounded-2xl border-2 border-teal-500/30 space-y-6 relative group">
              {formData.schedules.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newSchedules = formData.schedules.filter(s => s.id !== schedule.id);
                    setFormData({ ...formData, schedules: newSchedules });
                  }}
                  className="absolute right-4 top-4 p-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove this schedule"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <h3 className="text-sm font-black text-teal-800 tracking-wider">Schedule #{index + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 inter-font">
                    Select Day <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={schedule.day}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].day = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font appearance-none"
                  >
                    <option value="">Choose day...</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 inter-font">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={schedule.startTime}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].startTime = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 inter-font">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={schedule.endTime}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].endTime = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 inter-font">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={schedule.validFrom}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].validFrom = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 inter-font">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={schedule.validUntil}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].validUntil = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="w-full bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                schedules: [
                  ...formData.schedules,
                  { id: Date.now(), day: "", startTime: "", endTime: "", validFrom: "", validUntil: "" }
                ]
              });
            }}
            className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-teal-200 rounded-2xl text-teal-600 font-bold hover:bg-teal-50/50 hover:border-teal-400 transition-all"
          >
            <span>+ Add Another Schedule</span>
          </button>

          <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-600/20 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 inter-font">
                  Bundle Sessions
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={formData.bundleSessions}
                  onChange={(e) =>
                    setFormData({ ...formData, bundleSessions: e.target.value })
                  }
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-stone-800 inter-font"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 inter-font">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 10"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: e.target.value })
                  }
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-stone-800 inter-font"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/60 p-3 rounded-xl border border-amber-600/10">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase">
                  Expected Bundle Rate
                </span>
                <span className="text-lg font-black text-stone-800 arimo-font">
                  $
                  {formData.standardPrice
                    ? (
                        Number(formData.standardPrice) -
                        (Number(formData.standardPrice) *
                          Number(formData.discount || 0)) /
                          100
                      ).toFixed(2)
                    : "0.00"}{" "}
                  /hr
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-amber-600/60">
              <CircleAlert className="w-4 h-4" />
              <span className="text-[11px] font-bold inter-font uppercase tracking-wider">
                Optional bundle settings for recurring consultations
              </span>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 py-3 rounded-xl font-bold transition-all inter-font"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-900/10 active:scale-95 transition-all inter-font"
            >
              Schedule Consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleConsultationModal;
