import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import LoginForm from "./components/LoginForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import AdminUsersPage from "./components/AdminUsersPage.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import { useUser } from "./context/useUser.js";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { user } = useUser();
  const [loginModal, setLoginModal] = useState({
    isOpen: false,
    userType: null,
  });

  const handleLoginClick = () => {
    if (user) {
      return;
    }

    setLoginModal({
      isOpen: true,
      userType: null,
    });
  };

  const closeLoginModal = () => {
    setLoginModal({
      isOpen: false,
      userType: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onLoginClick={handleLoginClick} />

      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {loginModal.isOpen && !user && (
        <LoginForm userType={loginModal.userType} onClose={closeLoginModal} />
      )}
    </div>
  );
}

export default App;
