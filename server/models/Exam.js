import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, default: "" },
    duration: { type: Number, required: true, min: 1 }, // minutes
    totalMarks: { type: Number, default: 0 },
    negativeMarking: { type: Number, default: 0 }, // marks cut per wrong answer
    startTime: { type: Date },
    endTime: { type: Date },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);