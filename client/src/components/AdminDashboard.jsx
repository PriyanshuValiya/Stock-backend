import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button.jsx";
import { useUser } from "../context/useUser.js";

const AdminDashboard = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    } else if (!loading && user?.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate, loading]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold font-mono ml-2">
          Admin Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-5 gap-6">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="flex flex-col justify-between h-full p-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">User Management</h2>
              <p className="text-gray-400 mb-4">
                Create, view, update, and delete users in the system.
              </p>
            </div>
            <Link to="/admin/users">
              <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                Manage Users
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
