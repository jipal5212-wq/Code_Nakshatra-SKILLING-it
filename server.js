require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

let genAI = null, geminiModel = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// ═══════════════════════════════════════════
//  FILE-BASED DATABASE
// ═══════════════════════════════════════════
const DB_FILE = path.join(__dirname, 'database.json');

let db = {
  accounts: new Map(),   // email -> { id, email, password, role, name }
  users: new Map(),      // userId -> profile
  submissions: [],
  streaks: new Map(),
  tasks: [
    { id: 'task-1', domain: 'AI / ML', level: 'Beginner', title: 'Build a Text Classifier', desc: 'Using Scikit-learn, train a Naive Bayes classifier on a sample dataset.', effort: '~1 hr', ytQuery: 'scikit learn text classification tutorial', assignedBy: 'system', videos: [] },
    { id: 'task-2', domain: 'Web Dev', level: 'Intermediate', title: 'REST API with Node.js', desc: 'Create a CRUD REST API for a todo list using Express.', effort: '~1.5 hrs', ytQuery: 'nodejs express REST API tutorial', assignedBy: 'system', videos: [] },
    { id: 'task-3', domain: 'Robotics', level: 'Beginner', title: 'Arduino Line Follower', desc: 'Write the control logic for a 2-sensor line follower.', effort: '~1 hr', ytQuery: 'arduino line follower robot tutorial', assignedBy: 'system', videos: [] },
    { id: 'task-4', domain: 'Cybersec', level: 'Intermediate', title: 'Scan & Report Vulns', desc: 'Use Nmap to scan a local VM. Document 3 findings.', effort: '~1 hr', ytQuery: 'nmap vulnerability scanning tutorial', assignedBy: 'system', videos: [] },
    { id: 'task-5', domain: 'Data Science', level: 'Beginner', title: 'EDA on Titanic Dataset', desc: 'Load the Titanic CSV in Pandas. Answer key questions.', effort: '~45 min', ytQuery: 'pandas EDA titanic dataset tutorial', assignedBy: 'system', videos: [] },
    { id: 'task-6', domain: 'AI / ML', level: 'Advanced', title: 'Fine-tune a GPT-2 Model', desc: 'Using HuggingFace, fine-tune GPT-2 on custom data.', effort: '~2 hrs', ytQuery: 'huggingface GPT2 fine tune tutorial', assignedBy: 'system', videos: [] }
  ],
  videoPool: [],   // admin-curated videos
  taskAssignments: [],  // admin-assigned tasks to users
  news: [] // admin-posted news
};

// Load database if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    db.accounts = new Map(parsed.accounts);
    db.users = new Map(parsed.users);
    db.streaks = new Map(parsed.streaks);
    db.submissions = parsed.submissions || [];
    db.tasks = parsed.tasks || db.tasks;
    db.videoPool = parsed.videoPool || [];
    db.taskAssignments = parsed.taskAssignments || [];
    db.news = parsed.news || [];
  } catch (err) {
    console.error('Error loading DB:', err);
  }
}

// Seed default admin if missing
if (!db.accounts.has('ashish21@gmail.com')) {
  db.accounts.set('ashish21@gmail.com', {
    id: 'admin-001', email: 'ashish21@gmail.com', password: 'killingit',
    role: 'admin', name: 'Ashish'
  });
}

function saveDB() {
  const data = {
    accounts: Array.from(db.accounts.entries()),
    users: Array.from(db.users.entries()),
    streaks: Array.from(db.streaks.entries()),
    submissions: db.submissions,
    tasks: db.tasks,
    videoPool: db.videoPool,
    taskAssignments: db.taskAssignments,
    news: db.news
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Middleware to auto-save DB after requests
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.method !== 'GET') saveDB();
  });
  next();
});

// ═══════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
  if (db.accounts.has(email)) return res.status(409).json({ error: 'Email already registered' });
  const id = uuidv4();
  const account = { id, email, password, role: role === 'admin' ? 'admin' : 'user', name };
  db.accounts.set(email, account);
  if (account.role === 'user') {
    db.users.set(id, { id, name, email, domain: '', level: '', points: 0, streak: 0, joinedAt: new Date().toISOString(), completedTasks: [] });
    db.streaks.set(id, { current: 0, best: 0, history: [] });
  }
  res.json({ success: true, account: { id, email, role: account.role, name } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const account = db.accounts.get(email);
  if (!account || account.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, account: { id: account.id, email: account.email, role: account.role, name: account.name } });
});

