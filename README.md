# 🎓 Eduvision - AI-Powered Learning Platform

An intelligent education platform combining AI, real-time problem solving, and interactive learning tools.

**🌐 Live Demo:** https://eduvision-app.vercel.app/

---

## ✨ Features

- **📸 MathCam** - Solve math problems by taking photos
- **🧠 AI Professor** - Get instant explanations on any topic
- **📝 Worksheet Generator** - Auto-generate practice worksheets
- **🎮 Quiz Battle** - Compete with others in real-time quizzes
- **💻 Solver Chat** - Interactive math problem solver
- **📊 Exam Master** - Practice full-length exams
- **📓 Notebook Sync** - Sync your notes to cloud
- **🔢 Calculator Widget** - Advanced calculations
- **🌙 Dark/Light Themes** - 3 beautiful theme options
- **☁️ Cloud Features** - Leaderboards, score tracking, and more

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ 
- **npm** or **yarn**

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aadit4604/Eduvision-app.git
   cd Eduvision-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your API keys:
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_GEMINI_API_KEY=your_gemini_api_key
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📋 Prerequisites & Setup

### Get Your API Keys

#### 🔐 Supabase (Optional - for cloud features)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your project URL and anon public key

#### 🤖 Google Gemini API
1. Get your API key from [AI Studio](https://ai.studio)
2. Add to `.env.local`

### Environment Variables
**⚠️ IMPORTANT:** Never commit `.env.local` to git. It's in `.gitignore` for security.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_GEMINI_API_KEY=your_key_here
```

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **AI:** Google Gemini API
- **Backend/DB:** Supabase (PostgreSQL)
- **Build:** Vite
- **Deployment:** Vercel
- **Icons:** Lucide React
- **Charts:** Recharts
- **Math Rendering:** KaTeX

---

## 📦 Project Structure

```
src/
├── components/          # React components
│   ├── ExamMaster.tsx
│   ├── MathCam.tsx
│   ├── Professor.tsx
│   ├── QuizBattle.tsx
│   ├── SolverChat.tsx
│   └── ...
├── lib/                 # Utilities & services
│   ├── supabase.ts      # Supabase client
├── services/            # API services
│   └── geminiService.ts # Gemini API integration
├── App.tsx              # Main app component
└── types.ts             # TypeScript definitions
```

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add Environment Variables (same as `.env.local`)
   - Deploy! 🎉

### Environment Variables on Vercel
Settings → Environment Variables → Add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

---

## 🔒 Security

- API keys stored only in environment variables
- `.env.local` is in `.gitignore` and never committed
- Use Supabase Row-Level Security (RLS) for database
- All sensitive operations use secure tokens

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Support

For issues, questions, or suggestions, please open an [issue](https://github.com/Aadit4604/Eduvision-app/issues) on GitHub.

---

**Made with ❤️ by [Aadit](https://github.com/Aadit4604)**
