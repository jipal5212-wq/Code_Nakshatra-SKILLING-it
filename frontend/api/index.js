const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-Memory Data Stores ───
const students = [];
const progress = [];
const gamification = [];
const quizzes = [];
const badges = [];
const projects = [];

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

const STREAK_MILESTONES = [
  { days: 3, xp: 50, badge: "on_fire" },
  { days: 7, xp: 100, badge: "unstoppable" },
  { days: 30, xp: 500, badge: "month_master" },
  { days: 76, xp: 1000, badge: "industry_ready_builder" },
];

const LEADERBOARD_WEIGHTS = { projects_completed: 0.4, quiz_average_score: 0.3, total_xp_points: 0.2, days_streak: 0.1 };

const genId = () => crypto.randomUUID();

function getGamification(studentId) {
  let g = gamification.find(x => x.student_id === studentId);
  if (!g) {
    g = { student_id: studentId, total_xp_points: 0, current_streak_days: 0, longest_streak_days: 0, badges_earned: [], quiz_scores: [], weekly_rankings: [], last_activity_date: null };
    gamification.push(g);
  }
  return g;
}

// ─── Routes ───
app.post('/api/students/register', (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name required' });
  const existing = students.find(s => s.email === email);
  if (existing) return res.json({ student: existing, message: 'Already registered' });
  const student = { student_id: genId(), email, name, cohort_number: req.body.cohort_number || 1, domain_interest: req.body.domain_interest || 'general', timezone: req.body.timezone || 'UTC', discord_username: '', enrollment_date: new Date().toISOString(), preferred_learning_time: '6AM', github_profile: '' };
  students.push(student);
  getGamification(student.student_id);
  res.status(201).json({ student, message: 'Registered successfully' });
});

