import { motion } from "framer-motion";
import { GraduationCap, Timer, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  { icon: Timer, text: "Server-synced timer, no cheating with clocks" },
  { icon: ShieldCheck, text: "Secure, role-based access" },
  { icon: BarChart3, text: "Instant results with detailed review" },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left: branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-2.5 rounded-xl">
            <GraduationCap size={26} />
          </div>
          <span className="text-xl font-semibold">ExamPortal</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Smart online exams,
            <br /> made simple.
          </h2>
          <p className="mt-4 text-indigo-100 max-w-md">
            Create tests, take them in a distraction-free screen, and get results instantly.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-indigo-50">
                <span className="bg-white/15 p-2 rounded-lg">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-indigo-200">© ExamPortal</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 p-8"
        >
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1 mb-6">{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </div>
  );
}