// ═══════════════════════════════════════════
//  USER ROUTES
// ═══════════════════════════════════════════

app.post('/api/users/setup-profile', (req, res) => {
  const { userId, domain, level } = req.body;
  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.domain = domain;
  user.level = level;
  res.json({ success: true, user });
});

app.get('/api/users/:userId', (req, res) => {
  const user = db.users.get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const streak = db.streaks.get(req.params.userId) || { current: 0, best: 0, history: [] };
  res.json({ user, streak });
});

app.get('/api/tasks', (req, res) => {
  let filtered = [...db.tasks];
  if (req.query.domain) filtered = filtered.filter(t => t.domain === req.query.domain);
  if (req.query.level) filtered = filtered.filter(t => t.level === req.query.level);
  res.json({ tasks: filtered });
});

app.post('/api/tasks/confirm', (req, res) => {
  const { userId, taskId } = req.body;
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true, confirmation: { id: uuidv4(), userId, taskId, task, confirmedAt: new Date().toISOString(), deadline: new Date(Date.now() + 86400000).toISOString(), status: 'in-progress' } });
});

app.post('/api/submissions/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { userId, taskId } = req.body;
  const submission = { id: uuidv4(), userId: userId || 'anonymous', taskId: taskId || 'unknown', type: 'file', filename: req.file.filename, originalName: req.file.originalname, size: req.file.size, path: `/uploads/${req.file.filename}`, submittedAt: new Date().toISOString(), status: 'pending-review', points: 0, reviewedBy: null, feedback: '' };
  db.submissions.push(submission);
  if (userId && db.users.has(userId)) {
    const user = db.users.get(userId);
    const streak = db.streaks.get(userId);
    streak.current += 1;
    if (streak.current > streak.best) streak.best = streak.current;
    streak.history.push(new Date().toISOString().split('T')[0]);
    user.streak = streak.current;
  }
  res.json({ success: true, submission });
});

app.post('/api/submissions/github', (req, res) => {
  const { userId, taskId, githubUrl } = req.body;
  if (!githubUrl) return res.status(400).json({ error: 'GitHub URL required' });
  const submission = { id: uuidv4(), userId: userId || 'anonymous', taskId: taskId || 'unknown', type: 'github', githubUrl, submittedAt: new Date().toISOString(), status: 'pending-review', points: 0, reviewedBy: null, feedback: '' };
  db.submissions.push(submission);
  if (userId && db.users.has(userId)) {
    const user = db.users.get(userId);
    const streak = db.streaks.get(userId);
    streak.current += 1;
    if (streak.current > streak.best) streak.best = streak.current;
    streak.history.push(new Date().toISOString().split('T')[0]);
    user.streak = streak.current;
  }
  res.json({ success: true, submission });
});

app.get('/api/submissions', (req, res) => {
  let subs = [...db.submissions];
  if (req.query.userId) subs = subs.filter(s => s.userId === req.query.userId);
  res.json({ submissions: subs.reverse() });
});

app.get('/api/streaks/:userId', (req, res) => {
  const streak = db.streaks.get(req.params.userId);
  if (!streak) return res.status(404).json({ error: 'No streak data' });
  res.json({ streak });
});

// ═══════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════

// Get all users
app.get('/api/admin/users', (req, res) => {
  const users = Array.from(db.users.values());
  res.json({ users });
});

// Create task (admin)
app.post('/api/admin/tasks', (req, res) => {
  const { domain, level, title, desc, effort, ytQuery, adminId } = req.body;
  if (!title || !domain) return res.status(400).json({ error: 'Title and domain required' });
  const task = { id: `task-${uuidv4().slice(0,8)}`, domain, level: level || 'Beginner', title, desc: desc || '', effort: effort || '~1 hr', ytQuery: ytQuery || `${title} tutorial`, assignedBy: adminId || 'admin', videos: [] };
  db.tasks.push(task);
  res.json({ success: true, task });
});

// Delete task
app.delete('/api/admin/tasks/:taskId', (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === req.params.taskId);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  db.tasks.splice(idx, 1);
  res.json({ success: true });
});

// Assign task to user
app.post('/api/admin/assign-task', (req, res) => {
  const { userId, taskId, adminId } = req.body;
  const user = db.users.get(userId);
  const task = db.tasks.find(t => t.id === taskId);
  if (!user || !task) return res.status(404).json({ error: 'User or task not found' });
  const assignment = { id: uuidv4(), userId, taskId, taskTitle: task.title, assignedBy: adminId, assignedAt: new Date().toISOString(), status: 'assigned' };
  db.taskAssignments.push(assignment);
  res.json({ success: true, assignment });
});

