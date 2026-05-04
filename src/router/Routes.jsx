import MainDashboard from "@/Admin/Dashboard/MainDashboard";
import AdminLayout from "@/layouts/AdminLayout";
import { createBrowserRouter, Navigate } from "react-router-dom";
import TermsAndPolicies from "@/Admin/Settings/Settings";
import ProtectedRoute from "./ProtectedRoute";
import { useSelector } from "react-redux";

import Login from "../components/Login";
import TeacherDashboard from "../Teacher/TeacherDashboard";
import PublicProfile from "../Teacher/PublicProfile";
import MyCourses from "../Teacher/MyCourses";
import Submissions from "../Teacher/Submissions";
import Consultations from "../Teacher/Consultations";
import LiveSessions from "../Teacher/LiveSessions";
import ContentUpload from "../Teacher/ContentUpload";
import EarningsRevenue from "../Teacher/EarningsRevenue";
import TeacherSettings from "../Teacher/Settings";
import CourseDetailsPage from "../Teacher/CourseDetails/CourseDetailsPage";

import User from "../Admin/User/User";
import Scholarships from "../Admin/Scholarships/Scholarships";
import Payments from "../Admin/Payments/Payments";
import Memberships from "../Admin/Memberships/Memberships";
import Courses from "../Admin/Courses/Courses";
import AddEditCourse from "../Admin/Courses/AddEditCourse";
import Contents from "../Admin/Contents/Contents";
import ContentDetails from "../Admin/Contents/ContentDetails";
import BookLibrary from "../Admin/BookLibrary/BookLibrary";
import BookDetailsPage from "../Admin/BookLibrary/BookDetailsPage";
import BookSales from "../Admin/BookSales/BookSales";
import Submission from "../Admin/Submission/Submission";
import Announcement from "../Admin/Announesement/Announcement";
import EditProfile from "../components/EditProfile";
import Newsletter from "../Admin/Newsletter/Newsletter";
import Certificate from "../Admin/Certificate/Certificate";
import EmailTemplates from "../Admin/EmailTemp/EmailTemp";
import Doors from "../Admin/Doors/Doors";
import Consultants from "../Admin/Consultants/Consultants";

const permissions = false; // This should be replaced with actual permission logic

const RootRedirect = () => {
  const { role } = useSelector((state) => state.auth);
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  } else if (role === "teacher") {
    return <Navigate to="/teacher" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <h2>Route not found</h2>,
    children: [
      {
        index: true,
        element: <MainDashboard />,
      },
      { path: "users-management", element: <User /> },
      { path: "courses-management", element: <Courses /> },
      { path: "courses-management/add", element: <AddEditCourse /> },
      { path: "courses-management/edit/:id", element: <AddEditCourse /> },
      { path: "submissions", element: <Submission /> },
      { path: "consultants", element: <Consultants /> },
      { path: "settings", element: <TermsAndPolicies /> },
      { path: "contents", element: <Contents /> },
      { path: "contents/:id", element: <ContentDetails /> },
      { path: "book-library", element: <BookLibrary /> },
      { path: "book-library/:slug", element: <BookDetailsPage /> },
      { path: "sales", element: <BookSales /> },
      // { path: "book-sales/:id", element: <>Book Sales Details</> },
      { path: "announcements", element: <Announcement /> },
      { path: "newsletter", element: <Newsletter /> },
      { path: "email-templates", element: <EmailTemplates /> },
      { path: "scholarships", element: <Scholarships /> },
      { path: "certificates", element: <Certificate /> },
      { path: "memberships", element: <Memberships /> },
      { path: "payments", element: <Payments /> },
      { path: "doors", element: <Doors /> },
    ],
  },
  {
    path: "/teacher",
    element: (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <TeacherDashboard />,
      },
      { path: "public-profile", element: <PublicProfile /> },
      { path: "edit-profile", element: <EditProfile /> },
      {
        path: "my-courses",
        element: permissions ? <Courses /> : <MyCourses />,
      },
      { path: "course/:courseId", element: <CourseDetailsPage /> },
      { path: "submissions", element: <Submissions /> },
      { path: "consultations", element: <Consultations /> },
      { path: "live-sessions", element: <LiveSessions /> },
      { path: "content-upload", element: <ContentUpload /> },
      { path: "content-details/:id", element: <ContentDetails /> },
      { path: "earnings-revenue", element: <EarningsRevenue /> },
      { path: "settings", element: <TeacherSettings /> },
    ],
  },
]);

export default router;
