import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/Admin/Dashboard/Sidebar";
import Header from "@/Admin/Dashboard/Header";
import { Menu } from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = location.pathname.startsWith(`/admin/users-management`)
    ? "Users Management"
    : location.pathname.startsWith(`/admin/courses-management`)
    ? "My Courses"
    : location.pathname.startsWith(`/admin/discussions`) ||
      location.pathname.startsWith(`/teacher/discussions`)
    ? "Discussions"
    : location.pathname.startsWith(`/admin/submissions`)
    ? "Submissions Management"
    : location.pathname.startsWith(`/admin/consultants`)
    ? "Consultants Management"
    : location.pathname.startsWith(`/admin/contents`)
    ? "Contents Library"
    : location.pathname.startsWith(`/admin/doors`)
    ? "Doors"
    : location.pathname.startsWith(`/admin/book-library`)
    ? "Book Library Management"
    : location.pathname.startsWith(`/admin/book-sales`)
    ? "Book Sales Management"
    : location.pathname.startsWith(`/admin/announcements`)
    ? "Announcements"
    : location.pathname.startsWith(`/admin/newsletter`)
    ? "Newsletter Management"
    : location.pathname.startsWith(`/admin/email-templates`)
    ? "Email Templates"
    : location.pathname.startsWith(`/admin/scholarships`)
    ? "Scholarship Applications"
    : location.pathname.startsWith(`/admin/certificates`)
    ? "Certificate Management"
    : location.pathname.startsWith(`/admin/memberships`)
    ? "Membership & Bundles"
    : location.pathname.startsWith(`/admin/payments`)
    ? "Payments & Revenue"
    : location.pathname.startsWith(`/admin/settings`)
    ? "Settings"
    : location.pathname.startsWith(`/teacher/public-profile`)
    ? "Public Profile"
    : location.pathname.startsWith(`/teacher/my-courses`)
    ? "My Assigned Courses"
    : location.pathname.startsWith(`/teacher/submissions`)
    ? "Submission Management"
    : location.pathname.startsWith(`/teacher/consultations`)
    ? "Consultation Management"
    : location.pathname.startsWith(`/teacher/live-sessions`)
    ? "Live Sessions"
    : location.pathname.startsWith(`/teacher/content-upload`)
    ? "My Content"
    : location.pathname.startsWith(`/teacher/earnings-revenue`)
    ? "Earnings & Rates"
    : location.pathname.startsWith(`/teacher/settings`)
    ? "Settings"
    : location.pathname.startsWith(`/teacher/edit-profile`)
    ? "Edit Profile"
    : location.pathname.startsWith(`/teacher`)
    ? "Faculty Dashboard"
    : "Dashboard Overview";

  const subtitle = location.pathname.startsWith(`/admin/users-management`)
    ? "Manage students, teachers, and system users"
    : location.pathname.startsWith(`/admin/courses-management`)
    ? "Create and manage your course offerings"
    : location.pathname.startsWith(`/admin/discussions`) ||
      location.pathname.startsWith(`/teacher/discussions`)
    ? "Student questions and replies across your courses"
    : location.pathname.startsWith(`/admin/submissions`)
    ? "View and grade student quiz and assignment submissions"
    : location.pathname.startsWith(`/admin/consultants`)
    ? "Manage consultant profiles and appointments"
    : location.pathname.startsWith(`/admin/contents`)
    ? "Browse and manage all uploaded content"
    : location.pathname.startsWith(`/admin/doors`)
    ? "Manage and organize your course doors"
    : location.pathname.startsWith(`/admin/book-library`)
    ? "Upload and manage digital books for students and teachers"
    : location.pathname.startsWith(`/admin/book-sales`)
    ? "Track all book purchases, customer details, and shipping information"
    : location.pathname.startsWith(`/admin/announcements`)
    ? "Create and manage course & platform announcements"
    : location.pathname.startsWith(`/admin/newsletter`)
    ? "Manage newsletters and subscribers with organized lists, segmentation, and automated delivery"
    : location.pathname.startsWith(`/admin/email-templates`)
    ? "Manage email templates with reusable layouts, dynamic content, and consistent branding"
    : location.pathname.startsWith(`/admin/scholarships`)
    ? "Review student applications and set custom discount percentages"
    : location.pathname.startsWith(`/admin/certificates`)
    ? "Generate and manage student certificates for completed courses"
    : location.pathname.startsWith(`/admin/memberships`)
    ? "Manage subscription plans and course bundles"
    : location.pathname.startsWith(`/admin/payments`)
    ? "Track payments and platform earnings"
    : location.pathname.startsWith(`/admin/settings`)
    ? "Manage admin account and system configuration"
    : location.pathname.startsWith(`/teacher/public-profile`)
    ? "Manage what students see on your profile"
    : location.pathname.startsWith(`/teacher/my-courses`)
    ? "View your teaching assignments and course details"
    : location.pathname.startsWith(`/teacher/submissions`)
    ? "View and grade student quiz and assignment submissions"
    : location.pathname.startsWith(`/teacher/consultations`)
    ? "Manage your consultation availability and bookings"
    : location.pathname.startsWith(`/teacher/live-sessions`)
    ? "View and manage live sessions"
    : location.pathname.startsWith(`teacher/content-upload`)
    ? "Add materials, videos, and resources for your courses"
    : location.pathname.startsWith(`/teacher/earnings-revenue`)
    ? "View your earnings summary and hourly rates (read-only)"
    : location.pathname.startsWith(`/teacher/settings`)
    ? "Manage your account settings and preferences"
    : location.pathname.startsWith(`/teacher/edit-profile`)
    ? "Edit your public profile information"
    : location.pathname.startsWith(`/teacher`)
    ? "Welcome back! Here's your overview for today."
    : "Welcome back! Here's what's happening today.";

  return (
    <div style={{ fontFamily: "Montserrat" }} className="flex font-poppins">
      {/* ── Dark overlay (mobile / tablet only) ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 z-40 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        {/* Sticky top bar with hamburger on mobile */}
        <div className="sticky top-0 z-20 flex items-center gap-3 bg-white border-b border-black/5 lg:block">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden shrink-0 p-4 text-[#4A5565] hover:text-neutral-900 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <Header title={title} subtitle={subtitle} />
          </div>
        </div>

        <div className="px-6 bg-[#FFFEFB] min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

