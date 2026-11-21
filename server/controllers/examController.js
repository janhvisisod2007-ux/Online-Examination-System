import Attempt from "../models/Attempt.js";
import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import questionBank from "../data/questionBank.js";

// ---------- helpers ----------

// exam ka totalMarks questions se recalculate karo
const updateTotalMarks = async (examId) => {
  const questions = await Question.find({ exam: examId });
  const total = questions.reduce((sum, q) => sum + q.marks, 0);
  await Exam.findByIdAndUpdate(examId, { totalMarks: total });
};

// exam dhoondo + check karo ki ye teacher ka hi hai
const getOwnedExam = async (examId, userId) => {
  const exam = await Exam.findById(examId);
  if (!exam) return { error: { code: 404, message: "Exam not found" } };
  if (exam.createdBy.toString() !== userId.toString()) {
    return { error: { code: 403, message: "You do not have access to this exam" } };
  }
  return { exam };
};

const validateQuestion = ({ text, type, options, correctAnswers }) => {
  if (!text || !Array.isArray(options) || options.length < 2) {
    return "A question needs text and at least 2 options";
  }
  if (!Array.isArray(correctAnswers) || correctAnswers.length === 0) {
    return "Select at least 1 correct answer";
  }
  if (correctAnswers.some((i) => !Number.isInteger(i) || i < 0 || i >= options.length)) {
    return "Correct answer indexes must refer to valid options";
  }
  if ((type === "single" || type === "truefalse") && correctAnswers.length !== 1) {
    return "Single choice and true/false questions must have exactly 1 correct answer";
  }
  return null;
};

// ---------- EXAM ----------

export const createExam = async (req, res) => {
  try {
    const { title, description, subject, duration, negativeMarking, startTime, endTime } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ message: "Title and duration are required" });
    }

    const exam = await Exam.create({
      title, description, subject, duration, negativeMarking, startTime, endTime,
      createdBy: req.user._id,
    });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExam = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const questions = await Question.find({ exam: exam._id }).sort({ createdAt: 1 });
    res.json({ exam, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const fields = ["title", "description", "subject", "duration", "negativeMarking", "startTime", "endTime"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) exam[f] = req.body[f];
    });

    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    await Question.deleteMany({ exam: exam._id });
    await exam.deleteOne();
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    if (!exam.isPublished) {
      const count = await Question.countDocuments({ exam: exam._id });
      if (count === 0) {
        return res.status(400).json({ message: "Add at least 1 question before publishing" });
      }
    }

    exam.isPublished = !exam.isPublished;
    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- QUESTIONS ----------

export const addQuestion = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const problem = validateQuestion(req.body);
    if (problem) return res.status(400).json({ message: problem });

    const { text, type, options, correctAnswers, marks, explanation } = req.body;
    const question = await Question.create({
      exam: exam._id, text, type, options, correctAnswers, marks, explanation,
    });

    await updateTotalMarks(exam._id);
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const question = await Question.findOne({ _id: req.params.qid, exam: exam._id });
    if (!question) return res.status(404).json({ message: "Question not found" });

    const merged = { ...question.toObject(), ...req.body };
    const problem = validateQuestion(merged);
    if (problem) return res.status(400).json({ message: problem });

    ["text", "type", "options", "correctAnswers", "marks", "explanation"].forEach((f) => {
      if (req.body[f] !== undefined) question[f] = req.body[f];
    });
    await question.save();

    await updateTotalMarks(exam._id);
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const question = await Question.findOneAndDelete({ _id: req.params.qid, exam: exam._id });
    if (!question) return res.status(404).json({ message: "Question not found" });

    await updateTotalMarks(exam._id);
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- AI QUESTION GENERATION ----------

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildPrompt = ({ topic, notes, count, difficulty, type }) => {
  const typeRule = {
    single: 'Every question must have "type": "single" with exactly 4 options and exactly 1 correct answer.',
    multiple: 'Every question must have "type": "multiple" with exactly 4 options and 2 or 3 correct answers.',
    truefalse: 'Every question must have "type": "truefalse" with options ["True","False"] and exactly 1 correct answer.',
    mixed: 'Use a mix of types: mostly "single" (4 options, 1 correct), some "multiple" (4 options, 2-3 correct) and a few "truefalse" (options ["True","False"], 1 correct).',
  }[type];

  return `You are an expert exam setter. Create exactly ${count} multiple-choice questions for an online exam.

Topic: ${topic}
Difficulty: ${difficulty}
${notes ? `Base the questions ONLY on the following study material:\n"""\n${notes}\n"""\n` : ""}
Rules:
- ${typeRule}
- Questions must be clear, unambiguous, factually correct and different from each other.
- Wrong options must be plausible, not silly.
- Include a one-sentence explanation of the correct answer.
- "correctAnswers" holds the 0-based indexes of the correct options.

Respond with ONLY a valid JSON array, no markdown fences, no extra text. Each item must look like:
{"text": "...", "type": "single", "options": ["...","...","...","..."], "correctAnswers": [1], "explanation": "..."}`;
};

