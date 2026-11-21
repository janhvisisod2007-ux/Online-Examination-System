import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus, Clock, Award, MinusCircle, Pencil, Trash2,
  Eye, EyeOff, Loader2, ClipboardList, CheckCircle2, FilePen, ArrowRight,
} from "lucide-react";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import ExamFormModal from "../../components/ExamFormModal";
import { confirm } from "../../components/ConfirmDialog";

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

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, exam: null });

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await api.get("/exams");
        setExams(data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handleSaved = (exam, isEdit) => {
    setExams((prev) =>
      isEdit ? prev.map((e) => (e._id === exam._id ? exam : e)) : [exam, ...prev]
    );
  };

  const handleTogglePublish = async (exam) => {
    try {
      const { data } = await api.patch(`/exams/${exam._id}/publish`);
      setExams((prev) => prev.map((e) => (e._id === data._id ? data : e)));
      toast.success(data.isPublished ? "Exam published" : "Exam unpublished");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the publish status");
    }
  };

  const handleDelete = async (exam) => {
  const ok = await confirm({
    title: "Delete this exam?",
    message: `"${exam.title}" and all of its questions will be permanently deleted. This action cannot be undone.`,
    confirmText: "Delete exam",
    variant: "danger",
  });
  if (!ok) return;

  try {
    await api.delete(`/exams/${exam._id}`);
    setExams((prev) => prev.filter((e) => e._id !== exam._id));
    toast.success("Exam deleted");
  } catch (err) {
    toast.error(err.response?.data?.message || "Could not delete the exam");
  }
};

  const published = exams.filter((e) => e.isPublished).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Exams</h1>
            <p className="text-slate-500">Create exams, add questions and publish them</p>
          </div>
          <button
            onClick={() => setModal({ open: true, exam: null })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
          >
            <Plus size={18} />
            New exam
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={ClipboardList} label="Total exams" value={exams.length} color="bg-indigo-50 text-indigo-600" />
          <StatCard icon={CheckCircle2} label="Published" value={published} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={FilePen} label="Drafts" value={exams.length - published} color="bg-amber-50 text-amber-600" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-indigo-600">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <ClipboardList className="mx-auto text-slate-300" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-slate-700">No exams yet</h3>
            <p className="text-slate-500 mt-1">Click "New exam" to create your first exam</p>
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{exam.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{exam.subject || "No subject"}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                      exam.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {exam.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><Clock size={15} /> {exam.duration} min</span>
                  <span className="flex items-center gap-1.5"><Award size={15} /> {exam.totalMarks} marks</span>
                  {exam.negativeMarking > 0 && (
                    <span className="flex items-center gap-1.5"><MinusCircle size={15} /> -{exam.negativeMarking}</span>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/teacher/exams/${exam._id}`)}
                  className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition"
                >
                  Manage questions <ArrowRight size={16} />
                </button>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleTogglePublish(exam)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    {exam.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                    {exam.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => setModal({ open: true, exam })}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(exam)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {modal.open && (
          <ExamFormModal
            exam={modal.exam}
            onClose={() => setModal({ open: false, exam: null })}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}