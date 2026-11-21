import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { X, Loader2, Sparkles, Check, RefreshCw, SlidersHorizontal } from "lucide-react";
import api from "../api/axios";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

const sourceOptions = [
  { value: "bank", label: "Question bank (instant)" },
  { value: "ai", label: "AI (custom topic)" },
];

const typeOptions = [
  { value: "mixed", label: "Mixed" },
  { value: "single", label: "Single" },
  { value: "multiple", label: "Multiple" },
  { value: "truefalse", label: "True/False" },
];

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const typeLabel = { single: "Single choice", multiple: "Multiple choice", truefalse: "True / False" };

const MAX_QUESTIONS = 20;
const clampCount = (v) => Math.min(MAX_QUESTIONS, Math.max(1, Math.floor(Number(v)) || 10));

function Segmented({ options, value, onChange }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`py-2 rounded-xl text-sm font-medium border-2 transition ${
            value === o.value
              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
              : "border-slate-200 text-slate-500 hover:border-slate-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AIGenerateModal({ examId, onClose, onAdded }) {
  const [step, setStep] = useState("form"); // form | loading | preview
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({
    source: "bank",
    bankTopic: "",
    topic: "",
    notes: "",
    count: 10,
    difficulty: "medium",
    type: "mixed",
    marks: 1,
  });
  const [generated, setGenerated] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const isBank = form.source === "bank";

  useEffect(() => {
    api
      .get("/exams/question-bank/topics")
      .then(({ data }) => {
        setTopics(data);
        if (data.length) setForm((f) => ({ ...f, bankTopic: data[0].topic }));
      })
      .catch(() => {});
  }, []);

  const generate = async (e) => {
    e?.preventDefault?.();

    if (isBank && !form.bankTopic) {
      setStep("form");
      return toast.error("Please select a topic");
    }
    if (!isBank && !form.topic.trim()) {
      setStep("form");
      return toast.error("Please enter a topic");
    }

    const count = clampCount(form.count);
    const marks = Number(form.marks) > 0 ? Number(form.marks) : 1;
    setForm((f) => ({ ...f, count, marks }));

    setStep("loading");
    try {
      const { data } = isBank
        ? await api.post(`/exams/${examId}/generate-from-bank`, {
            topic: form.bankTopic,
            count,
            type: form.type,
            marks,
          })
        : await api.post(`/exams/${examId}/generate-questions`, { ...form, count, marks });

      setGenerated(data.questions);
      setSelected(data.questions.map((_, i) => i));
      setStep("preview");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not generate questions");
      setStep("form");
    }
  };

  const toggle = (i) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const save = async () => {
    const chosen = generated.filter((_, i) => selected.includes(i));
    if (chosen.length === 0) return toast.error("Select at least 1 question");

    setSaving(true);
    try {
      const { data } = await api.post(`/exams/${examId}/questions/bulk`, { questions: chosen });
      toast.success(`${data.length} questions added`);
      onAdded(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the questions");
    } finally {
      setSaving(false);
    }
  };

  const busy = step === "loading" || saving;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      onClick={busy ? undefined : onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Sparkles size={20} className="text-violet-600" />
            {step === "preview" ? "Review generated questions" : "Auto-generate questions"}
          </h2>
          {!busy && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X size={20} />
            </button>
          )}
        </div>

        {/* STEP 1: form */}
        {step === "form" && (
          <form onSubmit={generate} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Source</label>
              <Segmented
                options={sourceOptions}
                value={form.source}
                onChange={(v) => setForm({ ...form, source: v })}
              />
            </div>

            {isBank ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic *</label>
                <select
                  value={form.bankTopic}
                  onChange={(e) => setForm({ ...form, bankTopic: e.target.value })}
                  className={inputClass}
                >
                  {topics.map((t) => (
                    <option key={t.topic} value={t.topic}>
                      {t.topic} ({t.count} questions)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic *</label>
                  <input
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    placeholder="e.g. Indian Constitution, Photosynthesis, React hooks"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Study material <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Paste study notes here to generate questions from specific material."
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of questions (max {MAX_QUESTIONS})
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setForm({ ...form, count: n })}
                    className={`w-12 py-2 rounded-xl text-sm font-medium border-2 transition ${
                      Number(form.count) === n
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max={MAX_QUESTIONS}
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: e.target.value })}
                  onBlur={() => setForm((f) => ({ ...f, count: clampCount(f.count) }))}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {!isBank && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <Segmented
                  options={difficultyOptions}
                  value={form.difficulty}
                  onChange={(v) => setForm({ ...form, difficulty: v })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Question type</label>
              <Segmented
                options={typeOptions}
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
              />
            </div>

            <div className="w-32">
              <label className="block text-sm font-medium text-slate-700 mb-1">Marks each</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
              >
                <Sparkles size={16} /> Generate
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: loading */}
        {step === "loading" && (
          <div className="p-16 flex flex-col items-center text-center">
            <Loader2 className="animate-spin text-violet-600" size={40} />
            <p className="mt-5 font-semibold text-slate-800">
              {isBank ? "Picking questions..." : "Generating questions with AI..."}
            </p>
            {!isBank && (
              <p className="text-sm text-slate-500 mt-1">
                {form.count} questions can take 10-60 seconds. Please keep this window open.
              </p>
            )}
          </div>
        )}

        {/* STEP 3: preview */}
        {step === "preview" && (
          <div className="p-6">
            {generated.length < Number(form.count) && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {isBank
                  ? `Only ${generated.length} questions are available for this topic and type (${form.count} requested).`
                  : `The AI generated only ${generated.length} valid questions (${form.count} requested). Press Regenerate to try again.`}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                {selected.length} of {generated.length} selected
              </p>
              <button
                onClick={() =>
                  setSelected(selected.length === generated.length ? [] : generated.map((_, i) => i))
                }
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {selected.length === generated.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="space-y-3">
              {generated.map((q, i) => {
                const on = selected.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggle(i)}
                    className={`rounded-xl border-2 p-4 cursor-pointer transition ${
                      on ? "border-indigo-300 bg-white" : "border-slate-200 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 w-5 h-5 shrink-0 rounded flex items-center justify-center border-2 ${
                          on ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
                        }`}
                      >
                        {on && <Check size={14} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {i + 1}. {q.text}
                        </p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {typeLabel[q.type]}
                        </span>

                        <div className="mt-3 grid sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => {
                            const correct = q.correctAnswers.includes(oi);
                            return (
                              <div
                                key={oi}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                                  correct
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 text-slate-700"
                                }`}
                              >
                                <span className="text-xs font-semibold opacity-60">
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {correct && <Check size={14} className="text-emerald-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <p className="mt-2 text-xs text-slate-500">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-5 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("form")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  <SlidersHorizontal size={16} /> Change settings
                </button>
                <button
                  onClick={() => generate()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-violet-700 bg-violet-50 hover:bg-violet-100 font-medium"
                >
                  <RefreshCw size={16} /> Regenerate
                </button>
              </div>
              <button
                onClick={save}
                disabled={saving || selected.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                Add {selected.length} questions
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}