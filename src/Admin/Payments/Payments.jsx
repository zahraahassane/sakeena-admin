import React from "react";
import useUrlTab from "../../hooks/useUrlTab";
import { Heart } from "lucide-react";
import CourseTransactionsTable from "./CourseTransactionsTable";
import DonationsTable from "./DonationsTable";

const Payments = () => {
  const [activeTab, setActiveTab] = useUrlTab(["course", "donation"]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 min-h-screen">
      {/* Top Stats Row */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Total Earnings",
            amount: "$40,400",
            icon: "📚",
            bg: "bg-blue-100",
            text: "text-blue-800",
          },
          {
            title: "Course Revenue",
            amount: "$10,800",
            icon: "🔴",
            bg: "bg-red-100",
            text: "text-red-800",
          },
          {
            title: "Consultation Revenue",
            amount: "$2,600",
            icon: "⏳",
            bg: "bg-yellow-100",
            text: "text-yellow-800",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="w-full p-6 bg-white rounded-2xl outline outline-1 outline-offset-[-0.91px] outline-black/10 flex flex-col justify-start items-start shadow-sm"
          >
            <div className="w-full flex justify-between items-center">
              <div className="flex flex-col justify-start item-start gap-1">
                <div className="text-gray-500 text-sm font-normal arimo-font leading-5">
                  {stat.title}
                </div>
                <div className="text-neutral-950 text-2xl font-bold arimo-font leading-8">
                  {stat.amount}
                </div>
              </div>
              <div
                className={`w-12 h-12 ${stat.bg} rounded-[10px] flex justify-center items-center`}
              >
                <div
                  className={`text-xl font-normal arimo-font leading-7 ${stat.text}`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div> */}

      {/* Donations Overview Banner */}
      {/* <div className="w-full bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl shadow-sm outline outline-2 outline-offset-[-2px] outline-pink-200 p-8 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex justify-center items-center shadow-md shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h2 className="text-neutral-800 text-2xl font-bold arimo-font leading-8">
              Donations Overview
            </h2>
            <p className="text-neutral-600 text-base font-normal arimo-font leading-6">
              Support from our community
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[
            { label: "Total Donations", value: "$15,240" },
            { label: "This Month", value: "$3,850" },
            { label: "Total Donors", value: "127" },
          ].map((stat, index) => (
            <div
              key={index}
              className="w-full p-4 bg-white/60 rounded-[10px] flex flex-col justify-start items-start gap-1 backdrop-blur-sm shadow-sm border border-white/50"
            >
              <div className="w-full text-neutral-600 text-sm font-normal arimo-font leading-5">
                {stat.label}
              </div>
              <div className="w-full text-neutral-800 text-2xl font-bold arimo-font leading-8">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Tabs and Content */}
      <div className="flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("course")}
            className={`h-10 px-6 py-2 rounded-[10px] flex items-center justify-center gap-2 transition-all ${
              activeTab === "course"
                ? "bg-greenTeal text-white shadow-md font-bold"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <span className="text-sm font-normal arimo-font">
              Course Transactions
            </span>
          </button>

          <button
            onClick={() => setActiveTab("donation")}
            className={`h-10 px-6 py-2 rounded-[10px] flex items-center justify-center gap-2 transition-all ${
              activeTab === "donation"
                ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-md font-bold"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {activeTab === "donation" && (
              <Heart size={14} className="text-white" />
            )}
            {activeTab !== "donation" && (
              <Heart size={14} className="text-neutral-600" />
            )}
            <span className="text-base font-normal arimo-font leading-6">
              Donations
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="w-full">
          {activeTab === "course" ? (
            <CourseTransactionsTable />
          ) : (
            <DonationsTable />
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
