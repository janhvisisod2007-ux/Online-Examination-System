import express from "express";
import {
  listExams, startExam, getAttempt, saveAnswer, submitAttempt, myAttempts,
} from "../controllers/studentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/exams", listExams);
router.post("/exams/:id/start", startExam);

router.get("/attempts", myAttempts);
router.get("/attempts/:id", getAttempt);
router.put("/attempts/:id/answer", saveAnswer);
router.post("/attempts/:id/submit", submitAttempt);

export default router;