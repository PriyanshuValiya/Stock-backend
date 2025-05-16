import { useState } from "react";
import { Button } from "./ui/button.jsx";

const UpdateUserForm = ({ user, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Username cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(
        `https://stock-backend-zeta.vercel.app/api/admin/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update user");
      }

      onUserUpdated();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.message || "An error occurred while updating the user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Update User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-800 border border-red-700 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Username
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New password"
            />{" "}
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-400">
              <span className="font-medium">Role:</span> {user.role}
            </p>
            <p className="text-sm text-gray-400">
              <span className="font-medium">User ID:</span> {user.id}
            </p>
            {user.createdAt && (
              <p className="text-sm text-gray-400">
                <span className="font-medium">Created:</span>{" "}
                {new Date(user.createdAt).toLocaleString()}
              </p>
            )}
            {user.updatedAt && (
              <p className="text-sm text-gray-400">
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(user.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              className="bg-gray-600 hover:bg-gray-700"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateUserForm;
