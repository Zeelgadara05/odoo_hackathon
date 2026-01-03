# odoo_hackathon
Zeel gadara

# 🏢 Dayflow - Human Resource Management System
> **"Every workday, perfectly aligned."**

![Dayflow Banner](https://via.placeholder.com/1000x300?text=Dayflow+HRMS+-+Stealth+UI)

## 📖 Abstract
**Dayflow** is a modern, full-stack Human Resource Management System (HRMS) designed to digitize and streamline core HR operations. It replaces manual workforce management with a unified platform for **Employee Onboarding, Attendance Tracking, Leave Management, Payroll Processing, and Internal Communication.**

Built with a **"Stealth Mode" Titanium & Carbon UI**, Dayflow focuses on reducing eye strain while providing a high-performance, professional user experience.

---

## 🚀 Key Features

### 🔐 1. Advanced Security & Authentication
* **Role-Based Access Control (RBAC):** Distinct portals for **HR Admins** and **Employees**.
* **Strict Single-Admin Architecture:** The system intelligently blocks unauthorized attempts to register as an Admin, triggering a security alert log.
* **Secure Authentication:**
    * Password strength enforcement (Regex validation).
    * **Email Verification:** Users must verify their email via a secure link (simulated via Nodemailer) before accessing the dashboard.
    * Encrypted passwords (MD5) and JWT-based session management.

### 👥 2. Employee Profile Management
* **Digital Onboarding:** New employees can register with unique Employee IDs.
* **Document Vault:** Employees can upload Profile Pictures and Identity Documents using `Multer` file handling.
* **Profile Editing:** Employees can update contact details, while Admins retain control over sensitive data like Designation and Department.

### 📅 3. Attendance & Time Tracking
* **Smart Check-In/Out:** Real-time logging of working hours.
* **Status Management:** Support for **Present, Half-Day,** and **Absent** statuses.
* **Admin Override:** HR Admins can "Process Absentees" to bulk-mark employees who missed attendance.
* **Analytics:** Visual bar charts displaying attendance metrics (Present vs. Absent vs. Half-Day).

### 📝 4. Leave Management System
* **Request Workflow:** Employees can apply for Paid, Sick, or Unpaid leave with date ranges and remarks.
* **Approval Dashboard:** Admins can view pending requests and Approve/Reject them with mandatory **HR Remarks**.
* **Notifications:** Automated email alerts inform employees of their leave status changes.

### 💰 5. Payroll & Salary Slips
* **Salary Structure Control:** Admins can define and update the salary for every employee directly from the dashboard.
* **Automated Payslips:** Instant generation of professional **HTML/PDF Salary Slips** for employees to download and print.

### 💬 6. Internal Communication
* **Secure Messaging Channel:** A built-in messaging system allowing disjoint communication between the HR Department and Staff, eliminating the need for external email chains.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js** | Component-based UI with Hooks architecture. |
| **Styling** | **CSS3 (Custom)** | "Stealth Mode" Dark Theme, Glassmorphism, Staggered Animations. |
| **Backend** | **Node.js + Express** | RESTful API architecture. |
| **Database** | **SQLite3** | Serverless, zero-configuration SQL database for portability. |
| **File Handling**| **Multer** | For secure image and document uploads. |
| **Email** | **Nodemailer** | SMTP service for verification and alerts (Ethereal Config). |
| **Auth** | **JWT + MD5** | Token-based session security. |

---

## 📸 Application Preview

### 1. The "Stealth" Dashboard
A minimalist, dark-themed dashboard featuring a "Spotlight" background effect and matte-finish cards for reduced eye strain.

### 2. Admin Console
Centralized control for Payroll, Employee Directory, and Attendance Analytics.

### 3. Salary Slip Generation
One-click generation of detailed, printable payslips for any employee.

---

## ⚙️ Installation & Setup Guide

Follow these steps to run the project locally.

### Prerequisites
* Node.js (v14 or higher)
* npm (Node Package Manager)

### Step 1: Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/dayflow-hrms.git](https://github.com/YOUR_USERNAME/dayflow-hrms.git)
cd dayflow-hrms

```

### Step 2: Backend Setup

```bash
cd server
npm install
# This installs express, sqlite3, cors, nodemon, multer, nodemailer, etc.

# Create the uploads directory for file storage
mkdir uploads

# Start the Backend Server
node server.js

```

*You should see:* `Connected to Dayflow Local Database` and `Email System Ready`.

### Step 3: Frontend Setup

Open a **new terminal** window:

```bash
cd client
npm install
npm start

```

The application will launch automatically at `http://localhost:3000`.

---

## 🧪 How to Test Key Features

1. **Register as Admin:** Sign up with the role "Admin". You will be auto-assigned the "HR" designation.
2. **Verify Email:** Check the **Backend Terminal** console logs. You will see a "Verify Link" (simulated email). Click it to activate the account.
3. **Test Security:** Try registering a *second* Admin account. The system will block it and log a "Security Alert" in the terminal.
4. **Payroll:** Log in as Admin -> Go to "Payroll" -> Click the Document Icon to generate a Salary Slip.
5. **Files:** Go to Settings -> Upload a Profile Picture.

---

## 🔮 Future Enhancements

* **Biometric Integration:** Linking attendance with fingerprint scanners.
* **Mobile App:** A React Native version for on-the-go access.
* **AI Analytics:** Predictive models for employee attrition and performance.

---

### 👨‍🏫 Note to Evaluators

This project was built to demonstrate a complete, production-ready workflow. Key architectural decisions include:

* **SQLite** was chosen over MongoDB/MySQL to ensure the project is fully portable and requires no external database installation to run.
* **Custom CSS** was used instead of libraries (Bootstrap/Tailwind) to demonstrate deep understanding of CSS Grid, Flexbox, Keyframe Animations, and variable-based theming.

---

**Made with 💻 & ☕ by Zeel Gadara,Pratik Kotecha,Manthan Vasoya,Dhruv Aghera**

```

```
