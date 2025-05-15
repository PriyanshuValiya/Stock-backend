import { useState } from "react";
import { Button } from "./components/ui/button.jsx";
import Header from "./components/Header.jsx";
import LoginForm from "./components/LoginForm.jsx";

function App() {
  const [loginModal, setLoginModal] = useState({
    isOpen: false,
    userType: null,
  });

  const handleLoginClick = () => {
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
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Welcome to Stock Management</h1>
        <p className="mb-4">Please login to access the system.</p>
      </main>

      {loginModal.isOpen && (
        <LoginForm
          userType={loginModal.userType}
          onClose={closeLoginModal}
        />
      )}
    </div>
  );
}

export default App;
