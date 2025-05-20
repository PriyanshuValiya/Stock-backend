"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "../context/useUser.js"
import StockMarket from "./StockMarket.jsx"

const CreateExchangeRedirect = () => {
  const { user, loading } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/", { replace: true })
    }
  }, [user, navigate, loading])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <StockMarket openExchangeForm={false} />
    </div>
  )
}

export default CreateExchangeRedirect
