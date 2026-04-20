const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── In-Memory Data Stores ───
const students = [];
const progress = [];
const gamification = [];
const quizzes = [];
const badges = [];
const projects = [];

// ─── Quiz Question Bank (by week) ───
const quizBank = {
  1: [
    { q: "What is the primary function of a Convolutional Layer in a CNN?", options: ["Extract features from input images", "Downsample spatial dimensions", "Classify the final output", "Normalize pixel values"], correct: 0 },
    { q: "Which pooling technique takes the highest value from a feature map patch?", options: ["Average Pooling", "Max Pooling", "Min Pooling", "Sum Pooling"], correct: 1 },
    { q: "In PyTorch, what does `param.requires_grad = False` achieve?", options: ["Deletes the parameter", "Freezes the layer during training", "Resets the weights to zero", "Enables gradient descent"], correct: 1 },
    { q: "Which pre-trained model did we use in the Sprint?", options: ["VGG16", "YOLOv8", "ResNet50", "InceptionV3"], correct: 2 },
    { q: "What is an epoch in model training?", options: ["A single forward pass", "One complete pass through the entire dataset", "The time taken to train", "A batch of images"], correct: 1 },
    { q: "What activation function is typically used for multi-class classification output?", options: ["ReLU", "Sigmoid", "Softmax", "Tanh"], correct: 2 },
    { q: "Which optimization algorithm is an extension of stochastic gradient descent?", options: ["Adam", "Backprop", "Lasso", "Ridge"], correct: 0 },
    { q: "What is the purpose of a loss function?", options: ["To measure model prediction error", "To increase training speed", "To add non-linearity", "To prevent overfitting"], correct: 0 },
    { q: "Overfitting occurs when:", options: ["Model learns the training data too well, failing to generalize", "Model struggles to learn the training data", "Learning rate is too high", "Batch size is too small"], correct: 0 },
    { q: "What technique randomly drops neurons during training to prevent overfitting?", options: ["Data Augmentation", "Early Stopping", "Dropout", "Batch Normalization"], correct: 2 },
    { q: "What does a stride of 2 do in a convolutional layer?", options: ["Doubles the output size", "Halves the spatial dimensions", "Increases parameter count", "No effect on size"], correct: 1 },
    { q: "In object detection, what does 'IoU' stand for?", options: ["Input over Unit", "Intersection over Union", "Index of Units", "Image output Utility"], correct: 1 },
  ]
};

// ─── Streak Milestones from Config ───
const STREAK_MILESTONES = [
  { days: 3, xp: 50, badge: "on_fire" },
  { days: 7, xp: 100, badge: "unstoppable" },
  { days: 30, xp: 500, badge: "month_master" },
  { days: 76, xp: 1000, badge: "industry_ready_builder" },
];

// ─── Leaderboard Weights from Config ───
const LEADERBOARD_WEIGHTS = {
  projects_completed: 0.4,
  quiz_average_score: 0.3,
  total_xp_points: 0.2,
  days_streak: 0.1,
};

// ─── Helper: Generate ID ───
const genId = () => crypto.randomUUID();

// ─── Helper: Get or create gamification record ───
function getGamification(studentId) {
  let g = gamification.find(x => x.student_id === studentId);
  if (!g) {
    g = {
      student_id: studentId,
      total_xp_points: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      badges_earned: [],
      quiz_scores: [],
      weekly_rankings: [],
      last_activity_date: null,
    };
    gamification.push(g);
  }
  return g;
}

// ════════════════════════════════════
// STUDENT ROUTES
// ════════════════════════════════════

app.post('/api/students/register', (req, res) => {
  const { email, name, cohort_number, domain_interest, timezone, discord_username, github_profile, preferred_learning_time } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });

  const existing = students.find(s => s.email === email);
  if (existing) return res.json({ student: existing, message: 'Already registered' });

  const student = {
    student_id: genId(),
    email, name,
    cohort_number: cohort_number || 1,
    domain_interest: domain_interest || 'general',
    timezone: timezone || 'UTC',
    discord_username: discord_username || '',
    enrollment_date: new Date().toISOString(),
    preferred_learning_time: preferred_learning_time || '6AM',
    github_profile: github_profile || '',
  };
  students.push(student);
  getGamification(student.student_id);
  res.status(201).json({ student, message: 'Registered successfully' });
});

