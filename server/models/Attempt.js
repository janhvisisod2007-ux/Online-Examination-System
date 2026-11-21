import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selected: [{ type: Number }], // option indexes
    markedForReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    answers: [answerSchema],
    status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
    submittedAt: { type: Date },
    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ek student ek exam sirf ek baar de sakta hai
attemptSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.model("Attempt", attemptSchema);