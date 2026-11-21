import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowLeft, Check, X, Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";

function ScoreRing({ percent }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const color = percent >= 70 ? "#059669" : percent >= 40 ? "#d97706" : "#dc2626";

  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <motion.circle
          cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * percent) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{percent}%</span>
      </div>
    </div>
  );
}

export default function ExamResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/student/attempts/${attemptId}`);
        if (data.status === "in_progress") {
          navigate(`/student/exam/${data.exam._id}`, { replace: true });
          return;
        }
        setResult(data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load the result");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center py-32 text-indigo-600">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-32">
          <p className="text-slate-600 mb-4">Result not found</p>
          <Link to="/student" className="text-indigo-600 font-semibold hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { exam, score, correctCount, wrongCount, unattemptedCount, review } = result;
  const percent = exam.totalMarks > 0 ? Math.round((score / exam.totalMarks) * 100) : 0;
  const verdict = percent >= 70 ? "Excellent work! 🎉" : percent >= 40 ? "Good effort, keep practicing 💪" : "Keep going, review the material and try again 📚";

  const sameAnswers = (a, b) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-4"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreRing percent={percent} />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
              <p className="text-slate-500 mt-1">{verdict}</p>
              <p className="mt-3 text-3xl font-bold text-indigo-600">
                {score} <span className="text-lg font-medium text-slate-400">/ {exam.totalMarks}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-emerald-50 rounded-xl py-4 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={22} />
              <p className="text-2xl font-bold text-emerald-700 mt-1">{correctCount}</p>
              <p className="text-xs text-emerald-700">Correct</p>
            </div>
            <div className="bg-red-50 rounded-xl py-4 text-center">
              <XCircle className="mx-auto text-red-600" size={22} />
              <p className="text-2xl font-bold text-red-700 mt-1">{wrongCount}</p>
              <p className="text-xs text-red-700">Wrong</p>
            </div>
            <div className="bg-slate-50 rounded-xl py-4 text-center">
              <MinusCircle className="mx-auto text-slate-500" size={22} />
              <p className="text-2xl font-bold text-slate-700 mt-1">{unattemptedCount}</p>
              <p className="text-xs text-slate-500">Skipped</p>
            </div>
          </div>
        </div>

        {/* Review */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Answer review</h2>
        <div className="space-y-4">
          {review.map(({ question: q, selected }, idx) => {
            const skipped = selected.length === 0;
            const correct = !skipped && sameAnswers(selected, q.correctAnswers);

            const badge = skipped
              ? { text: "Skipped", cls: "bg-slate-100 text-slate-600" }
              : correct
              ? { text: "Correct", cls: "bg-emerald-50 text-emerald-700" }
              : { text: "Wrong", cls: "bg-red-50 text-red-700" };

            return (
              <div key={q._id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 min-w-0">
                    <span className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="font-medium text-slate-900 whitespace-pre-wrap">{q.text}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, i) => {
                    const isCorrect = q.correctAnswers.includes(i);
                    const isSelected = selected.includes(i);
                    let cls = "border-slate-200 text-slate-700";
                    if (isCorrect) cls = "border-emerald-300 bg-emerald-50 text-emerald-800";
                    else if (isSelected) cls = "border-red-300 bg-red-50 text-red-800";

                    return (
                      <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${cls}`}>
                        <span className="font-semibold text-xs opacity-60">{String.fromCharCode(65 + i)}</span>
                        <span className="flex-1">{opt}</span>
                        {isSelected && <span className="text-xs font-medium opacity-70">Your answer</span>}
                        {isCorrect && <Check size={16} className="text-emerald-600 shrink-0" />}
                        {isSelected && !isCorrect && <X size={16} className="text-red-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="mt-3 text-sm text-slate-500">
                    <span className="font-medium text-slate-600">Explanation:</span> {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}