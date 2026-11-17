import React, { useState } from "react";
import {
  Crown,
  Check,
  Settings,
  Plus,
  Package,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  FileText,
  MousePointer2,
} from "lucide-react";
import toast from "react-hot-toast";
import EditMembershipModal from "./EditMembershipModal";
import CreateBundleModal from "./CreateBundleModal";
import EditBundleModal from "./EditBundleModal";
import { 
  useGetMembershipPlanQuery, 
  useGetBundlesQuery,
  useUpdateBundleMutation,
  useDeleteBundleMutation
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";

const MembershipCard = ({ plan, onEdit }) => {
  if (!plan) {
    return (
      <div className="w-full bg-neutral-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-neutral-500 border-2 border-dashed border-neutral-300">
        <Crown size={48} className="text-neutral-400" />
        <p className="text-lg">No active membership plan found.</p>
        <button
          onClick={onEdit}
          className="bg-greenTeal text-white px-6 py-2.5 rounded-[10px] font-bold text-base flex items-center gap-2 transition-colors hover:bg-opacity-90 shadow-sm"
        >
          <Plus size={18} />
          Create Membership
        </button>
      </div>
    );
  }

  const getDurationString = (days) => {
    if (!days) return "lifetime";
    if (days >= 9223372036854776000 || days > 36500) return "lifetime";
    if (days % 30 === 0) {
      const months = days / 30;
      return months === 1 ? "/month" : `/${months} months`;
    }
    return `/${days} days`;
  };

  const benefits = plan.description
    ? plan.description.split("\n").filter((line) => line.trim() !== "")
    : [];

  return (
    <div className="w-full bg-gradient-to-b from-[#7AA4A5] to-[#6A9495] rounded-2xl shadow-lg text-white overflow-hidden relative">
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Crown size={32} className="text-white" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold arimo-font">
                    {plan.name || "Membership Subscription"}
                  </h2>
                </div>
                {benefits.length === 0 && (
                  <p className="text-white/90 text-base arimo-font whitespace-pre-wrap">
                    {plan.description}
                  </p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold arimo-font">
                ${plan.price}
              </span>
              <span className="text-white/80 text-base">
                {getDurationString(plan.duration_days)}
              </span>
              {plan.yearly_available && (
                <span className="ml-3 text-white/90 text-base">
                  or ${plan.yearly_price}/year
                  {plan.yearly_savings_percent ? ` (save ${plan.yearly_savings_percent}%)` : ""}
                </span>
              )}
            </div>

            {/* Benefits Grid */}
            {benefits.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-transparent border border-green-300 flex items-center justify-center shrink-0">
                      <Check
                        size={12}
                        className="text-green-300"
                        strokeWidth={3}
                      />
                    </div>
                    <span className="text-white/90 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="bg-white hover:bg-opacity-90 text-greenTeal px-4 py-2.5 rounded-[10px] font-bold text-base flex items-center gap-2 transition-colors shadow-sm"
          >
            <Settings size={18} />
            Edit Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const BundleWebCard = ({
  bundle,
  onToggleStatus,
  onRemoveBundle,
  onEditBundle,
}) => {
  const isPublished = bundle.is_active;
  const borderColor = isPublished ? "outline-green-200" : "outline-neutral-200";
  const shadowColor = isPublished ? "shadow-green-100" : "shadow-neutral-100";

  const originalPrice = parseFloat(bundle.original_price || 0);
  const currentPrice = parseFloat(bundle.price || 0);
  const discount = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const creationDate = new Date(bundle.created_at).toLocaleDateString();

  return (
    <div
      className={`bg-white rounded-2xl p-6 outline outline-2 outline-offset-[-2px] ${borderColor} shadow-sm hover:shadow-md transition-shadow flex flex-col h-full`}
    >
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-neutral-800 arimo-font leading-tight pr-4">
            {bundle.name}
          </h3>
          {isPublished ? (
            <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1 rounded-full shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              <span className="text-green-700 text-xs font-bold">
                Published
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1 rounded-full shrink-0">
              <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
              <span className="text-neutral-600 text-xs font-bold">Draft</span>
            </div>
          )}
        </div>
        <p className="text-neutral-600 text-sm arimo-font line-clamp-2">
          {bundle.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-greenTeal text-3xl font-bold arimo-font">
            ${currentPrice.toFixed(2)}
          </span>
          {discount > 0 && (
            <span className="text-greenTeal text-sm font-normal">
              Save {discount}%
            </span>
          )}
        </div>
        <div className="text-neutral-500 text-sm line-through">
          Original value: ${originalPrice.toFixed(2)}
        </div>
        <div className="text-neutral-500 text-xs">One-time lifetime access</div>
      </div>

      {/* Includes List */}
      <div className="mb-6 flex-1">
        <p className="text-neutral-700 text-sm mb-3">
          Includes {bundle.courses_detail?.length || 0} Courses:
        </p>
        <div className="space-y-3">
          {bundle.courses_detail?.map((course) => (
            <div key={course.id} className="flex items-start gap-3">
              <div className="w-4 h-4 mt-0.5 shrink-0">
                <div
                  className={`w-3 h-3 rounded-sm border ${isPublished ? "border-green-500" : "border-neutral-400"} flex items-center justify-center`}
                >
                  <Check
                    size={8}
                    className={
                      isPublished ? "text-green-500" : "text-neutral-400"
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-neutral-700 text-sm leading-tight">
                  {course.title}
                </p>
                <p className="text-neutral-500 text-xs mt-0.5">
                  {course.category?.name || "Uncategorized"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Divider */}
      <div className="border-t border-neutral-200 pt-4 mb-4 grid grid-cols-1 gap-4">
        <div>
          <p className="text-neutral-500 text-sm">Created</p>
          <p className="text-neutral-800 text-sm font-bold">{creationDate}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => onToggleStatus(bundle)}
          className={`flex-1 h-10 rounded-[10px] flex items-center justify-center gap-2 font-normal text-base transition-colors ${isPublished
              ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
        >
          {isPublished ? (
            <>
              <EyeOff size={16} /> Unpublish
            </>
          ) : (
            <>
              <MousePointer2 size={16} className="rotate-90" /> Publish
            </>
          )}
        </button>
        <button
          onClick={() => onEditBundle(bundle)}
          className="w-10 h-10 rounded-[10px] border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => onRemoveBundle(bundle.id)}
          className="w-10 h-10 rounded-[10px] border border-neutral-200 flex items-center justify-center hover:bg-red-50 text-neutral-500 hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, colorClass, bgClass }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}
      >
        <Icon size={24} className={colorClass} />
      </div>
      <div>
        <p className="text-neutral-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-neutral-800 mt-1">{value}</p>
      </div>
    </div>
  );
};

const Memberships = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateBundleModalOpen, setIsCreateBundleModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data: membershipPlanData, isLoading: isPlanLoading } = useGetMembershipPlanQuery();
  const { data: bundlesData, isLoading: isBundlesLoading } = useGetBundlesQuery({ page: currentPage });
  
  // Mutations
  const [updateBundle] = useUpdateBundleMutation();
  const [deleteBundle] = useDeleteBundleMutation();

  const bundles = bundlesData?.results || [];

  const handleToggleStatus = async (bundle) => {
    try {
      await updateBundle({
        id: bundle.id,
        body: { is_active: !bundle.is_active }
      }).unwrap();
      toast.success(bundle.is_active ? "Bundle unpublished" : "Bundle published");
    } catch (err) {
      toast.error(err.data?.error || "Failed to toggle status");
    }
  };

  const handleRemoveBundle = (id) => {
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800 arimo-font">
              Confirm Delete
            </p>
            <p className="text-xs text-neutral-500 mt-0.5 arimo-font">
              Are you sure you want to remove this bundle?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors arimo-font"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  await deleteBundle(id).unwrap();
                  toast.dismiss(t.id);
                  toast.success("Bundle removed successfully", {
                    icon: "🗑️",
                    style: {
                      borderRadius: "12px",
                      background: "#333",
                      color: "#fff",
                    },
                  });
                } catch (err) {
                  toast.error("Failed to delete bundle");
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm arimo-font"
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
          minWidth: "350px",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
    );
  };



  return (
    <div className="p-8 space-y-10 min-h-screen bg-white animate-in fade-in duration-500">
      {/* Subscription Card */}
      <div className="w-full">
        {isPlanLoading ? (
          <div className="h-64 bg-neutral-100 rounded-2xl animate-pulse"></div>
        ) : (
          <MembershipCard
            plan={membershipPlanData}
            onEdit={() => setIsEditModalOpen(true)}
          />
        )}
      </div>

      {/* Course Bundles Section */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-neutral-200 pb-6 gap-4">
          <div className="space-y-1">
            <h2 className="text-neutral-800 text-2xl font-bold arimo-font">
              Course Bundles
            </h2>
            <p className="text-neutral-500 text-base arimo-font">
              Create curated course packages for one-time purchase
            </p>
          </div>
          <button
            onClick={() => setIsCreateBundleModalOpen(true)}
            className="bg-greenTeal hover:bg-opacity-80 text-white px-6 py-3 rounded-[10px] font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Create Bundle
          </button>
        </div>

        {/* Stats Row */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Package}
            label="Total Bundles"
            value={totalBundles}
            bgClass="bg-slate-100"
            colorClass="text-slate-500"
          />
          <StatCard
            icon={Eye}
            label="Published"
            value={publishedCount}
            bgClass="bg-green-100"
            colorClass="text-green-600"
          />
          <StatCard
            icon={EyeOff}
            label="Unpublished"
            value={unpublishedCount}
            bgClass="bg-neutral-100"
            colorClass="text-neutral-600"
          />
        </div> */}

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isBundlesLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-96 bg-neutral-100 rounded-2xl animate-pulse"></div>
            ))
          ) : (
            bundles.map((bundle) => (
              <BundleWebCard
                key={bundle.id}
                bundle={bundle}
                onToggleStatus={handleToggleStatus}
                onRemoveBundle={handleRemoveBundle}
                onEditBundle={(bundle) => setEditingBundle(bundle)}
              />
            ))
          )}
        </div>
        {bundlesData?.total_pages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={bundlesData.total_pages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <EditMembershipModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        plan={membershipPlanData}
      />

      <CreateBundleModal
        isOpen={isCreateBundleModalOpen}
        onClose={() => setIsCreateBundleModalOpen(false)}
      />

      {editingBundle && (
        <EditBundleModal
          isOpen={!!editingBundle}
          onClose={() => setEditingBundle(null)}
          bundle={editingBundle}
        />
      )}
    </div>
  );
};

export default Memberships;