app.get('/api/students/:id', (req, res) => {
  const student = students.find(s => s.student_id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json({ student });
});

// ════════════════════════════════════
// PROGRESS ROUTES
// ════════════════════════════════════

app.get('/api/students/:id/progress', (req, res) => {
  const studentProgress = progress.filter(p => p.student_id === req.params.id);
  const g = getGamification(req.params.id);
  const daysCompleted = studentProgress.filter(p => p.lesson_completed).length;
  res.json({
    days_completed: daysCompleted,
    total_days: 76,
    completion_percent: Math.round((daysCompleted / 76) * 100),
    current_streak: g.current_streak_days,
    longest_streak: g.longest_streak_days,
    total_xp: g.total_xp_points,
    progress_entries: studentProgress,
  });
});

app.post('/api/progress/complete', (req, res) => {
  const { student_id, day_number, video_watched_percent, project_submitted, project_url, time_spent_minutes } = req.body;
  if (!student_id || !day_number) return res.status(400).json({ error: 'student_id and day_number required' });

  const existing = progress.find(p => p.student_id === student_id && p.day_number === day_number);
  if (existing) return res.json({ message: 'Already completed', progress: existing });

  const entry = {
    student_id, day_number,
    lesson_completed: true,
    video_watched_percent: video_watched_percent || 100,
    project_submitted: project_submitted || false,
    project_url: project_url || '',
    completion_date: new Date().toISOString(),
    time_spent_minutes: time_spent_minutes || 60,
  };
  progress.push(entry);

  // Award XP
  const g = getGamification(student_id);
  let baseXp = 50;
  if (project_submitted) baseXp += 100;
  g.total_xp_points += baseXp;

  // Update streak
  const now = new Date();
  const lastActivity = g.last_activity_date ? new Date(g.last_activity_date) : null;
  const diffHours = lastActivity ? (now - lastActivity) / (1000 * 60 * 60) : 999;

  if (diffHours <= 48) {
    g.current_streak_days += 1;
  } else {
    g.current_streak_days = 1;
  }
  if (g.current_streak_days > g.longest_streak_days) {
    g.longest_streak_days = g.current_streak_days;
  }
  g.last_activity_date = now.toISOString();

  // Check streak milestones
  const newBadges = [];
  for (const m of STREAK_MILESTONES) {
    if (g.current_streak_days >= m.days && !g.badges_earned.includes(m.badge)) {
      g.badges_earned.push(m.badge);
      g.total_xp_points += m.xp;
      const badge = {
        badge_id: genId(), student_id,
        badge_name: m.badge,
        earned_date: now.toISOString(),
        rarity: m.days >= 30 ? 'legendary' : m.days >= 7 ? 'epic' : 'rare',
        description: `Achieved ${m.days}-day streak`,
      };
      badges.push(badge);
      newBadges.push(badge);
    }
  }

  // Check if quiz should unlock (every 7 days)
  const quizUnlock = day_number % 7 === 0;

  res.json({
    message: 'Lesson completed!',
    xp_earned: baseXp,
    total_xp: g.total_xp_points,
    current_streak: g.current_streak_days,
    new_badges: newBadges,
    quiz_unlocked: quizUnlock,
    quiz_week: quizUnlock ? Math.floor(day_number / 7) : null,
  });
});

// ════════════════════════════════════
// QUIZ ROUTES
// ════════════════════════════════════

app.get('/api/quiz/:weekNumber', (req, res) => {
  const week = parseInt(req.params.weekNumber);
  const questions = quizBank[week] || quizBank[1]; // fallback to week 1
  // Don't send correct answers to client
  const safeQuestions = questions.map((q, i) => ({
    id: i, q: q.q, options: q.options
  }));
  res.json({ week, questions: safeQuestions, time_limit_minutes: 45, total_questions: safeQuestions.length });
});

app.post('/api/quiz/submit', (req, res) => {
  const { student_id, week_number, answers } = req.body;
  if (!student_id || !week_number || !answers) return res.status(400).json({ error: 'Missing fields' });

  const questions = quizBank[week_number] || quizBank[1];
  let correctCount = 0;
  answers.forEach((ans, i) => {
    if (questions[i] && ans === questions[i].correct) correctCount++;
  });

  const scorePercent = Math.round((correctCount / questions.length) * 100);
  const existingRetries = quizzes.filter(q => q.student_id === student_id && q.week_number === week_number);

  const quizEntry = {
    quiz_id: genId(), student_id, week_number,
    questions_answered: answers.length,
    score_percent: scorePercent,
    time_taken_minutes: 0,
    submission_date: new Date().toISOString(),
    retry_count: existingRetries.length,
    unlocked_content: null,
  };

  // Unlock logic from config
  let unlockAction = '';
  let xpBonus = 0;
  if (scorePercent >= 86) {
    unlockAction = 'unlock_next_week_plus_bonus';
    quizEntry.unlocked_content = 'next_week + advanced_challenges';
    xpBonus = scorePercent * 5;
  } else if (scorePercent >= 71) {
    unlockAction = 'unlock_next_week_plus_basics';
    quizEntry.unlocked_content = 'next_week';
    xpBonus = scorePercent * 3;
  } else if (scorePercent >= 51) {
    unlockAction = 'unlock_next_week';
    quizEntry.unlocked_content = 'next_week';
    xpBonus = scorePercent * 2;
  } else {
    unlockAction = 'retry_in_48h';
    quizEntry.unlocked_content = 'retry_materials';
    xpBonus = scorePercent;
  }

  quizzes.push(quizEntry);

  // Update gamification
  const g = getGamification(student_id);
  g.quiz_scores.push(scorePercent);
  g.total_xp_points += xpBonus;

  // Award quiz badge if passed
  const newBadges = [];
  if (scorePercent >= 70 && !g.badges_earned.includes(`quiz_week_${week_number}`)) {
    g.badges_earned.push(`quiz_week_${week_number}`);
    const badge = {
      badge_id: genId(), student_id,
      badge_name: `quiz_week_${week_number}`,
      earned_date: new Date().toISOString(),
      rarity: scorePercent >= 90 ? 'legendary' : 'epic',
      description: `Passed Week ${week_number} Quiz with ${scorePercent}%`,
    };
    badges.push(badge);
    newBadges.push(badge);
  }

  res.json({
    quiz: quizEntry,
    score: scorePercent,
    correct: correctCount,
    total: questions.length,
    unlock_action: unlockAction,
    xp_earned: xpBonus,
    total_xp: g.total_xp_points,
    new_badges: newBadges,
    can_retry: scorePercent < 50,
  });
});

// ════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════

app.get('/api/leaderboard', (req, res) => {
  const rankings = students.map(s => {
    const g = getGamification(s.student_id);
    const studentProjects = projects.filter(p => p.student_id === s.student_id);
    const avgQuiz = g.quiz_scores.length > 0
      ? g.quiz_scores.reduce((a, b) => a + b, 0) / g.quiz_scores.length : 0;

    const score =
      (studentProjects.length * LEADERBOARD_WEIGHTS.projects_completed * 100) +
      (avgQuiz * LEADERBOARD_WEIGHTS.quiz_average_score) +
      (g.total_xp_points * LEADERBOARD_WEIGHTS.total_xp_points * 0.1) +
      (g.current_streak_days * LEADERBOARD_WEIGHTS.days_streak * 50);

    return {
      student_id: s.student_id,
      name: s.name,
      projects_completed: studentProjects.length,
      quiz_score: Math.round(avgQuiz),
      xp_points: g.total_xp_points,
      streak_days: g.current_streak_days,
      badges: g.badges_earned,
      score: Math.round(score),
    };
  });

  rankings.sort((a, b) => b.score - a.score);
  rankings.forEach((r, i) => { r.rank = i + 1; });

  res.json({ leaderboard: rankings.slice(0, 50), total_students: students.length });
});

// ════════════════════════════════════
// BADGES
// ════════════════════════════════════

app.get('/api/badges/:studentId', (req, res) => {
  const studentBadges = badges.filter(b => b.student_id === req.params.studentId);
  res.json({ badges: studentBadges, total: studentBadges.length });
});

// ════════════════════════════════════
// STREAK
// ════════════════════════════════════

app.get('/api/streak/:studentId', (req, res) => {
  const g = getGamification(req.params.studentId);
  const milestoneProgress = STREAK_MILESTONES.map(m => ({
    target_days: m.days,
    reward_xp: m.xp,
    badge: m.badge,
    achieved: g.current_streak_days >= m.days,
    progress_percent: Math.min(100, Math.round((g.current_streak_days / m.days) * 100)),
  }));

  res.json({
    current_streak: g.current_streak_days,
    longest_streak: g.longest_streak_days,
    last_activity: g.last_activity_date,
    milestones: milestoneProgress,
  });
});

// ════════════════════════════════════
// WEEKLY ANALYTICS
// ════════════════════════════════════

app.get('/api/analytics/:studentId/weekly', (req, res) => {
  const g = getGamification(req.params.studentId);
  const studentProgress = progress.filter(p => p.student_id === req.params.studentId);
  const studentQuizzes = quizzes.filter(q => q.student_id === req.params.studentId);
  const studentBadges = badges.filter(b => b.student_id === req.params.studentId);

  // Last 7 days
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const recentProgress = studentProgress.filter(p => new Date(p.completion_date) >= weekAgo);
  const recentQuizzes = studentQuizzes.filter(q => new Date(q.submission_date) >= weekAgo);
  const recentBadges = studentBadges.filter(b => new Date(b.earned_date) >= weekAgo);

  res.json({
    lessons_completed_this_week: recentProgress.length,
    projects_deployed_this_week: recentProgress.filter(p => p.project_submitted).length,
    quiz_scores_this_week: recentQuizzes.map(q => q.score_percent),
    xp_earned_this_week: recentProgress.length * 50,
    streak_status: g.current_streak_days,
    badges_earned_this_week: recentBadges,
    total_lessons_completed: studentProgress.length,
    total_xp: g.total_xp_points,
    ranking: null, // calculated at leaderboard endpoint
  });
});

// ════════════════════════════════════
// PROJECTS
// ════════════════════════════════════

app.post('/api/projects/submit', (req, res) => {
  const { student_id, day_assigned, github_url, deployed_url, tags } = req.body;
  const project = {
    project_id: genId(), student_id,
    day_assigned: day_assigned || 1,
    github_url: github_url || '',
    deployed_url: deployed_url || '',
    peer_reviews: [],
    final_score: null,
    submission_date: new Date().toISOString(),
    tags: tags || [],
  };
  projects.push(project);

  // Award XP for project submission
  const g = getGamification(student_id);
  g.total_xp_points += 150;

  res.status(201).json({ project, xp_earned: 150, total_xp: g.total_xp_points });
});

// ─── Keep original hello route ───
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the S-KILLING IT backend!' });
});

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', students: students.length, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`S-KILLING IT Backend running on port ${PORT}`);
});
