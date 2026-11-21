import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Clock, Award, MinusCircle, Play, RotateCcw, FileCheck2,
  CalendarClock, Lock, Loader2, ClipboardList, Trophy, CheckCircle2,
} from "lucide-react";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { confirm } from "../../components/ConfirmDialog";

const fmtDate = (d) =>
  new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <span className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("exams");

  useEffect(() => {
    const load = async () => {
      try {
        const [examRes, attemptRes] = await Promise.all([
          api.get("/student/exams"),
          api.get("/student/attempts"),
        ]);
        setExams(examRes.data);
        setAttempts(attemptRes.data.filter((a) => a.exam));
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load your data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const attemptByExam = useMemo(
    () => new Map(attempts.map((a) => [a.exam._id, a])),
    [attempts]
  );

  const avg = useMemo(() => {
    const valid = attempts.filter((a) => a.exam.totalMarks > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((s, a) => s + (a.score / a.exam.totalMarks) * 100, 0);
    return Math.round(sum / valid.length);
  }, [attempts]);

  const startExam = async (exam) => {
  const ok = await confirm({
    title: `Start "${exam.title}"?`,
    message: "Please read the instructions before you begin.",
    confirmText: "Start exam",
    variant: "primary",
    details: [
      { label: "Duration", value: `${exam.duration} min` },
      { label: "Total marks", value: exam.totalMarks },
      { label: "Negative marking", value: exam.negativeMarking > 0 ? `-${exam.negativeMarking}` : "None" },
    ],
    notes: [
      "The timer starts immediately and cannot be paused.",
      "Your answers are saved automatically.",
      "The exam is submitted automatically when the time is up.",
      "You can attempt this exam only once.",
    ],
  });

  if (ok) navigate(`/student/exam/${exam._id}`);
};

  const renderAction = (exam) => {
    const now = Date.now();
    const attempt = attemptByExam.get(exam._id);

    if (exam.attemptStatus === "submitted" && attempt) {
      return (
        <button
          onClick={() => navigate(`/student/result/${attempt._id}`)}
          className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition"
        >
          <FileCheck2 size={16} /> View result
        </button>
      );
    }
    if (exam.attemptStatus === "in_progress") {
      return (
        <button
          onClick={() => navigate(`/student/exam/${exam._id}`)}
          className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
        >
          <RotateCcw size={16} /> Resume exam
        </button>
      );
    }
    if (exam.startTime && now < new Date(exam.startTime)) {
      return (
        <div className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium">
          <CalendarClock size={16} /> Starts {fmtDate(exam.startTime)}
        </div>
      );
    }
    if (exam.endTime && now > new Date(exam.endTime)) {
      return (
        <div className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium">
          <Lock size={16} /> Closed
        </div>
      );
    }
    return (
      <button
        onClick={() => startExam(exam)}
        className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
      >
        <Play size={16} /> Start exam
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="text-slate-500">View your exams and start practicing</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={ClipboardList} label="Available exams" value={exams.length} color="bg-indigo-50 text-indigo-600" />
          <StatCard icon={CheckCircle2} label="Completed" value={attempts.length} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Trophy} label="Average score" value={`${avg}%`} color="bg-amber-50 text-amber-600" />
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { key: "exams", label: "Available exams" },
            { key: "results", label: "My results" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-indigo-600">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : tab === "exams" ? (
          exams.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <ClipboardList className="mx-auto text-slate-300" size={48} />
              <h3 className="mt-4 text-lg font-semibold text-slate-700">No exams available yet</h3>
              <p className="text-slate-500 mt-1">Exams will appear here once a teacher publishes them</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam, i) => (
                <motion.div
                  key={exam._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-lg hover:shadow-slate-200/60 transition"
                >
                  <h3 className="font-semibold text-slate-900 truncate">{exam.title}</h3>
                  <p className="text-sm text-slate-500 truncate">{exam.subject || "General"}</p>
                  {exam.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{exam.description}</p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5"><Clock size={15} /> {exam.duration} min</span>
                    <span className="flex items-center gap-1.5"><Award size={15} /> {exam.totalMarks} marks</span>
                    {exam.negativeMarking > 0 && (
                      <span className="flex items-center gap-1.5"><MinusCircle size={15} /> -{exam.negativeMarking}</span>
                    )}
                  </div>

                  {renderAction(exam)}
                </motion.div>
              ))}
            </div>
          )
        ) : attempts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Trophy className="mx-auto text-slate-300" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-slate-700">No results yet</h3>
            <p className="text-slate-500 mt-1">Your results will appear here after you take an exam</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((a) => {
              const pct = a.exam.totalMarks > 0 ? Math.round((a.score / a.exam.totalMarks) * 100) : 0;
              const color = pct >= 70 ? "text-emerald-600 bg-emerald-50" : pct >= 40 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
              return (
                <div key={a._id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{a.exam.title}</h3>
                    <p className="text-sm text-slate-500">{fmtDate(a.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${color}`}>
                      {a.score} / {a.exam.totalMarks} ({pct}%)
                    </span>
                    <button
                      onClick={() => navigate(`/student/result/${a._id}`)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
                    >
                      Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}