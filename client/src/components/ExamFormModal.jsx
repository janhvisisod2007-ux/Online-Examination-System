import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";
import api from "../api/axios";

// ISO date ko datetime-local input ke format mein badlo
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function ExamFormModal({ exam, onClose, onSaved }) {
  const isEdit = Boolean(exam);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: exam?.title || "",
    subject: exam?.subject || "",
    description: exam?.description || "",
    duration: exam?.duration || 30,
    negativeMarking: exam?.negativeMarking ?? 0,
    startTime: toLocalInput(exam?.startTime),
    endTime: toLocalInput(exam?.endTime),
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      return toast.error("End time must be after the start time");
    }

    const payload = {
      title: form.title,
      subject: form.subject,
      description: form.description,
      duration: Number(form.duration),
      negativeMarking: Number(form.negativeMarking),
      startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
    };

    setLoading(true);
    try {
      const { data } = isEdit
        ? await api.put(`/exams/${exam._id}`, payload)
        : await api.post("/exams", payload);
      toast.success(isEdit ? "Exam updated" : "Exam created");
      onSaved(data, isEdit);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit exam" : "Create new exam"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. JavaScript Basics" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Programming" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Instructions or a short description" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes) *</label>
              <input type="number" min="1" name="duration" value={form.duration} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Negative marking</label>
              <input type="number" min="0" step="0.25" name="negativeMarking" value={form.negativeMarking} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
              <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End time</label>
              <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">
            Start and end times are optional. If left empty, the exam can be taken any time after it is published.
          </p>

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
              {isEdit ? "Save changes" : "Create exam"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}