import { getAuth, signOut } from "firebase/auth";
import { app } from "../../firebaseConfig";

export const handleLogout = (navigate) => {
  navigate('/logout');
};