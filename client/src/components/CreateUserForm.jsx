"use client"

import { useState } from "react"
import { Button } from "./ui/button.jsx"
import { User } from "lucide-react"

const CreateUserForm = ({ onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role: "user",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.password.trim()) {
      setError("All fields are required")
      return
    }    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      
      const res = await fetch(`http://localhost:3000/api/admin/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.status === 201) {
        setSuccessMessage("User created successfully!")
        setFormData({ name: "", password: "", role: "user" })
        setError("")

        if (onUserCreated) {
          setTimeout(() => {
            onUserCreated()
          }, 1000)
        }
      } else {
        setError(data.message || "Something went wrong")
      }
    } catch (err) {
      setError("Server error. Please try again later.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="flex gap-x-2 items-center text-2xl font-semibold text-white">
            <User />
            <h2>Register New User</h2>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
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
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {successMessage && <div className="text-green-500 text-sm">{successMessage}</div>}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default CreateUserForm