// AI provider switch: anthropic ya gemini (.env ke AI_PROVIDER se)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Gemini: demand/rate-limit errors par retry, phir optional fallback model
const callGemini = async (prompt) => {
  const models = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    process.env.GEMINI_FALLBACK_MODEL,
  ].filter(Boolean);

  let lastError = "Gemini API error";

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      let r;
      try {
        r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
            signal: AbortSignal.timeout(90000),
          }
        );
      } catch (e) {
        // network error: internet/VPN/firewall/DNS/timeout
        const reason = e.cause?.code || e.cause?.message || e.message;
        lastError = `Could not connect to Gemini (${reason}). Check your internet connection or VPN`;
        console.error(`Gemini (${model}) attempt ${attempt} network error:`, reason);
        if (attempt < 3) await sleep(attempt * 2500);
        continue;
      }

      const data = await r.json().catch(() => ({}));

      if (r.ok) {
        return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
      }

      lastError = data?.error?.message || "Gemini API error";
      console.error(`Gemini (${model}) attempt ${attempt} failed [${r.status}]:`, lastError);

      // sirf temporary errors pe retry (429 limit, 500/503 high demand)
      if (![429, 500, 503].includes(r.status)) throw new Error(lastError);
      if (attempt < 3) await sleep(attempt * 2500);
    }
  }

  throw new Error(lastError);
};

// AI provider switch: anthropic ya gemini (.env ke AI_PROVIDER se)
const callAI = async (prompt) => {
  const provider = process.env.AI_PROVIDER || "anthropic";

  if (provider === "gemini") return callGemini(prompt);

  // default: anthropic
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-5-5",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "AI service error");
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
};

