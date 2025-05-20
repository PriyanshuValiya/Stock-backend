"use client"

import { useState, useEffect } from "react"
import { UserContext } from "./userContextDefinition.js"

export { UserContext }

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const tokenParts = token.split(".")
        if (tokenParts.length !== 3) {
          console.error("Invalid token format")
          localStorage.removeItem("token")
          setLoading(false)
          return
        }
      } catch (tokenError) {
        console.error("Error parsing token:", tokenError)
        localStorage.removeItem("token")
        setUser(null)
        setLoading(false)
        return
      }

      const adminResponse = await fetch("https://stock-backend-zeta.vercel.app/api/admin/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        setUser({
          id: adminData.id,
          name: adminData.name || adminData.email,
          role: "admin",
        })
        setLoading(false)
        return
      }

      if (adminResponse.status === 404 || adminResponse.status === 401 || adminResponse.status === 403) {
        const response = await fetch("https://stock-backend-zeta.vercel.app/api/user/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser({
            id: userData.id,
            name: userData.name,
            role: userData.role || "user",
          })
        } else {
          console.error(`User verification failed with status: ${response.status}`)

          if (response.status === 503) {
            try {
              const errorData = await response.json()
              console.error(`Database issue: ${errorData.message}`, errorData)
            } catch (parseError) {
              console.error("Could not parse error response", parseError)
            }
          } else if (response.status === 401) {
            console.error("Authentication failed. Removing token.")
            localStorage.removeItem("token")
          }
        }
      } else {
        console.error(`Admin verification failed with status: ${adminResponse.status}`)

        if (adminResponse.status === 503) {
          try {
            const errorData = await adminResponse.json()
            console.error(`Database issue: ${errorData.message}`, errorData)
          } catch (parseError) {
            console.error("Could not parse admin error response", parseError)
          }
        } else if (adminResponse.status === 401) {
          console.error("Admin authentication failed. Removing token.")
          localStorage.removeItem("token")
        }
      }
    } catch (error) {
      console.error("Error verifying user token:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  return <UserContext.Provider value={{ user, setUser, loading, fetchUserData }}>{children}</UserContext.Provider>
}
