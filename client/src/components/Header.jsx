import { useEffect, useState } from "react";
import { Button } from "./ui/button.jsx";
import { useUser } from "../context/UserContext.jsx"; 
import CreateUserForm from "./CreateUserForm.jsx"; 

const Header = ({ onLoginClick }) => {
  const { user } = useUser();  
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);

  useEffect(() => {
    console.log("User in Header:", user);
  }, [user]);

  const handleCreateUserClick = () => {
    setShowCreateUserForm((prev) => !prev);
  };

  return (
    <header className="flex justify-between items-center py-4 px-6 bg-gray-900 shadow-sm">
      <div className="text-3xl font-bold font-mono text-primary text-white">
        JSC Terminal
      </div>

      <div className="flex items-center">
        {user ? (
          user.role === "user" ? (
            <span className="text-white text-lg font-semibold">
              Welcome, {user.name}
            </span>
          ) : (
            <Button
              className="border-2 border-white text-white ml-4"
              variant="varient"
              onClick={handleCreateUserClick}
            >
              Register New User
            </Button>
          )
        ) : (
          <Button variant="default" onClick={() => onLoginClick()}>
            Login
          </Button>
        )}
      </div>

      {showCreateUserForm && user?.role === "admin" && (
        <CreateUserForm onClose={() => setShowCreateUserForm(false)} />
      )}
    </header>
  );
};

export default Header;
