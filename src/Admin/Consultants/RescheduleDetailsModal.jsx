import React from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  useAcceptRescheduleRequestMutation,
  useDeclineRescheduleRequestMutation
} from "../../Api/adminApi";
import { toast } from "react-hot-toast";

const RescheduleDetailsModal = ({ isOpen, onClose, request }) => {
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptRescheduleRequestMutation();
  const [declineRequest, { isLoading: isDeclining }] = useDeclineRescheduleRequestMutation();

  const isLoading = isAccepting || isDeclining;

  if (!isOpen || !request) return null;

  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(includeTime && { hour: "2-digit", minute: "2-digit" })
    });
  };

  const handleAction = async (action) => {
    try {
      if (action === 'accept') {
        await acceptRequest(request.id).unwrap();
        toast.success(`Request accepted successfully`);
      } else {
        await declineRequest(request.id).unwrap();
        toast.success(`Request declined successfully`);
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.detail || `Failed to ${action} request`);
    }
  };

  const statusColors = {
    pending: "text-amber-600 bg-amber-50 border-amber-100",
    accepted: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rejected: "text-rose-600 bg-rose-50 border-rose-100"
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-stone-100 shadow-sm">
              <Clock className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 arimo-font">Reschedule Request</h2>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-widest inter-font">Request ID: #{request.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200/50 rounded-xl transition-all text-stone-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Status and Student */}
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Student Information</span>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.25rem] bg-stone-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <User className="w-7 h-7 text-stone-400" />
                </div>
                <div>
                  <p className="text-lg font-black text-stone-900 leading-none mb-1">{request.student_email}</p>
                  <p className="text-xs text-stone-400 inter-font font-medium italic">Sent on {formatDate(request.created_at)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 sm:text-right">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Current Status</span>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-sm uppercase tracking-wider ${statusColors[request.status] || statusColors.pending}`}>
                {request.status === 'accepted' && <CheckCircle2 className="w-4 h-4" />}
                {request.status === 'rejected' && <XCircle className="w-4 h-4" />}
                {request.status === 'pending' && <AlertCircle className="w-4 h-4" />}
                {request.status}
              </div>
            </div>
          </div>

          {/* Slots Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Connector Arrow for desktop */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-stone-100 text-stone-300 items-center justify-center shadow-sm">
              <ArrowRight className="w-5 h-5" />
            </div>

            <div className="bg-stone-50 rounded-[2rem] p-6 border border-stone-100 flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100">
                <Calendar className="w-6 h-6 text-stone-400" />
              </div>
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Old Slot</span>
                <p className="text-sm font-bold text-stone-700">{formatDate(request.old_slot_time)}</p>
              </div>
            </div>

            <div className="bg-teal-50/30 rounded-[2rem] p-6 border border-teal-100 flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-teal-100">
                <Clock className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest block mb-1">Requested Slot</span>
                <p className="text-sm font-black text-teal-900">{formatDate(request.requested_slot_time)}</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Reason for Reschedule</span>
            <div className="bg-stone-50 border border-stone-100 rounded-[2rem] p-6 italic hover:bg-stone-100 transition-colors cursor-default">
              <p className="text-stone-600 leading-relaxed text-sm inter-font">
                &ldquo;{request.reason || "No reason provided."}&rdquo;
              </p>
            </div>
          </div>

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                disabled={isLoading}
                onClick={() => handleAction('decline')}
                className="flex-1 px-8 py-4 bg-white border-2 border-stone-200 text-stone-600 rounded-[1.5rem] font-bold hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Decline Request
              </button>
              <button
                disabled={isLoading}
                onClick={() => handleAction('accept')}
                className="flex-1 px-8 py-4 bg-stone-900 text-white rounded-[1.5rem] font-bold hover:bg-teal-700 transition-all shadow-xl shadow-stone-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? "Processing..." : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Accept Request
                  </>
                )}
              </button>
            </div>
          )}

          {request.status !== 'pending' && (
            <div className="pt-4 text-center">
              <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
                This request was {request.status} on {formatDate(request.updated_at)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleDetailsModal;
