import { createContext, useState, useEffect } from "react";

// Create the context
export const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      const adminResponse = await fetch("http://localhost:3000/api/admin/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log("Admin data:", adminData);
        setUser({
          id: adminData.id,
          name: adminData.name || adminData.email,
          role: "admin",
        });
        setLoading(false);
        return; 
      }
      
      if (adminResponse.status === 404 || adminResponse.status === 401) {
        const response = await fetch( "http://localhost:3000/api/user/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            name: userData.name,
            role: userData.role || "user",
          });
        } else if (response.status === 503) {
          const errorData = await response.json();
          console.error(`Database issue: ${errorData.message}`, errorData);
        } else {
          localStorage.removeItem("token");
        }
      } else if (adminResponse.status === 503) {
        const errorData = await adminResponse.json();
        console.error(`Database issue: ${errorData.message}`, errorData);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error verifying user token:", error);
      if (error.message && (error.message.includes("relation") || error.message.includes("database"))) {
        console.warn("Database error detected. The database may not be properly initialized.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
};
