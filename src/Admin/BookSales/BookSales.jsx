import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShoppingBag,
  DollarSign,
  Download,
  Package,
  MapPin,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { useGetSalesQuery } from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import SalesTable from "./SalesTable";

const BookSales = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filterOptions = [
    { label: "All Types", value: "All Types" },
    { label: "Course", value: "course" },
    { label: "Bundle", value: "bundle" },
    { label: "Physical Book", value: "physical_book" },
    { label: "Digital Book", value: "digital_book" },
    { label: "Consultation", value: "consultation" },
    { label: "Donation", value: "donation" },
    { label: "Membership", value: "membership" },
  ];
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: apiResponse,
    isLoading,
    isError,
  } = useGetSalesQuery({
    page: currentPage,
    search: searchQuery,
    type: filterType !== "All Types" ? filterType : undefined,
  });

  // Transform API data to component format
  const transformedSalesData = useMemo(() => {
    if (!apiResponse?.results) return [];

    return apiResponse.results.map((order) => {
      const dateObj = new Date(order.date);
      const dateStr = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const timeStr = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Map type from API format
      const typeMap = {
        course: "Course",
        bundle: "Bundle",
        digital_book: "Digital Book",
        physical_book: "Physical Book",
        consultation: "Consultation",
        donation: "Donation",
        membership: "Membership"
      };

      // Map payment status to display values
      const paymentStatusMap = {
        completed: "Paid",
        pending: "Pending",
        failed: "Failed",
      };

      return {
        id: order.id,
        student: {
          name: order.student_name,
          email: order.student_email,
          phone: "N/A",
        },
        book: {
          title: order.product_name,
          author: "", // Reusing book object for generic product display
          image: "https://placehold.co/133x200",
        },
        typeDisplay: typeMap[order.type] || order.type,
        typeRaw: order.type,
        quantity: order.quantity,
        amount: parseFloat(order.amount),
        address: order.shipping_address || "N/A",
        payment: paymentStatusMap[order.payment_status] || "Unknown",
        status:
          order.payment_status === "completed"
            ? "Completed"
            : order.payment_status === "pending"
              ? "Pending"
              : "Failed",
        date: dateStr,
        time: timeStr,
      };
    });
  }, [apiResponse?.results]);

  const stats = [
    {
      label: "Total Orders",
      value: apiResponse?.count || "0",
      icon: ShoppingBag,
      color: "bg-teal-600",
      textColor: "text-teal-600",
    },
    {
      label: "Total Revenue",
      value: `$${(apiResponse?.results?.reduce((sum, order) => sum + parseFloat(order.amount), 0) || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-green-600",
      textColor: "text-green-600",
    },
    {
      label: "Digital Sales",
      value:
        apiResponse?.results?.filter((o) => o.type === "digital_book" || o.type === "course" || o.type === "bundle" || o.type === "membership").length ||
        "0",
      icon: Download,
      color: "bg-blue-600",
      textColor: "text-blue-600",
    },
    {
      label: "Physical Sales",
      value:
        apiResponse?.results?.filter((o) => o.type === "physical_book")
          .length || "0",
      icon: Package,
      color: "bg-purple-600",
      textColor: "text-purple-600",
    },
  ];

  const stats_old = [
    {
      label: "Total Orders",
      value: "7",
      icon: ShoppingBag,
      color: "bg-teal-600",
      textColor: "text-teal-600",
    },
    {
      label: "Total Revenue",
      value: "$792.00",
      icon: DollarSign,
      color: "bg-green-600",
      textColor: "text-green-600",
    },
    {
      label: "Digital Sales",
      value: "2",
      icon: Download,
      color: "bg-blue-600",
      textColor: "text-blue-600",
    },
    {
      label: "Physical Sales",
      value: "5",
      icon: Package,
      color: "bg-purple-600",
      textColor: "text-purple-600",
    },
  ];

  // We rely fully on the backend API for search and type filtering since it is paginated
  const filteredData = transformedSalesData;

  return (
    <div className="pt-2 flex flex-col gap-8 animate-in fade-in duration-500 pb-10 arimo-font">
      {/* Stats Section */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl border border-black/10 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 text-sm">{stat.label}</span>
              <span className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </span>
            </div>
            <div className={`${stat.color} p-3 rounded-xl`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        ))}
      </div> */}

      {/* Filter & Search Section */}
      <div className="bg-white p-4 rounded-2xl border border-black/10 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name, book title, or order ID..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 rounded-lg outline-none text-sm border border-transparent focus:border-teal-500/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-60">
            <div
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center justify-between px-3 py-2 bg-zinc-100 rounded-lg border border-transparent hover:border-black/5 transition-all text-sm cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-neutral-950 font-medium">
                  {filterOptions.find(o => o.value === filterType)?.label || "All Types"}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 opacity-50 transition-transform duration-200 ${showFilterDropdown ? "rotate-180" : ""}`}
              />
            </div>

            {showFilterDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilterDropdown(false)}
                ></div>
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in duration-200 h-64 overflow-y-auto">
                  {filterOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value);
                        setCurrentPage(1); // Reset to first page
                        setShowFilterDropdown(false);
                      }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${filterType === option.value
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-black/10">
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <h2 className="text-neutral-950 text-base font-semibold">
              All Book Sales & Orders
            </h2>
          </div>
          <p className="text-gray-500 text-sm">
            Complete list of all book purchases with customer and delivery
            information
          </p>
        </div>

        <SalesTable data={filteredData} isLoading={isLoading} />

        {/* Pagination */}
        <div className="border-t border-black/10 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={apiResponse?.total_pages || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default BookSales;
