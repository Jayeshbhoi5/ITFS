## Overview

The Innovative Teaching Feedback System (ITFS) is a full-stack web application designed to improve the teaching-learning process by enabling structured interaction between faculty, students, and HODs.

The system allows faculty to upload activities, students to provide feedback, and HODs to analyze faculty performance through dashboards.

---

## Key Features

### 👨‍🏫 Faculty Module

* Upload academic activities (title, description, images/videos)
* View student feedback and ratings
* Dashboard with activity insights
* Manage uploaded content

### 🎓 Student Module

* View all faculty activities
* Provide feedback and ratings
* Track submitted and pending feedback
* User-friendly dashboard

### 💼 HOD Module

* Monitor faculty performance
* View analytics and feedback summaries
* Access department-level insights

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend / Services

* Firebase Authentication
* Firebase Firestore (Database)
* Firebase Hosting

### Tools

* Git & GitHub
* Node.js & npm

---

## 📂 Project Structure

```
src/
 ├── components/        # Reusable UI components
 ├── pages/
 │    ├── FacultyDashboard/
 │    ├── StudentDashboard/
 │    ├── HodDashboard/
 │    └── Auth Pages
 ├── FirebaseAuth.js
 ├── App.jsx
 └── main.jsx
```

---

## 🔐 Authentication

* Google Authentication (Firebase)
* Role-based access (Student / Faculty / HOD)
* Secure session management

---

## ⚙️ Installation & Setup

### Clone Repository

```bash
git clone https://github.com/your-username/ITFS.git
cd ITFS
```

### Install Dependencies

```bash
npm install
```

### Run Project

```bash
npm run dev
```

---

## 🔥 Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Google Sign-In)
3. Create Firestore Database
4. Add your Firebase config in the project

---

## 🚀 Future Enhancements

* AI-based feedback analysis
* Real-time notifications
* Mobile application version
* Advanced analytics dashboard

---

## Author

Jayesh Bhoi

---

## Notes

* Built for academic and practical learning purposes
* Designed with scalability and real-world usability in mind

---

## ⭐ Support

If you find this project useful, consider giving it a star on GitHub.
