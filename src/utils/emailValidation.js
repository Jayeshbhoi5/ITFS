// src/utils/emailValidation.js

export const HOD_EMAILS = {
  "hod.instru@kbtcoe.org": "Instrumentation and Control Engineering",
  "hod.civil@kbtcoe.org": "Civil Engineering",
  "hod.mech@kbtcoe.org": "Mechanical Engineering",
  "hod.comp@kbtcoe.org": "Computer Engineering",
  "hod.it@kbtcoe.org": "Information Technology",
  "innovativeteachingfeedback@gmail.com": "Computer Engineering",
  "hod.entc@kbtcoe.org": "Electronics and Telecommunication Engineering",
  "hod.aids@kbtcoe.org": "Artificial Intelligence and Data Science Engineering",
  "hod.mba@kbtcoe.org": "MBA"
};

// Testing faculty emails that bypass the firstname.lastname dot restriction
export const TESTING_FACULTY_EMAILS = [
  "a@kbtcoe.org",
  "b@kbtcoe.org",
  "jwj475.mail@gmail.com"
];

/**
 * Validates whether an email meets the college domain and role requirements.
 * @param {string} email
 * @param {string} role 'Student' | 'Faculty' | 'HOD' | ''
 * @returns {{ isValid: boolean, error: string }}
 */
export const validateCollegeEmail = (email, role = '') => {
  if (!email) {
    return { isValid: false, error: "Please enter your email address" };
  }

  const emailLower = email.trim().toLowerCase();

  // Special exception for system admin email and tester email
  if (
    emailLower === "innovativeteachingfeedback@gmail.com" ||
    emailLower === "jwj475.mail@gmail.com"
  ) {
    return { isValid: true, error: "" };
  }

  // Must end with @kbtcoe.org
  if (!emailLower.endsWith("@kbtcoe.org")) {
    return {
      isValid: false,
      error: "Please enter a valid college email address"
    };
  }

  const prefix = emailLower.split("@")[0];

  // If role is Student or prefix matches student pattern
  if (role === "Student") {
    if (!prefix.startsWith("kbtug") && !prefix.startsWith("stkbtcoe")) {
      return {
        isValid: false,
        error: "Please enter a valid student email address"
      };
    }
  } else if (role === "Faculty") {
    // Check if it's one of the testing emails
    const isTestingEmail = TESTING_FACULTY_EMAILS.includes(emailLower);
    const isHodEmail = HOD_EMAILS.hasOwnProperty(emailLower);

    // Faculty emails should follow firstname.lastname format (contain '.') or be a whitelisted test email / HOD
    if (!isTestingEmail && !isHodEmail) {
      if (!prefix.includes(".")) {
        return {
          isValid: false,
          error: "Please enter a valid faculty email address"
        };
      }
    }
  }

  return { isValid: true, error: "" };
};

/**
 * Validates signup inputs
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @param {string} params.role
 * @returns {{ isValid: boolean, error: string }}
 */
export const validateSignupInput = ({ name, email, password, confirmPassword, role }) => {
  if (!name || !name.trim()) {
    return { isValid: false, error: "Please enter your full name" };
  }
  if (!email || !email.trim()) {
    return { isValid: false, error: "Please enter your email address" };
  }
  if (!password) {
    return { isValid: false, error: "Please enter a password" };
  }
  if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long" };
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }
  if (!role) {
    return { isValid: false, error: "Please select your role (Faculty or Student)" };
  }

  return validateCollegeEmail(email, role);
};
