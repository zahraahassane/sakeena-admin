import React, { useEffect, useState } from "react";
import { X, Search, Loader2, User, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetStudentProfilesQuery,
  useEnrollStudentMutation,
} from "../../Api/adminApi";

const EnrollStudentModal = ({ courseId, onClose }) => {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching } = useGetStudentProfilesQuery({ search: debounced });
  const [enrollStudent, { isLoading: isEnrolling }] = useEnrollStudentMutation();

  const students = data?.results || [];

  const handleEnroll = async () => {
    if (!selected) return;
    try {
      await enrollStudent({ courseId, userId: selected.user.id }).unwrap();
      toast.success(`${selected.user.first_name} ${selected.user.last_name} enrolled`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.detail ||
          err?.data?.user_id?.[0] ||
          err?.data?.course_id?.[0] ||
          "Failed to enroll student"
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-teal-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Enroll a Student</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-teal-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-500">
            Grants full, permanent access without a payment. The student is
            notified.
          </p>
          <div className="relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="max-h-72 overflow-y-auto border border-stone-100 rounded-2xl divide-y divide-stone-100">
            {isFetching ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-center text-sm text-stone-500 py-10">
                No students found
              </p>
            ) : (
              students.map((s) => {
                const isSelected = selected?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelected(s)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? "bg-teal-50" : "hover:bg-stone-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                      {s.profile_picture ? (
                        <img
                          src={s.profile_picture}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-stone-900 truncate">
                        {s.user.first_name} {s.user.last_name}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {s.user.email}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEnroll}
              disabled={!selected || isEnrolling}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isEnrolling && <Loader2 className="w-4 h-4 animate-spin" />}
              Enroll
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudentModal;
