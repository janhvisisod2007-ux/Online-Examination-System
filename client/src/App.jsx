import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ConfirmHost } from "./components/ConfirmDialog";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ExamDetail from "./pages/teacher/ExamDetail";
import ExamResults from "./pages/teacher/ExamResults";
import StudentDashboard from "./pages/student/StudentDashboard";
import ExamTake from "./pages/student/ExamTake";
import ExamResult from "./pages/student/ExamResult";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: "12px", background: "#0f172a", color: "#fff", fontSize: "14px" },
        }}
      />
      <ConfirmHost />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams/:id"
          element={
            <ProtectedRoute role="teacher">
              <ExamDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams/:id/results"
          element={
            <ProtectedRoute role="teacher">
              <ExamResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam/:examId"
          element={
            <ProtectedRoute role="student">
              <ExamTake />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/result/:attemptId"
          element={
            <ProtectedRoute role="student">
              <ExamResult />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}