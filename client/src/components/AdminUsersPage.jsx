"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button.jsx"
import { useUser } from "../context/useUser.js"
import CreateUserForm from "./CreateUserForm.jsx"
import UpdateUserForm from "./UpdateUserForm.jsx"
import { ArrowDown, Edit, Loader2, PlusIcon, Trash, User } from "lucide-react"

const AdminUsersPage = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [showCreateUserForm, setShowCreateUserForm] = useState(false)
  const [updateUser, setUpdateUser] = useState(null)
  const fetchUsers = useCallback(
    async (cursor = null) => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")

        if (!token) {
          setLoading(false)
          navigate("/")
          return
        }

        const response = await fetch(
          `https://stock-backend-zeta.vercel.app/api/admin/users${cursor ? `?cursor=${cursor}` : ""}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (response.status === 401 || response.status === 403) {
          setLoading(false)
          navigate("/")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await response.json()

        if (cursor) {
          // Append to existing users
          setUsers((prevUsers) => [...prevUsers, ...data.users])
        } else {
          // Replace users
          setUsers(data.users)
        }

        setNextCursor(data.nextCursor)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching users:", error)
        setLoading(false)
      }
    },
    [navigate],
  )
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchUsers()
    }
  }, [user, fetchUsers])

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch(`https://stock-backend-zeta.vercel.app/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      alert(`Failed to delete user: ${error.message}`)
    }
  }

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchUsers(nextCursor)
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-mono font-bold ml-2 mb-4 md:mb-0">User Management</h1>
          <Button onClick={() => setShowCreateUserForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <PlusIcon />
            <User />
          </Button>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {user && users.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-300">
              <div className="flex justify-center items-center gap-x-2">
                <Loader2 className="animate-spin" />
                <p>Loading users...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-12 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-12 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Updated At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.password ? "******" : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.updated_at ? new Date(user.updated_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUpdateUser(user)}
                          className="border-gray-600 hover:bg-gray-700"
                        >
                          <Edit />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {nextCursor && (
            <div className="px-6 py-4 flex justify-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-x-2">
                    <Loader2 className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-x-2">
                    <ArrowDown />
                    Load More
                  </span>
                )}
              </Button>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="px-6 py-8 text-center text-gray-300">
              <p className="text-lg">No users found.</p>
            </div>
          )}
        </div>

        {showCreateUserForm && (
          <CreateUserForm
            onClose={() => setShowCreateUserForm(false)}
            onUserCreated={() => {
              setShowCreateUserForm(false)
              fetchUsers()
            }}
          />
        )}

        {updateUser && (
          <UpdateUserForm
            user={updateUser}
            onClose={() => setUpdateUser(null)}
            onUserUpdated={() => {
              setUpdateUser(null)
              fetchUsers()
            }}
          />
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage
