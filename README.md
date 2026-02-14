# 🚀 RecallStack

**RecallStack** is a productivity-focused spaced repetition platform designed to help developers master Data Structures & Algorithms through structured active recall and adaptive review scheduling.

It transforms DSA practice into a long-term retention system.

---

## 🧠 Why RecallStack?

Most developers solve problems… and forget them.

RecallStack ensures:
- Problems are revisited at optimal intervals  
- Weak areas are reinforced frequently  
- Strong concepts fade naturally but never disappear  
- Learning becomes systematic, not random  

---

## ✨ Core Features

- 📌 Add and track DSA problems
- 🔁 Automated spaced repetition (4 → 8 → 16 → 32 days…)
- 🧩 Active recall-first review system
- 💪 Weak / Medium / Strong performance tracking
- 📅 Upcoming reviews (30-day preview)
- 🔥 Heatmap review analytics
- 📊 Performance stats dashboard
- 📁 CSV export
- 🔍 Sortable & filterable problem table

---

## 🛠 Tech Stack

**Frontend**
- React (Vite)
- JavaScript

**Backend**
- Supabase (PostgreSQL + Auth)

**Deployment**
- Vercel

---

## ⚙️ How the Review Engine Works

Each problem follows an adaptive interval model:

| Recall Quality | Interval Update |
|---------------|----------------|
| Strong        | Interval × 2   |
| Medium        | Interval × 1.5 |
| Weak          | Reset to 4 days |

Problems continue reappearing until consistently marked **Strong**, ensuring durable retention.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