export const generateQuestions = async (req, res) => {
  try {
    const { error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const provider = process.env.AI_PROVIDER || "anthropic";
    const keyName = provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY";
    if (!process.env[keyName]) {
      return res.status(500).json({ message: `Server is missing ${keyName} (check the .env file)` });
    }

    const topic = String(req.body.topic || "").trim();
    const notes = String(req.body.notes || "").trim().slice(0, 8000);
    const count = Math.min(20, Math.max(1, parseInt(req.body.count, 10) || 10));
    const difficulty = ["easy", "medium", "hard"].includes(req.body.difficulty) ? req.body.difficulty : "medium";
    const type = ["single", "multiple", "truefalse", "mixed"].includes(req.body.type) ? req.body.type : "mixed";
    const marks = Number(req.body.marks) > 0 ? Number(req.body.marks) : 1;

    if (!topic) return res.status(400).json({ message: "Please enter a topic" });

    let raw;
    try {
      raw = await callAI(buildPrompt({ topic, notes, count, difficulty, type }));
    } catch (e) {
      console.error("AI API error:", e.message);
      return res.status(502).json({ message: e.message });
    }

    const parseFail = { message: "Could not read the AI response. Please try again" };
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) {
      console.error("AI raw response:", raw);
      return res.status(502).json(parseFail);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      console.error("AI raw response:", raw);
      return res.status(502).json(parseFail);
    }

    const questions = [];
    for (const item of parsed) {
      const qType = ["single", "multiple", "truefalse"].includes(item.type) ? item.type : "single";
      let options =
        qType === "truefalse"
          ? ["True", "False"]
          : Array.isArray(item.options) ? item.options.map((o) => String(o).trim()) : [];
      let correct = Array.isArray(item.correctAnswers) ? item.correctAnswers.map(Number) : [];
      const text = String(item.text || "").trim();

      // galat format wala question skip
      if (validateQuestion({ text, type: qType, options, correctAnswers: correct })) continue;

      // AI aksar sahi answer ek hi position pe rakhta hai, isliye options shuffle
      if (qType !== "truefalse") {
        const order = shuffle(options.map((_, i) => i));
        options = order.map((i) => options[i]);
        correct = correct.map((c) => order.indexOf(c)).sort((a, b) => a - b);
      }

      questions.push({
        text,
        type: qType,
        options,
        correctAnswers: correct,
        marks,
        explanation: String(item.explanation || "").trim(),
      });
    }

    if (questions.length === 0) {
      return res.status(502).json({ message: "No valid questions were generated. Please try again" });
    }

    res.json({ questions: questions.slice(0, count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// preview ke baad chune hue questions ek saath save karo
export const addQuestionsBulk = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0 || questions.length > 50) {
      return res.status(400).json({ message: "Send between 1 and 50 questions" });
    }

    for (const [i, q] of questions.entries()) {
      const problem = validateQuestion(q);
      if (problem) return res.status(400).json({ message: `Question ${i + 1}: ${problem}` });
    }

    const docs = questions.map((q) => ({
      exam: exam._id,
      text: q.text,
      type: q.type,
      options: q.options,
      correctAnswers: q.correctAnswers,
      marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
      explanation: q.explanation || "",
    }));

    const created = await Question.insertMany(docs);
    await updateTotalMarks(exam._id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------- RESULTS / ANALYTICS ----------

const sameAnswers = (a, b) =>
  a.length === b.length &&
  [...a].sort((x, y) => x - y).join() === [...b].sort((x, y) => x - y).join();

export const getExamResults = async (req, res) => {
  try {
    const { exam, error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const [attempts, questions] = await Promise.all([
      Attempt.find({ exam: exam._id, status: "submitted" })
        .populate("student", "name email")
        .sort({ score: -1, submittedAt: 1 }),
      Question.find({ exam: exam._id }).sort({ createdAt: 1 }),
    ]);

    const total = exam.totalMarks || 0;
    const percentOf = (s) => (total > 0 ? (s / total) * 100 : 0);
    const scores = attempts.map((a) => a.score);
    const count = scores.length;

    const summary = {
      attempts: count,
      average: count ? +(scores.reduce((s, x) => s + x, 0) / count).toFixed(2) : 0,
      highest: count ? Math.max(...scores) : 0,
      lowest: count ? Math.min(...scores) : 0,
      passRate: count
        ? Math.round((attempts.filter((a) => percentOf(a.score) >= 40).length / count) * 100)
        : 0,
    };

    // 0-20, 20-40, 40-60, 60-80, 80-100 (%)
    const distribution = [0, 0, 0, 0, 0];
    attempts.forEach((a) => {
      distribution[Math.min(4, Math.floor(percentOf(a.score) / 20))]++;
    });

    const questionStats = questions.map((q) => {
      let correct = 0, wrong = 0, skipped = 0;
      attempts.forEach((a) => {
        const ans = a.answers.find((x) => x.question.toString() === q._id.toString());
        if (!ans || ans.selected.length === 0) skipped++;
        else if (sameAnswers(ans.selected, q.correctAnswers)) correct++;
        else wrong++;
      });
      return { _id: q._id, text: q.text, correct, wrong, skipped };
    });

    res.json({
      exam: { _id: exam._id, title: exam.title, totalMarks: exam.totalMarks },
      summary,
      distribution,
      questionStats,
      results: attempts.map((a) => ({
        _id: a._id,
        name: a.student?.name || "Deleted user",
        email: a.student?.email || "",
        score: a.score,
        correctCount: a.correctCount,
        wrongCount: a.wrongCount,
        unattemptedCount: a.unattemptedCount,
        submittedAt: a.submittedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- QUESTION BANK (bina AI ke) ----------

export const getBankTopics = (req, res) => {
  res.json(
    Object.entries(questionBank).map(([topic, qs]) => ({ topic, count: qs.length }))
  );
};

export const generateFromBank = async (req, res) => {
  try {
    const { error } = await getOwnedExam(req.params.id, req.user._id);
    if (error) return res.status(error.code).json({ message: error.message });

    const pool = questionBank[req.body.topic];
    if (!pool) return res.status(400).json({ message: "This topic is not in the question bank" });

    const type = ["single", "multiple", "truefalse"].includes(req.body.type) ? req.body.type : null;
    const count = Math.min(50, Math.max(1, parseInt(req.body.count, 10) || 10));
    const marks = Number(req.body.marks) > 0 ? Number(req.body.marks) : 1;

    const filtered = type ? pool.filter((q) => q.type === type) : pool;
    if (filtered.length === 0) {
      return res.status(400).json({ message: "This topic has no questions of this type" });
    }

    const questions = shuffle(filtered)
      .slice(0, count)
      .map((q) => {
        let options = [...q.options];
        let correct = [...q.correctAnswers];

        // True/False ke options fixed rehte hain, baaki shuffle
        if (q.type !== "truefalse") {
          const order = shuffle(options.map((_, i) => i));
          options = order.map((i) => q.options[i]);
          correct = q.correctAnswers.map((c) => order.indexOf(c)).sort((a, b) => a - b);
        }

        return {
          text: q.text,
          type: q.type,
          options,
          correctAnswers: correct,
          marks,
          explanation: q.explanation || "",
        };
      });

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};