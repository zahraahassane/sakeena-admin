import React, { useState } from "react";
import { Package, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useCreateConsultationBundleMutation,
  useUpdateConsultationBundleMutation,
  useDeleteConsultationBundleMutation,
} from "../../Api/adminApi";

const money = (n) => `$${Number(n).toFixed(2).replace(/\.00$/, "")}`;

const inputClass =
  "w-full bg-white border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-stone-800 inter-font";

/**
 * Bundle discounts for one consultation: a student who books at least
 * `num_sessions` sessions in one purchase gets `discount_percentage` off.
 * Works on an existing consultation (add, edit, delete), not just at creation.
 */
const BundleDiscounts = ({ consultation, rate }) => {
  const bundles = [...(consultation?.bundles || [])].sort(
    (a, b) => a.num_sessions - b.num_sessions,
  );

  const [createBundle, { isLoading: isCreating }] =
    useCreateConsultationBundleMutation();
  const [updateBundle, { isLoading: isUpdating }] =
    useUpdateConsultationBundleMutation();
  const [deleteBundle, { isLoading: isDeleting }] =
    useDeleteConsultationBundleMutation();

  // editingId: null = closed, "new" = adding, otherwise the bundle being edited
  const [editingId, setEditingId] = useState(null);
  const [sessions, setSessions] = useState("");
  const [discount, setDiscount] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const isSaving = isCreating || isUpdating;

  const openForm = (bundle) => {
    setConfirmDeleteId(null);
    if (bundle) {
      setEditingId(bundle.id);
      setSessions(String(bundle.num_sessions));
      setDiscount(String(Number(bundle.discount_percentage)));
    } else {
      setEditingId("new");
      setSessions("");
      setDiscount("");
    }
  };

  const closeForm = () => setEditingId(null);

  const handleSave = async () => {
    const n = Number(sessions);
    const d = Number(discount);
    if (!Number.isInteger(n) || n < 2) {
      toast.error("A bundle needs at least 2 sessions.");
      return;
    }
    if (!(d > 0 && d <= 100)) {
      toast.error("The discount must be more than 0 and at most 100.");
      return;
    }
    if (bundles.some((b) => b.num_sessions === n && b.id !== editingId)) {
      toast.error(`There is already a bundle for ${n} sessions.`);
      return;
    }
    const body = { num_sessions: n, discount_percentage: d };
    try {
      if (editingId === "new") {
        await createBundle({ consultationId: consultation.id, body }).unwrap();
        toast.success("Bundle discount added.");
      } else {
        await updateBundle({
          consultationId: consultation.id,
          id: editingId,
          body,
        }).unwrap();
        toast.success("Bundle discount updated.");
      }
      closeForm();
    } catch (err) {
      console.error("Failed to save bundle:", err);
      toast.error("Could not save the bundle discount. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBundle({ consultationId: consultation.id, id }).unwrap();
      toast.success("Bundle discount removed.");
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete bundle:", err);
      toast.error("Could not remove the bundle discount. Please try again.");
    }
  };

  // Live preview of what a student pays for the numbers typed in the form
  const previewSessions = Number(sessions);
  const previewDiscount = Number(discount);
  const showPreview =
    rate > 0 &&
    Number.isInteger(previewSessions) &&
    previewSessions >= 2 &&
    previewDiscount > 0 &&
    previewDiscount <= 100;

  return (
    <div className="px-6 pb-8 md:px-8">
      <div className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-600/20 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 arimo-font tracking-tight">
                Bundle discounts
              </h3>
              <p className="text-xs font-medium text-stone-500 inter-font">
                Students who book at least this many sessions in one purchase
                get the discount.
              </p>
            </div>
          </div>
          {editingId === null && (
            <button
              type="button"
              onClick={() => openForm(null)}
              className="flex items-center gap-1.5 shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add bundle
            </button>
          )}
        </div>

        {bundles.length === 0 && editingId === null && (
          <p className="text-sm font-medium text-stone-500 inter-font bg-white/60 rounded-xl border border-amber-600/10 p-4">
            No bundle discount yet. Students pay the standard price for every
            session.
          </p>
        )}

        <div className="space-y-3">
          {bundles.map((b) => {
            const pct = Number(b.discount_percentage);
            const full = rate * b.num_sessions;
            const total = full * (1 - pct / 100);
            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-amber-600/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-black text-stone-900 arimo-font">
                    {b.num_sessions}+ sessions, {pct}% off
                  </p>
                  {rate > 0 && (
                    <p className="text-sm font-medium text-stone-500 inter-font">
                      {b.num_sessions} sessions cost{" "}
                      <span className="font-bold text-amber-700">
                        {money(total)}
                      </span>{" "}
                      <span className="line-through text-stone-400">
                        {money(full)}
                      </span>
                    </p>
                  )}
                </div>
                {confirmDeleteId === b.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-600 inter-font">
                      Remove this bundle?
                    </span>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(b.id)}
                      className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-black uppercase tracking-widest"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openForm(b)}
                      className="p-2 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                      aria-label="Edit bundle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeForm();
                        setConfirmDeleteId(b.id);
                      }}
                      className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      aria-label="Delete bundle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {editingId !== null && (
          <div className="bg-white rounded-2xl border border-amber-600/20 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 inter-font">
                  Bundle Sessions
                </label>
                <input
                  type="number"
                  min="2"
                  placeholder="e.g. 5"
                  value={sessions}
                  onChange={(e) => setSessions(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 inter-font">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 10"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {showPreview && (
              <p className="text-sm font-medium text-stone-600 inter-font">
                {previewSessions} sessions would cost{" "}
                <span className="font-bold text-amber-700">
                  {money(rate * previewSessions * (1 - previewDiscount / 100))}
                </span>{" "}
                <span className="line-through text-stone-400">
                  {money(rate * previewSessions)}
                </span>
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-black uppercase tracking-widest"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save bundle"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleDiscounts;
