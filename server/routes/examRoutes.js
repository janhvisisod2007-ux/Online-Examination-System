import express from "express";
import rateLimit from "express-rate-limit";
import {
  createExam, getMyExams, getExam, updateExam, deleteExam, togglePublish,
  addQuestion, updateQuestion, deleteQuestion,
  generateQuestions, addQuestionsBulk, getExamResults,
  getBankTopics, generateFromBank,
} from "../controllers/examController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { message: "AI limit khatam ho gayi, thodi der baad try karo" },
});

router.use(protect, authorize("teacher"));

router.get("/question-bank/topics", getBankTopics);

router.route("/").post(createExam).get(getMyExams);
router.route("/:id").get(getExam).put(updateExam).delete(deleteExam);
router.patch("/:id/publish", togglePublish);
router.get("/:id/results", getExamResults);

router.post("/:id/questions", addQuestion);
router.post("/:id/questions/bulk", addQuestionsBulk);
router.post("/:id/generate-questions", aiLimiter, generateQuestions);
router.post("/:id/generate-from-bank", generateFromBank);
router.route("/:id/questions/:qid").put(updateQuestion).delete(deleteQuestion);

export default router;