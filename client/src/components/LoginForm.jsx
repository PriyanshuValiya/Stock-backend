import { useState } from "react";
import { Button } from "./ui/button.jsx";
import { useUser } from "../context/UserContext.jsx";

const LoginForm = ({ onClose }) => {
  const [userType, setUserType] = useState("user");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { setUser } = useUser();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
    setFormData({ name: "", email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint =
      userType === "admin"
        ? // eslint-disable-next-line no-undef
          `${process.env.BACKEND_URL}/api/admin/login`
        : // eslint-disable-next-line no-undef
          `${process.env.BACKEND_URL}/api/user/login`;

    const payload =
      userType === "admin"
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 200) {
        alert("Login successful");

        // ✅ Store token
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // ✅ Update user context
        setUser({
          role: userType,
          name: userType === "admin" ? formData.email : formData.name,
        });

        onClose(); // Optional: close modal on successful login
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Server error");
      console.error(err);
    }

    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Login</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="userType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Role
            </label>
            <select
              id="userType"
              value={userType}
              onChange={handleUserTypeChange}
              className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {userType === "user" && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="username"
              />
            </div>
          )}

          {userType === "admin" && (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@email.com"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
