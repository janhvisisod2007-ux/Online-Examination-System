import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

const base =
  "w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:border-transparent";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // { field, message }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "teacher" ? "/teacher" : "/student");
    } catch (err) {
      const data = err.response?.data;
      setError({
        field: data?.field || null,
        message: data?.message || "Unable to reach the server. Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) =>
    `${base} ${
      error?.field === name
        ? "border-red-400 focus:ring-red-400 bg-red-50/40"
        : "border-slate-200 focus:ring-indigo-500"
    }`;

  return (
    <AuthLayout title="Welcome back" subtitle="Login to continue to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {error.message}
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            className={fieldClass("email")}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className={fieldClass("password")}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        New here?{" "}
        <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}