// Get assignments
app.get('/api/admin/assignments', (req, res) => {
  res.json({ assignments: db.taskAssignments });
});

// Get user's assignments
app.get('/api/users/:userId/assignments', (req, res) => {
  const assignments = db.taskAssignments.filter(a => a.userId === req.params.userId);
  res.json({ assignments });
});

// Add video to pool (admin)
app.post('/api/admin/videos', (req, res) => {
  const { url, title, domain, taskId, adminId } = req.body;
  if (!url) return res.status(400).json({ error: 'Video URL required' });
  let videoId = '';
  try {
    const u = new URL(url);
    videoId = u.searchParams.get('v') || u.pathname.split('/').pop();
  } catch { videoId = url; }
  const video = { id: uuidv4(), videoId, url, title: title || 'Untitled Video', domain: domain || 'General', taskId: taskId || null, thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, embedUrl: `https://www.youtube.com/embed/${videoId}`, addedBy: adminId, addedAt: new Date().toISOString() };
  db.videoPool.push(video);
  // Attach to task if specified
  if (taskId) {
    const task = db.tasks.find(t => t.id === taskId);
    if (task) task.videos.push(video);
  }
  res.json({ success: true, video });
});

// Get admin video pool
app.get('/api/admin/videos', (req, res) => {
  let vids = [...db.videoPool];
  if (req.query.domain) vids = vids.filter(v => v.domain === req.query.domain);
  if (req.query.taskId) vids = vids.filter(v => v.taskId === req.query.taskId);
  res.json({ videos: vids });
});

// Delete video from pool
app.delete('/api/admin/videos/:videoId', (req, res) => {
  const idx = db.videoPool.findIndex(v => v.id === req.params.videoId);
  if (idx === -1) return res.status(404).json({ error: 'Video not found' });
  db.videoPool.splice(idx, 1);
  res.json({ success: true });
});

// Review submission (admin)
app.post('/api/admin/review-submission', (req, res) => {
  const { submissionId, status, feedback, points, adminId } = req.body;
  const sub = db.submissions.find(s => s.id === submissionId);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  sub.status = status || 'approved';
  sub.feedback = feedback || '';
  sub.points = points || 0;
  sub.reviewedBy = adminId;
  sub.reviewedAt = new Date().toISOString();
  // Award points to user
  if (sub.userId && db.users.has(sub.userId) && points > 0) {
    db.users.get(sub.userId).points += points;
  }
  res.json({ success: true, submission: sub });
});

// ═══════════════════════════════════════════
//  NEWS ROUTES
// ═══════════════════════════════════════════

