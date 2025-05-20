"use client"

import { useContext } from "react"
import { UserContext } from "./userContextDefinition.js"

// Custom hook to access user context
export const useUser = () => useContext(UserContext)

export default useUser
