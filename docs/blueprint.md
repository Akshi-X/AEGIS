# **App Name**: ExamLab

## Core Features:

- PC Registration and Management: PCs register on first load with PC Name, IP Address, and Unique Identifier. Secure authentication with encrypted device tokens. Admin approval/rejection workflow. Approved PCs persist for future sessions. Recovery logic ensures that if a PC restarts, the mapped student can rejoin the ongoing exam.
- Student Management: CRUD operations for student records. Bulk CSV/Excel import with validation and per-row error feedback. Fields: Name, Roll Number (unique), Class/Batch, Optional contact details. Roll number uniqueness enforced.
- Question Management with AI Assistance: Add and manage MCQ questions with Question Text (supports LaTeX/Math), Options (2–6 choices), Correct Option(s), Category (Easy/Medium/Hard), Weight, Optional negative marking. AI suggests tags and difficulty levels from question text. Search/filter across question bank.
- Exam Scheduling and Configuration: Parameters: Title, Description, Start Time, Duration, Question Selection: Manual or Auto (N per category), Shuffle Options, Timer. Advanced settings: Negative marking toggle, Pause/Resume exams, Result visibility.
- Student–PC–Exam Mapping: Admin maps students to approved PCs. Mapped PC immediately displays student details. Mapping stored in DB and survives disconnects/restarts.
- Real-Time Exam Interface: Student view includes: Exam details, Student details, and Question navigation panel. Features: Auto-save answers, Manual save option, Auto-submit on timer expiry, Resume exam after crash/reconnect. Modes: Question-at-once, Question-by-question.
- Admin Monitoring Dashboard: Real-time monitoring of: Active PCs, Assigned students, Exam progress. Alerts for offline PCs and missing submissions. Controls: Start/Pause/End exams, Force submission. Reporting: Student-wise results, Difficulty-level breakdown, Export CSV/PDF.

## Style Guidelines:

- Primary Color: Dark Slate Blue (#374785)
- Background: Very Light Gray (#F0F2F5)
- Accent: Soft Orange (#D98E38)
- Font: 'Inter' (Sans-serif, legible on screens)
- Icons: Simple monochrome line icons
- Layout: Clear dashboard sections (PCs, Students, Questions, Exams)
- UX: Subtle animations for feedback; no distractions