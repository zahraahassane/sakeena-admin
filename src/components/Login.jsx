"use client";
import backgroundImage from "../assets/img/login.png";
import logo from "../assets/img/logo.png";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAuth } from "@/Redux/features/auth/authSlice";
import { useLoginMutation } from "../Api/api";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function Login() {
  const { role, accessToken } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (accessToken && role) {
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "teacher") {
        navigate("/teacher");
      }
    }
  }, [accessToken, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      // Determine role based on email
      let role = "user"; // default
      if (email.includes("admin")) {
        role = "admin";
      } else if (email.includes("teacher")) {
        role = "teacher";
      }
      dispatch(
        setAuth({ access: result.access, refresh: result.refresh, role }),
      );
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login failed:", error);

      // Extract error message from API response
      let errorMessage = "Login failed. Please try again.";

      if (error?.data?.detail) {
        errorMessage = error.data.detail;
      } else if (error?.status === 401) {
        errorMessage = "No active account found with the given credentials";
      } else if (error?.data?.email) {
        errorMessage = "Invalid email address";
      } else if (error?.data?.password) {
        errorMessage = "Invalid password";
      } else if (error?.data?.non_field_errors) {
        errorMessage = error.data.non_field_errors[0];
      } else if (error?.status === 400) {
        errorMessage = "Invalid email or password";
      }

      toast.error(errorMessage, {
        duration: 4000,
        position: "top-center",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md bg-[white] rounded-2xl shadow-lg p-8">
        {/* Logo Placeholder */}
        <div className="flex justify-center mb-8">
          <div className="rounded-lg flex items-center justify-center">
            <img src={logo} alt="" />
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-3xl font-bold text-center text-primary mb-2">
          Welcome
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Please enter your email & password.
        </p>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-b from-[#205A60] to-[#3B8F97] text-white font-semibold py-3 rounded-full transition duration-200 mt-8 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
