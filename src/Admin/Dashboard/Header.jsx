import React, { useState } from "react";
import profile from "../../../src/assets/images/profile.jpg";
import { Bell, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "@/Redux/features/auth/authSlice";

const Header = ({ title, subtitle }) => {
  const [hasNotification, setHasNotification] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const role = useSelector((state) => state.auth.role);
  const displayName = role === "teacher" ? "Teacher" : "Admin";
  const displayImage = profile;

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-between px-4 md:px-8 py-5 md:py-7 bg-[#FFFFFF] border-b border-neutral-100 flex-wrap gap-4">
      <div className="flex-1 min-w-0">
        <h1
          className={`font-black text-2xl md:text-[30px] tracking-tight truncate leading-tight ${location.pathname.includes("teacher") ? "text-primary" : "text-greenTeal"}`}
        >
          {title}
        </h1>
        <p className="text-xs md:text-base font-medium text-slate-500 mt-1 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2 md:gap-3 border-l md:border-l-2 border-slate-100 pl-3 md:pl-4">
          <div className="hidden sm:flex flex-col">
            <h1 className="text-right text-neutral-900 text-sm font-bold inter-font truncate max-w-[120px]">
              {displayName}
            </h1>
            <p className="text-right text-slate-400 text-[10px] font-bold inter-font capitalize tracking-widest">
              {role || "User"}
            </p>
          </div>
          <button className="w-9 h-9 md:w-11 md:h-11 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm transition-transform active:scale-95 shrink-0">
            <img src={displayImage} alt="profile" className="w-full h-full object-cover" />
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-[#4A5565] transition-colors hover:text-red-600"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Header;
