import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";

// ---------- helpers ----------

// grading: single/truefalse/multiple sab mein exact match chahiye
const finalizeAttempt = async (attempt) => {
  if (attempt.status === "submitted") return attempt;

  const exam = await Exam.findById(attempt.exam);
  const questions = await Question.find({ exam: attempt.exam });
  const answerMap = new Map(attempt.answers.map((a) => [a.question.toString(), a.selected]));

  let score = 0, correct = 0, wrong = 0, unattempted = 0;

  questions.forEach((q) => {
    const selected = answerMap.get(q._id.toString()) || [];
    if (selected.length === 0) {
      unattempted++;
      return;
    }
    const given = [...selected].sort((a, b) => a - b).join(",");
    const right = [...q.correctAnswers].sort((a, b) => a - b).join(",");

    if (given === right) {
      score += q.marks;
      correct++;
    } else {
      score -= exam.negativeMarking;
      wrong++;
    }
  });

  attempt.score = Math.max(0, score);
  attempt.correctCount = correct;
  attempt.wrongCount = wrong;
  attempt.unattemptedCount = unattempted;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  await attempt.save();
  return attempt;
};

const remainingSeconds = (attempt) =>
  Math.max(0, Math.floor((attempt.expiresAt - Date.now()) / 1000));

// attempt chal raha hai: questions bhejo, par answers/explanation ke bina
const inProgressPayload = async (attempt, exam) => {
  const questions = await Question.find({ exam: exam._id })
    .sort({ createdAt: 1 })
    .select("-correctAnswers -explanation");

  return {
    attemptId: attempt._id,
    status: attempt.status,
    expiresAt: attempt.expiresAt,
    remainingSeconds: remainingSeconds(attempt),
    exam: {
      _id: exam._id,
      title: exam.title,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      negativeMarking: exam.negativeMarking,
    },
    questions,
    answers: attempt.answers,
  };
};

// attempt submit ho chuka: result + review (correct answers ke saath)
const resultPayload = async (attempt, exam) => {
  const questions = await Question.find({ exam: exam._id }).sort({ createdAt: 1 });

  return {
    attemptId: attempt._id,
    status: attempt.status,
    exam: { _id: exam._id, title: exam.title, totalMarks: exam.totalMarks },
    score: attempt.score,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    unattemptedCount: attempt.unattemptedCount,
    submittedAt: attempt.submittedAt,
    review: questions.map((q) => ({
      question: q,
      selected: attempt.answers.find((a) => a.question.toString() === q._id.toString())?.selected || [],
    })),
  };
};

// ---------- controllers ----------

export const listExams = async (req, res) => {
  try {
    const exams = await Exam.find({ isPublished: true })
      .select("-createdBy")
      .sort({ createdAt: -1 });

    const attempts = await Attempt.find({ student: req.user._id }).select("exam status");
    const statusMap = new Map(attempts.map((a) => [a.exam.toString(), a.status]));

    res.json(
      exams.map((e) => ({
        ...e.toObject(),
        attemptStatus: statusMap.get(e._id.toString()) || "not_started",
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const now = new Date();
    if (exam.startTime && now < exam.startTime) {
      return res.status(400).json({ message: "This exam has not started yet" });
    }
    if (exam.endTime && now > exam.endTime) {
      return res.status(400).json({ message: "This exam has ended" });
    }

    let attempt = await Attempt.findOne({ exam: exam._id, student: req.user._id });

    if (attempt) {
      // time khatam ho gaya to auto-submit
      if (attempt.status === "in_progress" && attempt.expiresAt <= now) {
        attempt = await finalizeAttempt(attempt);
      }
      if (attempt.status === "submitted") {
        return res.status(400).json({ message: "You have already attempted this exam", attemptId: attempt._id });
      }
      // chal raha hai: resume karo
      return res.json(await inProgressPayload(attempt, exam));
    }

    // naya attempt: duration ya exam ke endTime, jo pehle ho
    let expiresAt = new Date(now.getTime() + exam.duration * 60 * 1000);
    if (exam.endTime && exam.endTime < expiresAt) expiresAt = exam.endTime;

    attempt = await Attempt.create({
      exam: exam._id,
      student: req.user._id,
      startedAt: now,
      expiresAt,
    });

    res.status(201).json(await inProgressPayload(attempt, exam));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAttempt = async (req, res) => {
  try {
    let attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (attempt.status === "in_progress" && attempt.expiresAt <= new Date()) {
      attempt = await finalizeAttempt(attempt);
    }

    const exam = await Exam.findById(attempt.exam);
    if (attempt.status === "submitted") {
      return res.json(await resultPayload(attempt, exam));
    }
    res.json(await inProgressPayload(attempt, exam));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveAnswer = async (req, res) => {
  try {
    let attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (attempt.status === "submitted") {
      return res.status(400).json({ message: "Exam already submitted" });
    }
    if (attempt.expiresAt <= new Date()) {
      await finalizeAttempt(attempt);
      return res.status(400).json({ message: "Time is up. The exam was auto-submitted" });
    }

    const { questionId, selected = [], markedForReview = false } = req.body;

    const question = await Question.findOne({ _id: questionId, exam: attempt.exam });
    if (!question) return res.status(404).json({ message: "This question does not belong to this exam" });

    if (
      !Array.isArray(selected) ||
      selected.some((i) => !Number.isInteger(i) || i < 0 || i >= question.options.length)
    ) {
      return res.status(400).json({ message: "Invalid option selected" });
    }
    if (question.type !== "multiple" && selected.length > 1) {
      return res.status(400).json({ message: "Only one option can be selected for this question" });
    }

    const existing = attempt.answers.find((a) => a.question.toString() === questionId);
    if (existing) {
      existing.selected = selected;
      existing.markedForReview = markedForReview;
    } else {
      attempt.answers.push({ question: questionId, selected, markedForReview });
    }

    await attempt.save();
    res.json({ message: "Saved", remainingSeconds: remainingSeconds(attempt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    await finalizeAttempt(attempt);
    const exam = await Exam.findById(attempt.exam);
    res.json(await resultPayload(attempt, exam));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const myAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id, status: "submitted" })
      .populate("exam", "title subject totalMarks")
      .sort({ submittedAt: -1 })
      .select("exam score correctCount wrongCount unattemptedCount submittedAt");
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};