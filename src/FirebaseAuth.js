import { auth, db } from "./firebaseConfig";  
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const user = userCredential.user;
        const email = user.email;

        // Check if the user already exists in Firestore
        const userRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userRef);

        let role = "";
        if (userSnap.exists()) {
            // If user exists, get their role
            role = userSnap.data().role;
        } else {
            // 🔥 Auto-assign role based on email format
            if (email.endsWith("@kbtcoe.org")) {
                if (email.includes(".")) {
                    role = "faculty";  // Faculty email format
                } else if (email.startsWith("kbtug") || email.startsWith("stkbtcoe")) {
                    role = "student";  // Student email format
                }
            }

            // If email does not match the pattern, block login
            if (!role) {
                alert("Unauthorized email. Only KBTCOE faculty and students can log in.");
                return;
            }

            // Save user data & role in Firestore
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                role: role,
                createdAt: new Date(),
                departmentChangeCount: 0,  // Initialize counter for new users
                departments: [],  // Initialize empty departments array
                primaryDepartment: ''  // Initialize empty primary department for faculty
            });

            alert(`Welcome ${user.displayName}! You are logged in as ${role}.`);
        }

        return { user, role };  // Return user & role for navigation
    } catch (error) {
        console.error("Error logging in:", error);
    }
};
