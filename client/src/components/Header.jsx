import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button.jsx";
import { useUser } from "../context/useUser.js";
import CreateUserForm from "./CreateUserForm.jsx";
import { LogOut } from "lucide-react";

const Header = ({ onLoginClick }) => {
  const { user, setUser, loading } = useUser();
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("User in Header:", user);
  }, [user]);
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <header className="flex justify-between items-center py-4 px-6 bg-gray-900 shadow-sm">
      <div className="text-3xl font-bold font-mono text-primary text-white">
        <Link to="/" className="hover:text-gray-300">
          JSC Terminal
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        ) : user ? (
          <>
            {user.role === "admin" && (
              <>
                <Link to="/admin">
                  <Button variant="outline" className="mr-2">
                    Dashboard
                  </Button>
                </Link>
              </>
            )}
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleLogout}
            >
              <LogOut />
              Logout
            </Button>
          </>
        ) : (
          <Button variant="default" onClick={() => onLoginClick()}>
            Login
          </Button>
        )}
      </div>

      {showCreateUserForm && user?.role === "admin" && (
        <CreateUserForm
          onClose={() => setShowCreateUserForm(false)}
          onUserCreated={() => setShowCreateUserForm(false)}
        />
      )}
    </header>
  );
};

export default Header;
