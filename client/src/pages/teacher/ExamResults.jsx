import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Users, Trophy, TrendingUp, TrendingDown, Download, Loader2 } from "lucide-react";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";

const labels = ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"];
const medals = ["🥇", "🥈", "🥉"];

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <span className={`p-3 rounded-xl ${color}`}><Icon size={22} /></span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function ExamResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/exams/${id}/results`)
      .then((r) => setData(r.data))
      .catch((err) => toast.error(err.response?.data?.message || "Could not load the results"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center py-32 text-indigo-600"><Loader2 className="animate-spin" size={32} /></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-32">
          <Link to="/teacher" className="text-indigo-600 font-semibold hover:underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const { exam, summary, distribution, questionStats, results } = data;
  const pct = (s) => (exam.totalMarks > 0 ? Math.round((s / exam.totalMarks) * 100) : 0);
  const maxBar = Math.max(...distribution, 1);

  const exportCsv = () => {
    const rows = [
      ["Rank", "Name", "Email", "Score", "Percent", "Correct", "Wrong", "Skipped", "Submitted"],
      ...results.map((r, i) => [
        i + 1, r.name, r.email, r.score, pct(r.score) + "%",
        r.correctCount, r.wrongCount, r.unattemptedCount, new Date(r.submittedAt).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${exam.title}-results.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link to={`/teacher/exams/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft size={16} /> Back to exam
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="text-slate-500">Results & analytics</p>
          </div>
          {results.length > 0 && (
            <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition">
              <Download size={16} /> Download CSV
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Users className="mx-auto text-slate-300" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-slate-700">No one has submitted this exam yet</h3>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Stat icon={Users} label="Submissions" value={summary.attempts} color="bg-indigo-50 text-indigo-600" />
              <Stat icon={TrendingUp} label={`Average (of ${exam.totalMarks})`} value={summary.average} color="bg-emerald-50 text-emerald-600" />
              <Stat icon={Trophy} label="Highest" value={summary.highest} color="bg-amber-50 text-amber-600" />
              <Stat icon={TrendingDown} label={`Pass rate (≥40%)`} value={`${summary.passRate}%`} color="bg-violet-50 text-violet-600" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-5">Score distribution</h2>
                <div className="flex items-end gap-3 h-44">
                  {distribution.map((n, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-xs font-semibold text-slate-600 mb-1">{n}</span>
                      <div
                        className="w-full rounded-t-lg bg-indigo-500"
                        style={{ height: `${(n / maxBar) * 100}%`, minHeight: n ? 6 : 2 }}
                      />
                      <span className="text-[11px] text-slate-500 mt-2">{labels[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question accuracy */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-1">Question-wise accuracy</h2>
                <p className="text-xs text-slate-400 mb-4">
                  <span className="text-emerald-600">■</span> correct <span className="text-red-400">■</span> wrong <span className="text-slate-400">■</span> skipped
                </p>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {questionStats.map((q, i) => {
                    const t = q.correct + q.wrong + q.skipped || 1;
                    return (
                      <div key={q._id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate pr-4 text-slate-700">{i + 1}. {q.text}</span>
                          <span className="font-semibold shrink-0">{Math.round((q.correct / t) * 100)}%</span>
                        </div>
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                          <div className="bg-emerald-500" style={{ width: `${(q.correct / t) * 100}%` }} />
                          <div className="bg-red-400" style={{ width: `${(q.wrong / t) * 100}%` }} />
                          <div className="bg-slate-300" style={{ width: `${(q.skipped / t) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Leaderboard</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-4 font-medium">Rank</th>
                      <th className="py-2 pr-4 font-medium">Student</th>
                      <th className="py-2 pr-4 font-medium">Score</th>
                      <th className="py-2 pr-4 font-medium">%</th>
                      <th className="py-2 pr-4 font-medium text-emerald-600">✓</th>
                      <th className="py-2 pr-4 font-medium text-red-500">✗</th>
                      <th className="py-2 font-medium">Skipped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r._id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 font-semibold">{medals[i] || i + 1}</td>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-900">{r.name}</p>
                          <p className="text-xs text-slate-400">{r.email}</p>
                        </td>
                        <td className="py-3 pr-4 font-semibold">{r.score} / {exam.totalMarks}</td>
                        <td className="py-3 pr-4">{pct(r.score)}%</td>
                        <td className="py-3 pr-4 text-emerald-600">{r.correctCount}</td>
                        <td className="py-3 pr-4 text-red-500">{r.wrongCount}</td>
                        <td className="py-3 text-slate-500">{r.unattemptedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}