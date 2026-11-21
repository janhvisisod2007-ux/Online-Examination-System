import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  User,
  Mail,
  Lock,
  Loader2,
  GraduationCap,
  BookOpenCheck,
  KeyRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

const roles = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "teacher", label: "Teacher", icon: BookOpenCheck },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    teacherCode: "",
  });

  const [loading, setLoading] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Role Selection
  const handleRoleChange = (value) => {
    setForm((prev) => ({
      ...prev,
      role: value,
      teacherCode: value === "student" ? "" : prev.teacherCode,
    }));
  };

  // Handle Registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.name.trim().length === 0) {
      return toast.error("Please enter your name");
    }

    if (form.password.length < 6) {
      return toast.error(
        "Password must be at least 6 characters"
      );
    }

    if (form.role === "teacher" && !form.teacherCode.trim()) {
      return toast.error("Teacher code required hai");
    }

    setLoading(true);

    try {
      const user = await register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        teacherCode:
          form.role === "teacher" ? form.teacherCode.trim() : "",
      });

      toast.success("Account created successfully!");

      navigate(user.role === "teacher" ? "/teacher" : "/student");

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Common Input Styling
  const inputClass =
    "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join as a student or a teacher"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3">

          {roles.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => handleRoleChange(value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition ${
                form.role === value
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Icon size={22} />

              <span className="text-sm font-medium">
                {label}
              </span>
            </button>
          ))}

        </div>

        {/* Full Name */}
        <div className="relative">

          <User
            className="absolute left-3 top-3.5 text-slate-400"
            size={18}
          />

          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
          />

        </div>

        {/* Email */}
        <div className="relative">

          <Mail
            className="absolute left-3 top-3.5 text-slate-400"
            size={18}
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            className={inputClass}
          />

        </div>

        {/* Password */}
        <div className="relative">

          <Lock
            className="absolute left-3 top-3.5 text-slate-400"
            size={18}
          />

          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className={inputClass}
          />

        </div>

        {/* Teacher Code - Only for Teachers */}
        {form.role === "teacher" && (
          <div className="relative">

            <KeyRound
              className="absolute left-3 top-3.5 text-slate-400"
              size={18}
            />

            <input
              type="password"
              name="teacherCode"
              placeholder="Teacher code"
              value={form.teacherCode}
              onChange={handleChange}
              required
              className={inputClass}
            />

          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
        >

          {loading && (
            <Loader2 className="animate-spin" size={18} />
          )}

          {loading ? "Creating..." : "Create account"}

        </button>

      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-slate-500 mt-6">

        Already have an account?{" "}

        <Link
          to="/login"
          className="text-indigo-600 font-semibold hover:underline"
        >
          Login
        </Link>

      </p>

    </AuthLayout>
  );
}