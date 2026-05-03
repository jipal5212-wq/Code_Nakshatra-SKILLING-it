const DEFAULT_TASKS = [
  {
    domain: 'AI / ML',
    level: 'Beginner',
    title: 'Build a Text Classifier',
    objective: 'Train and evaluate a simple text classifier.',
    watch_segment: 'First 15–20 min of matched tutorial',
    expected_output: 'Notebook or script that trains Naive Bayes and prints accuracy.',
    description: 'Using Scikit-learn, train a Naive Bayes classifier on a sample dataset.',
    effort: '~1 hr',
    yt_query: 'scikit learn text classification tutorial'
  },
  {
    domain: 'Web Dev',
    level: 'Intermediate',
    title: 'REST API with Node.js',
    objective: 'Ship a todo CRUD JSON API.',
    watch_segment: 'First 15–20 min segment on Express APIs',
    expected_output: 'Runnable Express server plus README with curl samples.',
    description: 'Create a CRUD REST API for a todo list using Express.',
    effort: '~1.5 hrs',
    yt_query: 'nodejs express REST API tutorial'
  },
  {
    domain: 'Robotics',
    level: 'Beginner',
    title: 'Arduino Line Follower',
    objective: 'Express line-follow control logic.',
    watch_segment: 'Arduino line-follow intro (~15–20 min)',
    expected_output: 'Sketch/pseudocode + brief wiring notes.',
    description: 'Write the control logic for a 2-sensor line follower.',
    effort: '~1 hr',
    yt_query: 'arduino line follower robot tutorial'
  },
  {
    domain: 'IoT',
    level: 'Beginner',
    title: 'Read a Sensor with ESP32/MQTT',
    objective: 'Publish one telemetry reading to MQTT or serial dashboard.',
    watch_segment: 'ESP32 + MQTT getting started (~15–20 min)',
    expected_output: 'Photo or screenshot of IDE + broker/topic proof.',
    description: 'Use WiFi microcontroller to read sensor and publish telemetry.',
    effort: '~1 hr',
    yt_query: 'esp32 MQTT sensor tutorial beginner'
  },
  {
    domain: 'Cybersecurity',
    level: 'Intermediate',
    title: 'Scan & Report Lab Findings',
    objective: 'Run a sanctioned local scan.',
    watch_segment: 'Nmap basics (~15–20 min)',
    expected_output: 'Short markdown report with three findings.',
    description: 'Use Nmap against a sanctioned VM; document remediations.',
    effort: '~1 hr',
    yt_query: 'nmap vulnerability scanning tutorial beginner'
  },
  {
    domain: 'Data Science',
    level: 'Beginner',
    title: 'EDA on Titanic Dataset',
    objective: 'Answer measurable questions clearly.',
    watch_segment: 'Pandas EDA intro (~15–20 min)',
    expected_output: 'Notebook answering 3+ questions with plots.',
    description: 'Load Titanic CSV with Pandas; answer exploratory questions.',
    effort: '~45 min',
    yt_query: 'pandas EDA titanic dataset tutorial'
  },
  {
    domain: 'AI / ML',
    level: 'Advanced',
    title: 'Fine-tune GPT-2 (small run)',
    objective: 'Run one training sweep on HF.',
    watch_segment: 'HF transformers intro (~15–20 min)',
    expected_output: 'Training script plus screenshot/log snippet.',
    description: 'Use HuggingFace to fine-tune GPT-2 on a tiny dataset.',
    effort: '~2 hrs',
    yt_query: 'huggingface GPT2 fine tune tutorial'
  },
  {
    domain: 'Web Dev',
    level: 'Beginner',
    title: 'Deploy a Static Landing Page',
    objective: 'Ship responsive page on public HTTPS.',
    watch_segment: 'HTML/CSS layout & deploy (~15–20 min)',
    expected_output: 'Live URL or repo + deploy screenshot.',
    description: 'Build one-page responsive landing deployed on Pages/Netlify/Vercel.',
    effort: '~1 hr',
    yt_query: 'deploy static website vercel beginner tutorial'
  }
];

exports.seedTasksIfEmpty = async (admin) => {
  const { count, error: cErr } = await admin.from('tasks').select('*', { count: 'exact', head: true });
  if (cErr) console.error('[seedTasks] count error:', cErr.message);
  if ((count || 0) > 0) return;
  const { error } = await admin.from('tasks').insert(DEFAULT_TASKS);
  if (error) console.error('[seedTasks] insert error:', error.message);
  else console.log('[seedTasks] inserted default catalog rows.');
};