app.get('/api/students/:id', (req, res) => {
  const student = students.find(s => s.student_id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json({ student });
});

app.get('/api/students/:id/progress', (req, res) => {
  const sp = progress.filter(p => p.student_id === req.params.id);
  const g = getGamification(req.params.id);
  const dc = sp.filter(p => p.lesson_completed).length;
  res.json({ days_completed: dc, total_days: 76, completion_percent: Math.round((dc / 76) * 100), current_streak: g.current_streak_days, longest_streak: g.longest_streak_days, total_xp: g.total_xp_points, progress_entries: sp });
});

app.post('/api/progress/complete', (req, res) => {
  const { student_id, day_number, project_submitted, project_url } = req.body;
  if (!student_id || !day_number) return res.status(400).json({ error: 'student_id and day_number required' });
  const existing = progress.find(p => p.student_id === student_id && p.day_number === day_number);
  if (existing) return res.json({ message: 'Already completed', progress: existing });
  progress.push({ student_id, day_number, lesson_completed: true, video_watched_percent: 100, project_submitted: project_submitted || false, project_url: project_url || '', completion_date: new Date().toISOString(), time_spent_minutes: 60 });
  const g = getGamification(student_id);
  let baseXp = 50;
  if (project_submitted) baseXp += 100;
  g.total_xp_points += baseXp;
  const now = new Date();
  const lastAct = g.last_activity_date ? new Date(g.last_activity_date) : null;
  const diffH = lastAct ? (now - lastAct) / 36e5 : 999;
  g.current_streak_days = diffH <= 48 ? g.current_streak_days + 1 : 1;
  if (g.current_streak_days > g.longest_streak_days) g.longest_streak_days = g.current_streak_days;
  g.last_activity_date = now.toISOString();
  const newBadges = [];
  for (const m of STREAK_MILESTONES) {
    if (g.current_streak_days >= m.days && !g.badges_earned.includes(m.badge)) {
      g.badges_earned.push(m.badge);
      g.total_xp_points += m.xp;
      const b = { badge_id: genId(), student_id, badge_name: m.badge, earned_date: now.toISOString(), rarity: m.days >= 30 ? 'legendary' : m.days >= 7 ? 'epic' : 'rare', description: `Achieved ${m.days}-day streak` };
      badges.push(b);
      newBadges.push(b);
    }
  }
  res.json({ message: 'Lesson completed!', xp_earned: baseXp, total_xp: g.total_xp_points, current_streak: g.current_streak_days, new_badges: newBadges, quiz_unlocked: day_number % 7 === 0, quiz_week: day_number % 7 === 0 ? Math.floor(day_number / 7) : null });
});

app.get('/api/quiz/:weekNumber', (req, res) => {
  const week = parseInt(req.params.weekNumber);
  const questions = quizBank[week] || quizBank[1];
  res.json({ week, questions: questions.map((q, i) => ({ id: i, q: q.q, options: q.options })), time_limit_minutes: 45, total_questions: questions.length });
});

app.post('/api/quiz/submit', (req, res) => {
  const { student_id, week_number, answers } = req.body;
  if (!student_id || !week_number || !answers) return res.status(400).json({ error: 'Missing fields' });
  const questions = quizBank[week_number] || quizBank[1];
  let cc = 0;
  answers.forEach((a, i) => { if (questions[i] && a === questions[i].correct) cc++; });
  const sp = Math.round((cc / questions.length) * 100);
  const qe = { quiz_id: genId(), student_id, week_number, questions_answered: answers.length, score_percent: sp, submission_date: new Date().toISOString(), retry_count: quizzes.filter(q => q.student_id === student_id && q.week_number === week_number).length, unlocked_content: null };
  let ua = '', xb = 0;
  if (sp >= 86) { ua = 'unlock_next_week_plus_bonus'; qe.unlocked_content = 'next_week + advanced'; xb = sp * 5; }
  else if (sp >= 71) { ua = 'unlock_next_week_plus_basics'; qe.unlocked_content = 'next_week'; xb = sp * 3; }
  else if (sp >= 51) { ua = 'unlock_next_week'; qe.unlocked_content = 'next_week'; xb = sp * 2; }
  else { ua = 'retry_in_48h'; qe.unlocked_content = 'retry_materials'; xb = sp; }
  quizzes.push(qe);
  const g = getGamification(student_id);
  g.quiz_scores.push(sp);
  g.total_xp_points += xb;
  const nb = [];
  if (sp >= 70 && !g.badges_earned.includes(`quiz_week_${week_number}`)) {
    g.badges_earned.push(`quiz_week_${week_number}`);
    const b = { badge_id: genId(), student_id, badge_name: `quiz_week_${week_number}`, earned_date: new Date().toISOString(), rarity: sp >= 90 ? 'legendary' : 'epic', description: `Passed Week ${week_number} Quiz with ${sp}%` };
    badges.push(b);
    nb.push(b);
  }
  res.json({ quiz: qe, score: sp, correct: cc, total: questions.length, unlock_action: ua, xp_earned: xb, total_xp: g.total_xp_points, new_badges: nb, can_retry: sp < 50 });
});

app.get('/api/leaderboard', (req, res) => {
  const r = students.map(s => {
    const g = getGamification(s.student_id);
    const sp = projects.filter(p => p.student_id === s.student_id);
    const aq = g.quiz_scores.length > 0 ? g.quiz_scores.reduce((a, b) => a + b, 0) / g.quiz_scores.length : 0;
    const sc = (sp.length * LEADERBOARD_WEIGHTS.projects_completed * 100) + (aq * LEADERBOARD_WEIGHTS.quiz_average_score) + (g.total_xp_points * LEADERBOARD_WEIGHTS.total_xp_points * 0.1) + (g.current_streak_days * LEADERBOARD_WEIGHTS.days_streak * 50);
    return { student_id: s.student_id, name: s.name, projects_completed: sp.length, quiz_score: Math.round(aq), xp_points: g.total_xp_points, streak_days: g.current_streak_days, badges: g.badges_earned, score: Math.round(sc) };
  });
  r.sort((a, b) => b.score - a.score);
  r.forEach((x, i) => { x.rank = i + 1; });
  res.json({ leaderboard: r.slice(0, 50), total_students: students.length });
});

app.get('/api/badges/:studentId', (req, res) => {
  res.json({ badges: badges.filter(b => b.student_id === req.params.studentId) });
});

app.get('/api/streak/:studentId', (req, res) => {
  const g = getGamification(req.params.studentId);
  res.json({ current_streak: g.current_streak_days, longest_streak: g.longest_streak_days, last_activity: g.last_activity_date, milestones: STREAK_MILESTONES.map(m => ({ target_days: m.days, reward_xp: m.xp, badge: m.badge, achieved: g.current_streak_days >= m.days, progress_percent: Math.min(100, Math.round((g.current_streak_days / m.days) * 100)) })) });
});

app.get('/api/analytics/:studentId/weekly', (req, res) => {
  const g = getGamification(req.params.studentId);
  const sp = progress.filter(p => p.student_id === req.params.studentId);
  const now = new Date();
  const wa = new Date(now - 7 * 864e5);
  const rp = sp.filter(p => new Date(p.completion_date) >= wa);
  res.json({ lessons_completed_this_week: rp.length, projects_deployed_this_week: rp.filter(p => p.project_submitted).length, streak_status: g.current_streak_days, total_xp: g.total_xp_points, total_lessons_completed: sp.length });
});

app.post('/api/projects/submit', (req, res) => {
  const { student_id, github_url, deployed_url, tags } = req.body;
  const p = { project_id: genId(), student_id, github_url: github_url || '', deployed_url: deployed_url || '', peer_reviews: [], final_score: null, submission_date: new Date().toISOString(), tags: tags || [] };
  projects.push(p);
  const g = getGamification(student_id);
  g.total_xp_points += 150;
  res.status(201).json({ project: p, xp_earned: 150, total_xp: g.total_xp_points });
});

app.get('/api/projects/pending-review/:studentId', (req, res) => {
  const pending = projects.filter(p => p.student_id !== req.params.studentId && !p.peer_reviews.some(r => r.reviewer_id === req.params.studentId));
  res.json({ projects: pending.slice(0, 3) });
});

app.post('/api/projects/review', (req, res) => {
  const { project_id, reviewer_id, code_quality, functionality, creativity, documentation, comments } = req.body;
  const project = projects.find(p => p.project_id === project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.student_id === reviewer_id) return res.status(400).json({ error: 'Cannot review own project' });
  if (project.peer_reviews.some(r => r.reviewer_id === reviewer_id)) return res.status(400).json({ error: 'Already reviewed' });

  const score = (Number(code_quality) + Number(functionality) + Number(creativity) + Number(documentation)) / 20 * 100;
  project.peer_reviews.push({ reviewer_id, scores: { code_quality, functionality, creativity, documentation }, comments: comments || '', total_score: Math.round(score), date: new Date().toISOString() });
  
  let finalScoreCalculated = false;
  if (project.peer_reviews.length >= 2) {
    const total = project.peer_reviews.reduce((acc, curr) => acc + curr.total_score, 0);
    project.final_score = Math.round(total / project.peer_reviews.length);
    finalScoreCalculated = true;
    const authorG = getGamification(project.student_id);
    authorG.total_xp_points += Math.round(project.final_score * 2);
  }

  const reviewerG = getGamification(reviewer_id);
  reviewerG.total_xp_points += 50;
  res.json({ message: 'Review submitted', xp_earned: 50, total_xp: reviewerG.total_xp_points, project_finalized: finalScoreCalculated });
});

app.get('/api/hello', (req, res) => { res.json({ message: 'Hello from the S-KILLING IT backend!' }); });
app.get('/api/health', (req, res) => { res.json({ status: 'ok', students: students.length }); });

module.exports = app;
