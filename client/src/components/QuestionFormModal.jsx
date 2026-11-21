import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import api from "../api/axios";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

const types = [
  { value: "single", label: "Single choice" },
  { value: "multiple", label: "Multiple choice" },
  { value: "truefalse", label: "True / False" },
];

export default function QuestionFormModal({ examId, question, onClose, onSaved }) {
  const isEdit = Boolean(question);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: question?.type || "single",
    text: question?.text || "",
    options: question ? [...question.options] : ["", "", "", ""],
    correct: question ? [...question.correctAnswers] : [],
    marks: question?.marks ?? 1,
    explanation: question?.explanation || "",
  });

  const setType = (type) => {
    if (type === form.type) return;
    if (type === "truefalse") {
      setForm({ ...form, type, options: ["True", "False"], correct: [0] });
    } else if (form.type === "truefalse") {
      setForm({ ...form, type, options: ["", "", "", ""], correct: [] });
    } else {
      // single <-> multiple
      setForm({ ...form, type, correct: type === "single" ? form.correct.slice(0, 1) : form.correct });
    }
  };

  const setOption = (i, value) => {
    const options = [...form.options];
    options[i] = value;
    setForm({ ...form, options });
  };

  const addOption = () => {
    if (form.options.length >= 6) return;
    setForm({ ...form, options: [...form.options, ""] });
  };

  const removeOption = (i) => {
    setForm({
      ...form,
      options: form.options.filter((_, idx) => idx !== i),
      correct: form.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)),
    });
  };

  const toggleCorrect = (i) => {
    if (form.type === "multiple") {
      setForm({
        ...form,
        correct: form.correct.includes(i)
          ? form.correct.filter((c) => c !== i)
          : [...form.correct, i],
      });
    } else {
      setForm({ ...form, correct: [i] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const options = form.options.map((o) => o.trim());
    if (!form.text.trim()) return toast.error("Please enter the question");
    if (options.some((o) => !o)) return toast.error("Fill in all options or remove the empty ones");
    if (form.correct.length === 0) return toast.error("Select at least 1 correct answer");

    const payload = {
      text: form.text.trim(),
      type: form.type,
      options,
      correctAnswers: [...form.correct].sort((a, b) => a - b),
      marks: Number(form.marks),
      explanation: form.explanation.trim(),
    };

    setLoading(true);
    try {
      const { data } = isEdit
        ? await api.put(`/exams/${examId}/questions/${question._id}`, payload)
        : await api.post(`/exams/${examId}/questions`, payload);
      toast.success(isEdit ? "Question updated" : "Question added");
      onSaved(data, isEdit);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isTF = form.type === "truefalse";
  const isMulti = form.type === "multiple";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit question" : "Add question"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type */}
          <div className="grid grid-cols-3 gap-2">
            {types.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setType(t.value)}
                className={`py-2 rounded-xl text-sm font-medium border-2 transition ${
                  form.type === t.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Question *</label>
            <textarea
              rows={3}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Type your question here"
              className={inputClass}
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Options *</label>
              <span className="text-xs text-slate-400">
                {isMulti ? "Tick all correct options" : "Select the correct answer"}
              </span>
            </div>

            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type={isMulti ? "checkbox" : "radio"}
                    name="correct"
                    checked={form.correct.includes(i)}
                    onChange={() => toggleCorrect(i)}
                    className="w-4 h-4 accent-emerald-600 shrink-0 cursor-pointer"
                  />
                  <span className="w-6 text-sm font-semibold text-slate-400">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    readOnly={isTF}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className={`${inputClass} ${form.correct.includes(i) ? "border-emerald-300 bg-emerald-50/50" : ""}`}
                  />
                  {!isTF && form.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isTF && form.options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={16} /> Add option
              </button>
            )}
          </div>

          {/* Marks + explanation */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marks</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Explanation (optional)</label>
              <input
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                placeholder="Shown to students in the results"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {isEdit ? "Save changes" : "Add question"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}