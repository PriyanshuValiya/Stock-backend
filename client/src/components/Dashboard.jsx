"use client";

import { useUser } from "../context/useUser.js";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "./ui/button.jsx";
import StockMarket from "./StockMarket.jsx";

const Dashboard = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);

  return (
    <main className="container mx-auto py-8 px-4">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {user ? (
            <div>
              {user.role === "admin" && (
                <div className="bg-gray-800 p-6 rounded-lg mt-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">
                    Admin Quick Links
                  </h2>
                  <div className="flex flex-col space-y-3">
                    <Link to="/admin/users">
                      <Button className="w-full md:w-auto">Manage Users</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <p className="mb-4">
                Please login to access all features of the system.
              </p>
            </div>
          )}

          <StockMarket />
        </>
      )}
    </main>
  );
};

export default Dashboard;
