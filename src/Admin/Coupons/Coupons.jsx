import React, { useState, useEffect } from "react";
import {
  useGetCouponsQuery,
  useAddCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Ticket,
  Edit2,
  Trash2,
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const CouponModal = ({ isOpen, onClose, coupon, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    is_active: true,
    expires_at: "",
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || "",
        discount_type: coupon.discount_type || "percentage",
        discount_value: coupon.discount_value || "",
        is_active: coupon.is_active !== undefined ? coupon.is_active : true,
        expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
      });
    } else {
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        is_active: true,
        expires_at: "",
      });
    }
  }, [coupon, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-neutral-900 arimo-font">
              {coupon ? "Edit Coupon" : "Create Coupon"}
            </h2>
            <p className="text-xs font-bold text-[#7AA4A5] uppercase tracking-widest mt-1">
              {coupon ? "Update coupon details" : "Add a new discount code"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-xl transition-colors"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-neutral-700 uppercase tracking-widest mb-2">
                Coupon Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g. SUMMER50"
                className="w-full px-5 py-3.5 bg-gray-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#7AA4A5]/10 focus:border-[#7AA4A5] transition-all font-bold text-sm uppercase"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-neutral-700 uppercase tracking-widest mb-2">
                  Type *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_type: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#7AA4A5]/10 focus:border-[#7AA4A5] transition-all font-bold text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-neutral-700 uppercase tracking-widest mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#7AA4A5]/10 focus:border-[#7AA4A5] transition-all font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-neutral-700 uppercase tracking-widest mb-2">
                Expiry Date (UTC)
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
                className="w-full px-5 py-3.5 bg-gray-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#7AA4A5]/10 focus:border-[#7AA4A5] transition-all font-bold text-sm"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))
                }
                className={`w-12 h-6 rounded-full transition-all relative ${
                  formData.is_active ? "bg-[#7AA4A5]" : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                    formData.is_active ? "translate-x-6" : "translate-x-0"
                  } left-1`}
                />
              </button>
              <span className="text-sm font-bold text-neutral-600">
                {formData.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-black/5 text-neutral-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3.5 bg-[#7AA4A5] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#7AA4A5]/20 hover:bg-[#6A9495] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {coupon ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Coupons = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading, isError } = useGetCouponsQuery({
    page: currentPage,
    search: debouncedSearch,
  });

  const [addCoupon, { isLoading: isAdding }] = useAddCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const handleToggleStatus = async (coupon) => {
    try {
      await updateCoupon({
        id: coupon.id,
        body: { is_active: !coupon.is_active },
      }).unwrap();
      toast.success(`Coupon ${coupon.is_active ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon.id, body: formData }).unwrap();
        toast.success("Coupon updated successfully");
      } else {
        await addCoupon(formData).unwrap();
        toast.success("Coupon created successfully");
      }
      setIsModalOpen(false);
      setEditingCoupon(null);
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = (id) => {
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1 arimo-font">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800">Confirm Delete</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Are you sure you want to remove this coupon?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  await deleteCoupon(id).unwrap();
                  toast.success("Coupon deleted");
                } catch (err) {
                  toast.error("Failed to delete");
                }
                toast.dismiss(t.id);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
        style: {
          minWidth: "400px",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.05)",
        },
      }
    );
  };

  const coupons = data?.results || [];

  return (
    <div className="p-8 space-y-8 min-h-screen arimo-font bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-neutral-900 leading-tight arimo-font">
            Coupon Management
          </h1>
          <p className="text-xs font-bold text-[#7AA4A5] uppercase tracking-[0.2em] mt-1">
            Create and manage discount codes for your platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative group w-full sm:w-72 lg:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#7AA4A5] transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-black/5 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#7AA4A5]/10 focus:border-[#7AA4A5] transition-all text-sm font-medium placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setEditingCoupon(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#7AA4A5] hover:bg-[#6A8F8F] text-white px-8 py-3 rounded-2xl shadow-xl shadow-[#7AA4A5]/20 transition-all active:scale-95 text-xs font-black uppercase tracking-widest shrink-0 w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 overflow-hidden animate-in fade-in duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-black/5">
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Coupon Code
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Discount
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Expires At
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-6">
                      <div className="h-8 bg-gray-100 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <Ticket size={48} className="text-gray-200 mb-4" />
                      <p className="text-neutral-400 font-bold">
                        {debouncedSearch
                          ? `No coupons found matching "${debouncedSearch}"`
                          : "No coupons found. Create your first one!"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#7AA4A5]/10 text-[#7AA4A5] rounded-xl flex items-center justify-center">
                          <Ticket size={20} />
                        </div>
                        <span className="text-sm font-black text-neutral-900 tracking-wider">
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-900">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : `$${coupon.discount_value}`}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          {coupon.discount_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button
                        onClick={() => handleToggleStatus(coupon)}
                        className="flex items-center gap-2 group/status"
                      >
                        {coupon.is_active ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 group-hover/status:bg-green-100 transition-colors">
                            <CheckCircle2 size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100 group-hover/status:bg-red-100 transition-colors">
                            <AlertCircle size={12} />
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Calendar size={14} className="text-[#7AA4A5]" />
                        <span className="text-xs font-bold">
                          {coupon.expires_at
                            ? new Date(coupon.expires_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "UTC",
                                }
                              )
                            : "No Expiry"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setIsModalOpen(true);
                          }}
                          className="p-2.5 text-neutral-400 hover:text-[#7AA4A5] hover:bg-[#7AA4A5]/5 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.total_pages > 1 && (
          <div className="px-8 py-4 border-t border-black/5">
            <Pagination
              currentPage={currentPage}
              totalPages={data.total_pages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCoupon(null);
        }}
        coupon={editingCoupon}
        onSave={handleSave}
        isLoading={isAdding || isUpdating}
      />
    </div>
  );
};

export default Coupons;
