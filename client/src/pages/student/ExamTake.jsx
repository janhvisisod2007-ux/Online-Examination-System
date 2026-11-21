import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Timer, Flag, ChevronLeft, ChevronRight, Loader2, Send, Eraser, AlertTriangle,
} from "lucide-react";
import api from "../../api/axios";

const fmt = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function ExamTake() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const started = useRef(false); // StrictMode mein start do baar na ho
  const queue = useRef(Promise.resolve()); // answers ek ek karke save honge
  const submitting = useRef(false);

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selected: [], marked: false } }
  const [current, setCurrent] = useState(0);
  const [endAt, setEndAt] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittingUi, setSubmittingUi] = useState(false);
  const [violations, setViolations] = useState(0);
const MAX_VIOLATIONS = 3;

  // ---------- exam start / resume ----------
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const start = async () => {
      try {
        const { data } = await api.post(`/student/exams/${examId}/start`);
        setAttemptId(data.attemptId);
        setExam(data.exam);
        setQuestions(data.questions);

        const map = {};
        data.answers.forEach((a) => {
          map[a.question] = { selected: a.selected, marked: a.markedForReview };
        });
        setAnswers(map);

        setEndAt(Date.now() + data.remainingSeconds * 1000);
        setRemaining(data.remainingSeconds);
      } catch (err) {
        const d = err.response?.data;
        if (d?.attemptId) {
          navigate(`/student/result/${d.attemptId}`, { replace: true });
          return;
        }
        toast.error(d?.message || "Could not start the exam");
        navigate("/student", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    start();
  }, [examId, navigate]);

  // ---------- timer ----------
  {violations > 0 && (
  <span className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">
    ⚠ {violations}/{MAX_VIOLATIONS}
  </span>
)}
  useEffect(() => {
    if (!endAt) return;
    const t = setInterval(() => {
      setRemaining(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [endAt]);

  useEffect(() => {
    if (remaining === 0) finishExam(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  // ---------- galti se page band/refresh na ho ----------
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ---------- tab switch detection ----------
useEffect(() => {
  if (!attemptId) return;
  const key = `violations_${attemptId}`;
  setViolations(Number(localStorage.getItem(key)) || 0);

  const onVisibility = () => {
    if (!document.hidden || submitting.current) return;
    const n = (Number(localStorage.getItem(key)) || 0) + 1;
    localStorage.setItem(key, String(n));
    setViolations(n);
    if (n >= MAX_VIOLATIONS) {
      toast.error("Too many tab switches. Submitting your exam automatically");
      finishExam(true);
    } else {
      toast.error(`Warning ${n}/${MAX_VIOLATIONS}: please do not switch tabs or windows!`);
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  return () => document.removeEventListener("visibilitychange", onVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [attemptId]);

  // ---------- save + submit ----------
  const persist = (questionId, selected, marked) => {
    queue.current = queue.current.then(async () => {
      try {
        await api.put(`/student/attempts/${attemptId}/answer`, {
          questionId,
          selected,
          markedForReview: marked,
        });
      } catch (err) {
        const msg = err.response?.data?.message || "";
        if (err.response?.status === 400 && /Time is up|already submitted/.test(msg)) {
          navigate(`/student/result/${attemptId}`, { replace: true });
        } else {
          toast.error("Could not save your answer. Check your internet connection");
        }
      }
    });
  };

  const finishExam = async (auto = false) => {
    if (submitting.current || !attemptId) return;
    submitting.current = true;
    setSubmittingUi(true);
    setConfirmOpen(false);
    try {
      await queue.current; // pending answers pehle save ho jayein
      await api.post(`/student/attempts/${attemptId}/submit`);
      toast.success(auto ? "Time is up. The exam was auto-submitted" : "Exam submitted");
      navigate(`/student/result/${attemptId}`, { replace: true });
    } catch (err) {
      submitting.current = false;
      setSubmittingUi(false);
      toast.error(err.response?.data?.message || "Could not submit the exam. Please try again");
    }
  };

  // ---------- answer actions ----------
  const updateAnswer = (q, patch) => {
    const prev = answers[q._id] || { selected: [], marked: false };
    const next = { ...prev, ...patch };
    setAnswers((a) => ({ ...a, [q._id]: next }));
    persist(q._id, next.selected, next.marked);
  };

  const selectOption = (q, i) => {
    const prev = answers[q._id]?.selected || [];
    let selected;
    if (q.type === "multiple") {
      selected = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
    } else {
      selected = [i];
    }
    updateAnswer(q, { selected });
  };

  // ---------- render ----------
  if (loading || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-indigo-600">
        <Loader2 className="animate-spin" size={36} />
        <p className="text-slate-500">Loading exam...</p>
      </div>
    );
  }

  const q = questions[current];
  const a = answers[q._id] || { selected: [], marked: false };

  const isAnswered = (qq) => (answers[qq._id]?.selected?.length || 0) > 0;
  const isMarked = (qq) => Boolean(answers[qq._id]?.marked);
  const answeredCount = questions.filter(isAnswered).length;
  const markedCount = questions.filter(isMarked).length;
  const unansweredCount = questions.length - answeredCount;

  const timerClass =
    remaining <= 60
      ? "bg-red-50 text-red-600 animate-pulse"
      : remaining <= 300
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div
  className="min-h-screen bg-slate-50 select-none"
  onContextMenu={(e) => e.preventDefault()}
  onCopy={(e) => e.preventDefault()}
>
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="font-semibold text-slate-900 truncate">{exam.title}</h1>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-semibold ${timerClass}`}>
              <Timer size={18} />
              {fmt(remaining)}
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={submittingUi}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {submittingUi ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              <span className="hidden sm:inline">Submit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Question */}
        <motion.div
          key={q._id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-slate-500">
              Question {current + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                {q.marks} {q.marks === 1 ? "mark" : "marks"}
              </span>
              {exam.negativeMarking > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">
                  -{exam.negativeMarking}
                </span>
              )}
            </div>
          </div>

          <h2 className="text-lg md:text-xl font-semibold text-slate-900 whitespace-pre-wrap">{q.text}</h2>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            {q.type === "multiple" ? "Select all that apply" : "Select one answer"}
          </p>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = a.selected.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => selectOption(q, i)}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                    selected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-8 h-8 shrink-0 flex items-center justify-center text-sm font-semibold ${
                      q.type === "multiple" ? "rounded-lg" : "rounded-full"
                    } ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-slate-800">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                onClick={() => updateAnswer(q, { marked: !a.marked })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                  a.marked
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Flag size={16} />
                {a.marked ? "Marked" : "Mark for review"}
              </button>
              <button
                onClick={() => updateAnswer(q, { selected: [] })}
                disabled={a.selected.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
              >
                <Eraser size={16} /> Clear
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrent((c) => c - 1)}
                disabled={current === 0}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setCurrent((c) => c + 1)}
                disabled={current === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Palette */}
        <aside className="bg-white rounded-2xl border border-slate-200 p-5 h-fit lg:sticky lg:top-24">
          <h3 className="font-semibold text-slate-900 mb-4">Question palette</h3>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((qq, i) => {
              const answered = isAnswered(qq);
              const marked = isMarked(qq);
              let cls = "bg-white border-slate-200 text-slate-600 hover:border-slate-400";
              if (marked) cls = "bg-amber-100 border-amber-300 text-amber-800";
              else if (answered) cls = "bg-emerald-500 border-emerald-500 text-white";
              return (
                <button
                  key={qq._id}
                  onClick={() => setCurrent(i)}
                  className={`h-10 rounded-lg border text-sm font-semibold transition ${cls} ${
                    i === current ? "ring-2 ring-indigo-600 ring-offset-2" : ""
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500" /> Answered</span>
              <b>{answeredCount}</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-300" /> Marked</span>
              <b>{markedCount}</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded border border-slate-300" /> Not answered</span>
              <b>{unansweredCount}</b>
            </div>
          </div>
        </aside>
      </main>

      {/* Submit confirmation */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={22} />
                </span>
                <h2 className="text-lg font-semibold text-slate-900">Submit exam?</h2>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-emerald-50 rounded-xl py-3">
                  <p className="text-xl font-bold text-emerald-700">{answeredCount}</p>
                  <p className="text-xs text-emerald-700">Answered</p>
                </div>
                <div className="bg-slate-50 rounded-xl py-3">
                  <p className="text-xl font-bold text-slate-700">{unansweredCount}</p>
                  <p className="text-xs text-slate-500">Not answered</p>
                </div>
                <div className="bg-amber-50 rounded-xl py-3">
                  <p className="text-xl font-bold text-amber-700">{markedCount}</p>
                  <p className="text-xs text-amber-700">Marked</p>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                cannot change ans or return back to the exam after submition
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Return to the exam
                </button>
                <button
                  onClick={() => finishExam(false)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  submit exam
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}