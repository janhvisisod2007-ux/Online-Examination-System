import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["single", "multiple", "truefalse"],
      default: "single",
    },
    options: [{ type: String, required: true }],
    correctAnswers: [{ type: Number, required: true }], // option indexes
    marks: { type: Number, default: 1 },
    explanation: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);