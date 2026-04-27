import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Users,
  Settings,
  ClipboardCheck,
  LayoutDashboard,
  BookOpen,
  FileText,
  GraduationCap,
  Award,
  UserCheck,
  CreditCard,
  Library,
  ShoppingCart,
  Megaphone,
  Newspaper,
  Home,
  User,
  DollarSign,
  Upload,
  Video,
  MessageSquare,
  Mail,
  DoorOpenIcon,
  X,
} from "lucide-react";
import logo from "../../assets/img/logo.png";

export const Sidebar = ({ onClose }) => {
  const role = useSelector((state) => state.auth.role);
  let menuItems = [];

  if (role === "admin") {
    menuItems = [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        active: true,
        slug: "dashboard",
      },
      { icon: Users, label: "User", slug: "users-management" },
      { icon: BookOpen, label: "Courses", slug: "courses-management" },
      { icon: ClipboardCheck, label: "Submissions", slug: "submissions" },
      { icon: Users, label: "Consultants", slug: "consultants" },
      { icon: FileText, label: "Content", slug: "contents" },
      { icon: DoorOpenIcon, label: "Doors", slug: "doors" },
      { icon: Library, label: "Book Library", slug: "book-library" },
      { icon: ShoppingCart, label: "Sales", slug: "sales" },
      { icon: Megaphone, label: "Announcements", slug: "announcements" },
      { icon: Newspaper, label: "Newsletter", slug: "newsletter" },
      { icon: Mail, label: "Email Templates", slug: "email-templates" },
      { icon: GraduationCap, label: "Scholarships", slug: "scholarships" },
      { icon: Award, label: "Certificates", slug: "certificates" },
      { icon: UserCheck, label: "Memberships", slug: "memberships" },
      { icon: CreditCard, label: "Payments", slug: "payments" },
      { icon: Settings, label: "Settings", slug: "settings" },
    ];
  } else if (role === "teacher") {
    menuItems = [
      { icon: Home, label: "Dashboard", active: true, slug: "teacher" },
      {
        icon: User,
        label: "Public Profile",
        active: false,
        slug: "teacher/public-profile",
      },
      {
        icon: GraduationCap,
        label: "Courses",
        active: false,
        slug: "teacher/my-courses",
      },
      {
        icon: ClipboardCheck,
        label: "Submissions",
        active: false,
        slug: "teacher/submissions",
      },
      {
        icon: MessageSquare,
        label: "Consultations",
        active: false,
        slug: "teacher/consultations",
      },
      {
        icon: Video,
        label: "Live Sessions",
        active: false,
        slug: "teacher/live-sessions",
      },
      {
        icon: Upload,
        label: "Content Upload",
        active: false,
        slug: "teacher/content-upload",
      },
      // {
      //   icon: DollarSign,
      //   label: "Earnings & Revenue",
      //   active: false,
      //   slug: "teacher/earnings-revenue",
      // },
      {
        icon: Settings,
        label: "Settings",
        active: false,
        slug: "teacher/settings",
      },
    ];
  } else {
    menuItems = [];
  }

  const location = useLocation();

  return (
    <div className="w-full h-[100vh] shadow-xl flex flex-col justify-between overflow-auto [&::-webkit-scrollbar]:hidden bg-[#F7F4EC]">
      {/* Logo + Mobile Close Button */}
      <div>
        <div className="w-full relative">
          <div className="mb-2 p-6 flex flex-col items-center gap-2.5 justify-start">
            <img src={logo} alt="Logo" className="w-20 h-20" />
          </div>
          {/* Close button — only visible on mobile/tablet */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 p-1.5 rounded-full text-[#4A5565] hover:bg-black/10 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="w-full self-start">
          <ul className="w-full">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const to =
                item.slug === "dashboard"
                  ? "/admin"
                  : item.slug.includes("teacher")
                    ? `/${item.slug}`
                    : `/admin/${item.slug}`;

              return (
                <li key={index}>
                  <NavLink
                    to={to}
                    onClick={onClose}
                    className={() => {
                      const isIndexRoute = to === "/admin" || to === "/teacher";
                      const isActive =
                        location.pathname === to ||
                        (!isIndexRoute &&
                          location.pathname.startsWith(to + "/"));

                      const activeClasses = location.pathname.includes(
                        "/teacher",
                      )
                        ? "bg-primary rounded-full"
                        : "bg-greenTeal rounded-xl";

                      return `flex items-center h-12 pl-6 py-3 text-start text-base font-normal transition-colors mx-4 mb-1 gap-3 ${
                        isActive
                          ? `${activeClasses} text-[#FFFFFF] shadow-lg backdrop-blur-md`
                          : "text-[#4A5565] rounded-sm"
                      }`;
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-base">
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};
