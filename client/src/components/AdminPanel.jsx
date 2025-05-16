import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button.jsx";
import { useUser } from "../context/useUser.js";
import CreateUserForm from "./CreateUserForm.jsx";
import UpdateUserForm from "./UpdateUserForm.jsx";

const AdminPanel = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [updateUser, setUpdateUser] = useState(null);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(
    async (cursor = null) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("You must be logged in to view this page");
          setLoading(false);
          navigate("/");
          return;
        }

        const response = await fetch(
          `http://localhost:3000/api/admin/users${
            cursor ? `?cursor=${cursor}` : ""
          }`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          setError("You are not authorized to access this page");
          setLoading(false);
          navigate("/");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        if (cursor) {
          setUsers((prevUsers) => [...prevUsers, ...data.users]);
        } else {
          setUsers(data.users);
        }

        setNextCursor(data.nextCursor);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to fetch users: " + error.message);
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to perform this action");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      alert("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchUsers(nextCursor);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">
          Admin Panel - User Management
        </h1>
        <Button
          onClick={() => setShowCreateUserForm(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          Create New User
        </Button>
      </div>

      {error && (
        <div className="bg-red-800 text-white p-3 sm:p-4 rounded-md mb-4 sm:mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-300">
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                      {user.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                      {user.role}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setUpdateUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-xs"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nextCursor && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-300">
            No users found. Create your first user by clicking the "Create New
            User" button.
          </div>
        )}
      </div>

      {showCreateUserForm && (
        <CreateUserForm
          onClose={() => setShowCreateUserForm(false)}
          onUserCreated={() => {
            setShowCreateUserForm(false);
            fetchUsers();
          }}
        />
      )}

      {updateUser && (
        <UpdateUserForm
          user={updateUser}
          onClose={() => setUpdateUser(null)}
          onUserUpdated={() => {
            setUpdateUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default AdminPanel;
