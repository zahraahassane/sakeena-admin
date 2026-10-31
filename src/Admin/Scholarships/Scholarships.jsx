import React, { useEffect, useState } from "react";
import {
  useGetScholarshipsQuery,
  useApproveScholarshipMutation,
  useRejectScholarshipMutation,
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Percent,
  X,
  Phone,
  Mail,
  GraduationCap,
  BookOpen,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import ScholarshipDetailsModal from "./ScholarshipDetailsModal";
import SetDiscountModal from "./SetDiscountModal";

const StatsCard = ({ icon: Icon, color, label, value }) => {
  const colorStyles = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      outline: "outline-blue-600",
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      outline: "outline-yellow-600",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      outline: "outline-green-600",
    },
    red: { bg: "bg-red-100", text: "text-red-600", outline: "outline-red-600" },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="flex-1 min-w-[240px] px-6 pt-6 pb-6 bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-start items-start transition-all hover:shadow-md">
      <div className="self-stretch flex justify-start items-center gap-4">
        <div
          className={`w-12 h-12 ${style.bg} rounded-full flex justify-center items-center`}
        >
          <Icon className={`w-6 h-6 ${style.text}`} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col justify-start items-start">
          <div className="text-neutral-500 text-sm font-normal arimo-font leading-5">
            {label}
          </div>
          <div className="text-neutral-800 text-2xl font-bold arimo-font leading-8">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationCard = ({ app, onReject, onViewDetails, onOpenDiscount }) => {
  const statusColors = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "outline-yellow-200",
      dot: "outline-yellow-700",
    },
    approved: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "outline-green-200",
      dot: "outline-green-700",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "outline-red-200",
      dot: "outline-red-700",
    },
  };

  const statusFormat = app.status ? app.status.toLowerCase() : "pending";
  const statusStyle = statusColors[statusFormat] || statusColors.pending;

  const getInitials = (nameStr) => {
    if (!nameStr) return "?";
    return nameStr
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };
  const appName =
    app.name ||
    `${app.user_detail?.first_name || ""} ${app.user_detail?.last_name || ""}`.trim();
  const initials = getInitials(appName);

  const discountDisplay = app.discount_percent
    ? `${app.discount_percent}% Discount`
    : null;
  const originalPrice = parseFloat(app.course_detail?.price || 0);
  const discountPriceDisplay = app.discount_percent
    ? `$${(originalPrice - (originalPrice * app.discount_percent) / 100).toFixed(2)}`
    : null;

  const appliedDateStr = app.created_at
    ? new Date(app.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const documentCount = app.documents ? app.documents.length : 0;
  const educationDisplay = `${app.current_level_of_study || "N/A"} • ${app.field_of_study || "N/A"}`;
  const courseName = app.course_detail?.title || "Unknown Course";
  const emailDisplay = app.email || app.user_detail?.email || "";
  const phoneDisplay = app.phone_number || "N/A";

  return (
    <div className="w-full px-6 pt-6 pb-px bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-start items-start gap-4 hover:shadow-md transition-all">
      <div className="self-stretch flex justify-between items-start">
        {/* Left Section: Avatar & Info */}
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-greenTeal rounded-full flex justify-center items-center">
            <span className="text-white text-xl font-bold arimo-font">
              {initials}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {/* Name & Status */}
            <div className="flex items-center gap-3">
              <h3 className="text-neutral-800 text-lg font-bold arimo-font">
                {appName}
              </h3>
              <div
                className={`px-2.5 py-0.5 rounded-full flex items-center gap-1.5 outline outline-1 outline-offset-[-1px] ${statusStyle.bg} ${statusStyle.border}`}
              >
                <div className="w-3.5 h-3.5 relative flex items-center justify-center">
                  <div
                    className={`w-2 h-2 rounded-full border-2 ${statusStyle.text.replace("text", "border")}`}
                  ></div>
                </div>
                <span
                  className={`text-xs font-bold arimo-font ${statusStyle.text}`}
                >
                  {statusFormat.charAt(0).toUpperCase() + statusFormat.slice(1)}
                </span>
              </div>
              {discountDisplay && (
                <div className="px-2.5 py-0.5 rounded-full flex items-center gap-1.5 outline outline-1 outline-offset-[-1px] bg-purple-100 outline-purple-200">
                  <Percent size={12} className="text-purple-700" />
                  <span className="text-xs font-bold arimo-font text-purple-700">
                    {discountDisplay}
                  </span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-1">
              <div className="flex items-center gap-2 text-neutral-600 text-sm arimo-font">
                <Mail size={14} className="text-neutral-400" />
                {emailDisplay}
              </div>
              <div className="flex items-center gap-2 text-neutral-600 text-sm arimo-font">
                <Phone size={14} className="text-neutral-400" />
                {phoneDisplay}
              </div>
              <div className="flex items-center gap-2 text-neutral-600 text-sm arimo-font">
                <BookOpen size={14} className="text-neutral-400" />
                {courseName}
              </div>
              <div className="flex items-center gap-2 text-neutral-600 text-sm arimo-font">
                <DollarSign size={14} className="text-neutral-400" />
                <span className="flex items-center gap-2">
                  Price: ${originalPrice.toFixed(2)}
                  {discountPriceDisplay && (
                    <span className="text-green-600 font-bold">
                      → {discountPriceDisplay}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(app)}
            className="w-10 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-greenTeal hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onOpenDiscount(app)}
            className="w-10 h-9 rounded-lg bg-greenTeal hover:bg-opacity-90 text-white flex items-center justify-center transition-all shadow-sm"
          >
            <Percent size={16} />
          </button>
          <button
            onClick={() => onReject(app.id)}
            className="w-10 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="self-stretch h-10 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-500 arimo-font">
        <div className="flex items-center gap-1">
          <span>Applied: {appliedDateStr}</span>
          <span className="mx-1">•</span>
          <span>{documentCount} documents</span>
        </div>
        <div>{educationDisplay}</div>
      </div>
    </div>
  );
};

const Scholarships = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppDetails, setSelectedAppDetails] = useState(null);
  const [selectedAppDiscount, setSelectedAppDiscount] = useState(null);

  const { data, isLoading } = useGetScholarshipsQuery({
    page: currentPage,
    search: debouncedSearch,
  });
  const [rejectScholarship] = useRejectScholarshipMutation();
  const [approveScholarship] = useApproveScholarshipMutation();

  const applications = data?.results || [];

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const stats = [
    {
      label: "Total Applications",
      value: applications.length,
      icon: FileText,
      color: "blue",
    },
    {
      label: "Pending Review",
      value: applications.filter((a) => a.status === "Pending").length,
      icon: Clock,
      color: "yellow",
    },
    {
      label: "Approved",
      value: applications.filter((a) => a.status === "Approved").length,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Rejected",
      value: applications.filter((a) => a.status === "Rejected").length,
      icon: XCircle,
      color: "red",
    },
  ];

  const handleReject = (id) => {
    toast(
      (t) => (
        <div className="flex items-center gap-4 p-1">
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-800 inter-font">
              Reject Application
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Are you sure you want to reject this application?
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
                toast.dismiss(t.id);
                try {
                  await rejectScholarship({ id, body: {} }).unwrap();
                  toast.success("Application rejected", {
                    style: {
                      borderRadius: "12px",
                      background: "#333",
                      color: "#fff",
                    },
                  });
                } catch (err) {
                  toast.error("Failed to reject application");
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Reject
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

  const handleApproveDiscount = async (id, discountPercent, finalPrice) => {
    try {
      await approveScholarship({
        id,
        body: { discount_percent: parseInt(discountPercent) || 0 },
      }).unwrap();
      toast.success("Application approved with discount!");
      setSelectedAppDiscount(null);
    } catch (err) {
      // console.log(err);
      toast.error(err.data.error || "Failed to approve scholarship");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 space-y-8 animate-in fade-in duration-500">
      {/* Modals */}
      <ScholarshipDetailsModal
        isOpen={!!selectedAppDetails}
        onClose={() => setSelectedAppDetails(null)}
        application={selectedAppDetails}
        onReject={handleReject}
        onOpenDiscountModal={(app) => {
          setSelectedAppDetails(null);
          setSelectedAppDiscount(app);
        }}
      />

      <SetDiscountModal
        isOpen={!!selectedAppDiscount}
        onClose={() => setSelectedAppDiscount(null)}
        application={selectedAppDiscount}
        onApprove={handleApproveDiscount}
      />
      {/* Stats Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div> */}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-neutral-200">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:bg-slate-50 transition-colors text-neutral-700 placeholder:text-neutral-400/70 arimo-font text-base"
            />
          </div>
        </div>

        {/* Applications List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center py-12 text-neutral-400">Loading...</div>
          ) : (
            <>
              {applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onReject={handleReject}
                  onViewDetails={setSelectedAppDetails}
                  onOpenDiscount={setSelectedAppDiscount}
                />
              ))}

              {applications.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-neutral-400 text-lg">
                    No applications found matching your search.
                  </p>
                </div>
              )}

              {data?.total_pages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={data.total_pages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scholarships;
