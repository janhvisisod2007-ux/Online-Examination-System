import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { confirm } from "../../components/ConfirmDialog";

import {
  ArrowLeft,
  Plus,
  Clock,
  Award,
  ListChecks,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  HelpCircle,
  Sparkles,
  Users,
} from "lucide-react";

import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import QuestionFormModal from "../../components/QuestionFormModal";
import AIGenerateModal from "../../components/AIGenerateModal";

const typeLabel = {
  single: "Single choice",
  multiple: "Multiple choice",
  truefalse: "True / False",
};

export default function ExamDetail() {
  const { id } = useParams();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({
    open: false,
    question: null,
  });

  const [aiOpen, setAiOpen] = useState(false);

  // Load Exam Details
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/exams/${id}`);

        setExam(data.exam);
        setQuestions(data.questions);
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Could not load the exam"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // Calculate Total Marks
  const totalMarks = questions.reduce(
    (sum, q) => sum + q.marks,
    0
  );

  // Add or Update Question
  const handleSaved = (question, isEdit) => {
    setQuestions((prev) =>
      isEdit
        ? prev.map((q) =>
            q._id === question._id ? question : q
          )
        : [...prev, question]
    );
  };

  // Add AI Generated Questions
  const handleAiAdded = (newQuestions) => {
    setQuestions((prev) => [...prev, ...newQuestions]);
  };

  // Delete Question
 const handleDelete = async (q) => {
  const ok = await confirm({
    title: "Delete this question?",
    message: "This question will be permanently removed from the exam.",
    confirmText: "Delete question",
    variant: "danger",
  });
  if (!ok) return;

  try {
    await api.delete(`/exams/${id}/questions/${q._id}`);
    setQuestions((prev) => prev.filter((x) => x._id !== q._id));
    toast.success("Question deleted");
  } catch (err) {
    toast.error(err.response?.data?.message || "Could not delete the question");
  }
};

  // Publish / Unpublish Exam
  const handleTogglePublish = async () => {
    try {
      const { data } = await api.patch(`/exams/${id}/publish`);

      setExam(data);

      toast.success(
        data.isPublished
          ? "Exam published"
          : "Exam unpublished"
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not update the publish status"
      );
    }
  };

  // Loading Screen
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

  // Exam Not Found
  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <div className="text-center py-32">
          <p className="text-slate-600 mb-4">
            Exam not found
          </p>

          <Link
            to="/teacher"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Back Button */}
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-4"
        >
          <ArrowLeft size={16} />
          Back to exams
        </Link>

        {/* Exam Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {exam.title}
              </h1>

              {exam.description && (
                <p className="text-sm text-slate-500 mt-1">
                  {exam.description}
                </p>
              )}
            </div>

            {/* Header */}
<div className="flex flex-wrap gap-2">
  <Link
    to={`/teacher/exams/${id}/results`}
    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
  >
    <Users size={16} /> Results
  </Link>

  <button
    onClick={handleTogglePublish}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition ${
      exam.isPublished
        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
        : "bg-emerald-600 text-white hover:bg-emerald-700"
    }`}
  >
    {exam.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
    {exam.isPublished ? "Unpublish" : "Publish"}
  </button>
</div>
          </div>

          {/* Exam Information */}
          <div className="flex flex-wrap gap-6 mt-5 text-sm text-slate-600">

            <span className="flex items-center gap-2">
              <ListChecks size={16} />
              {questions.length} questions
            </span>

            <span className="flex items-center gap-2">
              <Award size={16} />
              {totalMarks} marks
            </span>

            <span className="flex items-center gap-2">
              <Clock size={16} />
              {exam.duration} minutes
            </span>

            {exam.negativeMarking > 0 && (
              <span>
                Negative: -{exam.negativeMarking} per wrong
              </span>
            )}

          </div>
        </div>

        {/* Questions Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

          <h2 className="text-lg font-semibold text-slate-900">
            Questions
          </h2>

          <div className="flex flex-wrap gap-2">

            {/* AI Generate Button */}
            <button
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 font-semibold hover:bg-violet-100 transition"
            >
              <Sparkles size={18} />
              Generate with AI
            </button>

            {/* Add Question Button */}
            <button
              onClick={() =>
                setModal({
                  open: true,
                  question: null,
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
            >
              <Plus size={18} />
              Add question
            </button>

          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (

          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">

            <HelpCircle
              className="mx-auto text-slate-300"
              size={48}
            />

            <h3 className="mt-4 text-lg font-semibold text-slate-700">
              No questions yet
            </h3>

            <p className="text-slate-500 mt-1">
              Add at least 1 question to publish this exam
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {questions.map((q, idx) => (

              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 p-5"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="flex gap-3 min-w-0">

                    <span className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>

                    <div className="min-w-0">

                      <p className="font-medium text-slate-900 whitespace-pre-wrap">
                        {q.text}
                      </p>

                      <div className="flex gap-2 mt-2">

                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {typeLabel[q.type] || q.type}
                        </span>

                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          {q.marks} {q.marks === 1 ? "mark" : "marks"}
                        </span>

                      </div>
                    </div>
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="flex gap-1 shrink-0">

                    <button
                      onClick={() =>
                        setModal({
                          open: true,
                          question: q,
                        })
                      }
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(q)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </div>

                {/* Question Options */}
                <div className="mt-4 grid sm:grid-cols-2 gap-2">

                  {q.options.map((opt, i) => {

                    const correct = q.correctAnswers.includes(i);

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                          correct
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >

                        <span className="font-semibold text-xs opacity-60">
                          {String.fromCharCode(65 + i)}
                        </span>

                        <span className="flex-1">
                          {opt}
                        </span>

                        {correct && (
                          <Check
                            size={16}
                            className="text-emerald-600 shrink-0"
                          />
                        )}

                      </div>
                    );
                  })}

                </div>

                {/* Explanation */}
                {q.explanation && (
                  <p className="mt-3 text-sm text-slate-500">

                    <span className="font-medium text-slate-600">
                      Explanation:
                    </span>

                    {" "}{q.explanation}

                  </p>
                )}

              </motion.div>

            ))}

          </div>
        )}

      </main>

      {/* Question Form Modal */}
      <AnimatePresence>
        {modal.open && (
          <QuestionFormModal
            examId={id}
            question={modal.question}
            onClose={() =>
              setModal({
                open: false,
                question: null,
              })
            }
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {aiOpen && (
          <AIGenerateModal
            examId={id}
            onClose={() => setAiOpen(false)}
            onAdded={handleAiAdded}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
