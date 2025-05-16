import { useContext } from "react";
import { UserContext } from "./UserContext.jsx";

// Custom hook to access user context
export const useUser = () => useContext(UserContext);

export default useUser;
