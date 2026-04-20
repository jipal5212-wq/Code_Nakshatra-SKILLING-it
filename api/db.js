const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('=> Using existing database connection');
    return;
  }
  
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing from environment variables');
    throw new Error('MONGO_URI is missing');
  }

  try {
    const db = await mongoose.connect(uri);
    isConnected = db.connections[0].readyState;
    console.log('=> Database connected successfully');
  } catch (error) {
    console.error('=> Database connection error:', error);
    throw error;
  }
};

const studentSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: String,
  cohort_number: Number,
  domain_interest: String,
  timezone: String,
  discord_username: String,
  enrollment_date: String,
  preferred_learning_time: String,
  github_profile: String
});

const progressSchema = new mongoose.Schema({
  student_id: String,
  day_number: Number,
  lesson_completed: Boolean,
  video_watched_percent: Number,
  project_submitted: Boolean,
  project_url: String,
  completion_date: String,
  time_spent_minutes: Number
});

const gamificationSchema = new mongoose.Schema({
  student_id: { type: String, unique: true },
  total_xp_points: { type: Number, default: 0 },
  current_streak_days: { type: Number, default: 0 },
  longest_streak_days: { type: Number, default: 0 },
  badges_earned: [String],
  quiz_scores: [Number],
  weekly_rankings: [Number],
  last_activity_date: String
});

const quizSchema = new mongoose.Schema({
  quiz_id: String,
  student_id: String,
  week_number: Number,
  questions_answered: Number,
  score_percent: Number,
  submission_date: String,
  retry_count: Number,
  unlocked_content: String
});

const badgeSchema = new mongoose.Schema({
  badge_id: String,
  student_id: String,
  badge_name: String,
  earned_date: String,
  rarity: String,
  description: String
});

const projectSchema = new mongoose.Schema({
  project_id: String,
  student_id: String,
  github_url: String,
  deployed_url: String,
  peer_reviews: [{
    reviewer_id: String,
    scores: { code_quality: Number, functionality: Number, creativity: Number, documentation: Number },
    comments: String,
    total_score: Number,
    date: String
  }],
  final_score: Number,
  submission_date: String,
  tags: [String]
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
const Gamification = mongoose.models.Gamification || mongoose.model('Gamification', gamificationSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
const Badge = mongoose.models.Badge || mongoose.model('Badge', badgeSchema);
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

module.exports = { connectDB, Student, Progress, Gamification, Quiz, Badge, Project };
