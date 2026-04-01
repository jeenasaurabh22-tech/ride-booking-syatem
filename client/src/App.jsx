import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import UserDashboard from "./pages/UserDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import MyRides from "./pages/MyRides";
import { useAuth } from "./lib/AuthContext";

const ProtectedRoute = ({ role, children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to={`/auth?role=${role}`} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={`/auth?role=${role}`} replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth?role=user" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-rides"
        element={
          <ProtectedRoute role="user">
            <MyRides />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute role="driver">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/auth?role=user" replace />} />
    </Routes>
  );
}

export default App;
