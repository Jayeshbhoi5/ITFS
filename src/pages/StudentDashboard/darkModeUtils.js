// darkModeUtils.js
export const getDarkModeFromStorage = () => {
  return localStorage.getItem("darkMode") === "enabled";
};

export const setDarkModeInStorage = (isDark) => {
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
  
  // Also update the document class immediately
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  try {
    window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { isDark } }));
  } catch (e) {
    // ignore
  }
};