app.get('/api/news', (req, res) => {
  res.json({ news: db.news.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/api/news', upload.single('image'), (req, res) => {
  const { title, details, relatedTasks } = req.body;
  if (!title || !details) return res.status(400).json({ error: 'Title and details required' });
  
  const newsItem = {
    id: 'news-' + uuidv4().slice(0,8),
    title,
    details,
    relatedTasks: relatedTasks || '', // e.g., domain or task keywords
    imageUrl: req.file ? '/uploads/' + req.file.filename : null,
    createdAt: new Date().toISOString()
  };
  
  db.news.push(newsItem);
  res.json({ success: true, news: newsItem });
});

// Award points directly
app.post('/api/admin/award-points', (req, res) => {
  const { userId, points, reason } = req.body;
  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.points += points;
  res.json({ success: true, user: { id: user.id, name: user.name, points: user.points }, reason });
});

// ═══════════════════════════════════════════
//  GEMINI AI ENDPOINTS
// ═══════════════════════════════════════════

app.post('/api/ai/generate-tasks', async (req, res) => {
  if (!geminiModel) return res.status(503).json({ error: 'Gemini API not configured' });
  const { domain, level } = req.body;
  try {
    const prompt = `Generate exactly 6 practical hands-on tasks for a ${level} student in "${domain}". Return ONLY a valid JSON array: [{"title":"...","desc":"...","effort":"~1 hr","ytQuery":"youtube search term"}]`;
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ error: 'Failed to parse' });
    const tasks = JSON.parse(jsonMatch[0]).map(t => ({ id: `ai-${uuidv4().slice(0,8)}`, domain, level, ...t, assignedBy: 'ai', videos: [] }));
    tasks.forEach(t => db.tasks.push(t));
    res.json({ success: true, tasks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/evaluate', async (req, res) => {
  if (!geminiModel) return res.status(503).json({ error: 'Gemini API not configured' });
  const { taskTitle, taskDesc, submissionType, submissionContent } = req.body;
  try {
    const prompt = `Evaluate this student submission. Task: "${taskTitle}" (${taskDesc}). Submission: ${submissionType} - ${submissionContent}. Return ONLY JSON: {"score":0-100,"status":"approved" or "needs-revision","feedback":"2 sentences","pointsAwarded":5-25}`;
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Failed to parse' });
    res.json({ success: true, evaluation: JSON.parse(jsonMatch[0]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/chat', async (req, res) => {
  if (!geminiModel) return res.status(503).json({ error: 'Gemini API not configured' });
  const { message, taskContext } = req.body;
  try {
    const prompt = `You are SKILLING IT AI mentor. Be concise and practical. ${taskContext ? `Student is working on: "${taskContext}".` : ''} Question: ${message}. Answer in under 200 words.`;
    const result = await geminiModel.generateContent(prompt);
    res.json({ success: true, reply: result.response.text() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════
//  YOUTUBE ENDPOINTS
// ═══════════════════════════════════════════
const YT_API_KEY = process.env.YOUTUBE_API_KEY;

app.get('/api/youtube/search', async (req, res) => {
  const { q, maxResults } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  if (!YT_API_KEY || YT_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    return res.json({ success: true, source: 'fallback', videos: generateFallbackVideos(q) });
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults||6}&q=${encodeURIComponent(q)}&key=${YT_API_KEY}&videoDuration=medium`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) return res.json({ success: true, source: 'fallback', videos: generateFallbackVideos(q) });
    const videos = (data.items||[]).map(item => ({ id: item.id.videoId, title: item.snippet.title, channel: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url, embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`, watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}` }));
    res.json({ success: true, source: 'youtube-api', videos });
  } catch { res.json({ success: true, source: 'fallback', videos: generateFallbackVideos(q) }); }
});

function generateFallbackVideos(query) {
  const map = {
    'AI': [{ id:'aircAruvnKk',title:'Neural Networks Explained',channel:'3Blue1Brown' },{ id:'JMUxmLyrhSk',title:'Intro to ML',channel:'freeCodeCamp' },{ id:'i_LwzRVP7bg',title:'ML Course',channel:'freeCodeCamp' }],
    'Web': [{ id:'PkZNo7MFNFg',title:'JavaScript Full Course',channel:'freeCodeCamp' },{ id:'Oe421EPjeBE',title:'Node.js Course',channel:'freeCodeCamp' }],
    'Robotics': [{ id:'fJEoYhTRuxs',title:'Arduino Course',channel:'freeCodeCamp' }],
    'Cybersec': [{ id:'qiQR5rTSshw',title:'Ethical Hacking',channel:'freeCodeCamp' }],
    'Data': [{ id:'vmEHCJofslg',title:'Pandas Tutorial',channel:'Keith Galli' }]
  };
  const q = query.toLowerCase();
  let videos = [];
  for (const [k,v] of Object.entries(map)) { if (q.includes(k.toLowerCase())) { videos = v; break; } }
  if (!videos.length) videos = map['AI'];
  return videos.map(v => ({ ...v, thumbnail:`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`, embedUrl:`https://www.youtube.com/embed/${v.id}`, watchUrl:`https://www.youtube.com/watch?v=${v.id}` }));
}

app.get('/api/leaderboard', (req, res) => {
  const users = Array.from(db.users.values()).sort((a,b) => b.points - a.points).slice(0,20).map((u,i) => ({ rank:i+1, name:u.name, domain:u.domain, points:u.points, streak:u.streak }));
  res.json({ leaderboard: users });
});

app.get('/api/health', (req, res) => res.json({ status:'ok', geminiActive:!!geminiModel }));

// Page routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => {
  console.log(`\n  SKILLING IT Server → http://localhost:${PORT}`);
  console.log(`  Gemini: ${geminiModel ? '✅' : '❌'}  |  YouTube: ${YT_API_KEY && YT_API_KEY !== 'YOUR_YOUTUBE_API_KEY_HERE' ? '✅' : '⚠️ fallback'}\n`);
});
