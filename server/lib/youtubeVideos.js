// ─── In-memory cache (saves quota by reusing results for 1 hour) ──────────────
const videoCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Quota-blocked state (auto-clears at midnight Pacific = 12:30 PM IST) ─────
let quotaBlocked = false;
let quotaBlockedUntil = null;

function getMidnightPacific() {
  // Calculate next midnight Pacific Time (UTC-7 or UTC-8)
  const now = new Date();
  const pacificOffset = -7 * 60; // PDT offset in minutes (adjust to -8 for PST)
  const pacificNow = new Date(now.getTime() + (pacificOffset + now.getTimezoneOffset()) * 60000);
  const midnight = new Date(pacificNow);
  midnight.setHours(24, 0, 1, 0); // next midnight Pacific + 1 sec buffer
  // Convert back to local time
  return new Date(midnight.getTime() - (pacificOffset + now.getTimezoneOffset()) * 60000);
}

function isQuotaBlocked() {
  if (!quotaBlocked) return false;
  if (quotaBlockedUntil && new Date() >= quotaBlockedUntil) {
    // Quota has reset — clear the block automatically!
    console.log('[YouTube] Quota reset detected — resuming live API calls ✅');
    quotaBlocked = false;
    quotaBlockedUntil = null;
    videoCache.clear(); // Clear cache so fresh results load
    return false;
  }
  return true;
}

function getCached(key) {
  const entry = videoCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    videoCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  videoCache.set(key, { data, timestamp: Date.now() });
}

// ─── Fallback curated videos (used when API quota is exceeded) ────────────────
function generateFallbackVideos(query) {
  // Action-oriented fallback videos — "build it / do it" not "what is X"
  const map = {
    AI: [
      { id: 'i_LwzRVP7bg', title: 'Build a Machine Learning Model from Scratch', channel: 'freeCodeCamp' },
      { id: 'tPYj3fFJGjk', title: 'Build a Neural Network from Scratch in Python', channel: 'Sentdex' },
      { id: 'GwIo3gDZCVQ', title: 'Train Your First Image Classifier — Full Project', channel: 'Nicholas Renotte' },
      { id: 'bte6n7Bz_p4', title: 'Build a Chatbot with Python & ML', channel: 'NeuralNine' },
      { id: 'Fg2QH0QBKQM', title: 'Build a Spam Detector with Scikit-Learn', channel: 'freeCodeCamp' },
      { id: '7eh4d9ejO0', title: 'Face Recognition System — Build from Scratch', channel: 'Tech With Tim' },
      { id: 'Q58MD5f7lBw', title: 'Sentiment Analysis Project — Build & Deploy', channel: 'Krish Naik' }
    ],
    Web: [
      { id: 'nu_pCVPKzTk', title: 'Build a Full Stack App with React & Node.js', channel: 'Traversy Media' },
      { id: 'f2EqECiTBL8', title: 'Build a REST API from Scratch — Node & Express', channel: 'Traversy Media' },
      { id: '4sosXZsdy-s', title: 'Build a Todo App with React Hooks — Full Project', channel: 'Coding Addict' },
      { id: '1aXZoefZkhQ', title: 'Build & Deploy a Portfolio Website', channel: 'Kevin Powell' },
      { id: 'mrHNSanmqQ4', title: 'Build a Chat App with Socket.io & Node', channel: 'Traversy Media' },
      { id: 'bMknfKXIFA8', title: 'Build a Blog with Next.js & MongoDB', channel: 'Sonny Sangha' },
      { id: 'Oe421EPjeBE', title: 'Build a Node.js Server — Full Project', channel: 'freeCodeCamp' }
    ],
    Robotics: [
      { id: 'fJEoYhTRuxs', title: 'Build a Line Follower Robot — Arduino Project', channel: 'freeCodeCamp' },
      { id: 'kUHmYKWwuWs', title: 'Build a Robot Arm with Servo Motors', channel: 'DroneBot Workshop' },
      { id: 'BFdMrDe_oqY', title: 'Obstacle Avoiding Robot — Build from Scratch', channel: 'HowToMechatronics' },
      { id: 'mH7cQejntKw', title: 'Build Your First Robot with ROS', channel: 'Robotics Backend' },
      { id: 'e_4N5qKVV6A', title: 'Bluetooth Controlled Car — Full Build', channel: 'DroneBot Workshop' },
      { id: 'RxpTScg9LX8', title: 'Motor Control Project with Arduino', channel: 'Paul McWhorter' },
      { id: 'dMBZsjLZGhk', title: 'Build a Self-Balancing Robot', channel: 'Joop Brokking' }
    ],
    IoT: [
      { id: 'pKFBcB6V9Vk', title: 'Build an IoT Sensor Dashboard — ESP32 + MQTT', channel: 'DroneBot Workshop' },
      { id: 'hFwvHsBhIQA', title: 'ESP8266 Weather Station — Build Project', channel: 'Andreas Spiess' },
      { id: 'LywjCVpM3V4', title: 'MQTT Smart Home Project — Build from Scratch', channel: 'Techiesms' },
      { id: 'nkD8QZpLBsY', title: 'Build a Real-Time Sensor Dashboard with Node-RED', channel: 'Steve Cope' },
      { id: 'jZEHDMRKNBk', title: 'Smart Door Lock System — IoT Build', channel: 'Electronoobs' },
      { id: '7h7s9FSPWRY', title: 'IoT Plant Watering System — Full Build', channel: 'DroneBot Workshop' },
      { id: 'auPX1BKQVLI', title: 'Build a Home Automation System with ESP32', channel: 'Random Nerd Tutorials' }
    ],
    Cybersec: [
      { id: 'qiQR5rTSshw', title: 'Build a Network Scanner in Python — Ethical Hacking', channel: 'freeCodeCamp' },
      { id: 'pQSqMr0XFHI', title: 'Write a Port Scanner from Scratch — Python', channel: 'NeuralNine' },
      { id: 'WnN6dbos5u8', title: 'Build a Keylogger — Security Project', channel: 'NeuralNine' },
      { id: 'EcE_KQd4PkA', title: 'Capture the Flag Walkthrough — Practical Hacking', channel: 'John Hammond' },
      { id: 'mvzXZxYldaM', title: 'Penetration Testing Lab — Build Your Own', channel: 'TCM Security' },
      { id: 'nzZkKoREEGo', title: 'Build a Password Strength Checker', channel: 'Tech With Tim' },
      { id: 'U9J2GRcSqxk', title: 'SQL Injection Lab — Hands-On Practice', channel: 'HackerSploit' }
    ],
    Data: [
      { id: 'vmEHCJofslg', title: 'Build a Data Analysis Project with Pandas', channel: 'Keith Galli' },
      { id: 'p_tg5SlbY8E', title: 'End-to-End Data Science Project — Full Build', channel: 'freeCodeCamp' },
      { id: 'ZyhVh-qRZPA', title: 'Build an EDA Dashboard with Python & Plotly', channel: 'Charming Data' },
      { id: 'GBr8GCNKOiA', title: 'Build a Sales Analytics Report — Python', channel: 'Rob Mulla' },
      { id: 'Q1sojFGMxqc', title: 'Web Scraping Project & Data Analysis', channel: 'Luke Barousse' },
      { id: 'yZvFH7B6gKI', title: 'Build a Stock Price Dashboard with Python', channel: 'Python Engineer' },
      { id: 'r-uOLxNrNk8', title: 'SQL Project — Analyze a Real Dataset', channel: 'Alex The Analyst' }
    ]
  };
  const q = String(query).toLowerCase();
  let bucket = '';
  if (q.includes('web')) bucket = 'Web';
  else if (q.includes('robot')) bucket = 'Robotics';
  else if (q.includes('iot')) bucket = 'IoT';
  else if (q.includes('cyber') || q.includes('sec')) bucket = 'Cybersec';
  else if (q.includes('data')) bucket = 'Data';
  else bucket = 'AI';
  const videos = map[bucket] || map.AI;
  return videos.map((v) => ({
    ...v,
    thumbnail: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    watchUrl: `https://www.youtube.com/watch?v=${v.id}`
  }));
}

// ─── Main search function with caching + auto quota recovery ─────────────────
async function searchYouTube(q, maxResults = 7) {
  const YT_API_KEY = process.env.YOUTUBE_API_KEY;

  // No key configured → use fallback immediately
  if (!YT_API_KEY || YT_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    return { source: 'fallback', videos: generateFallbackVideos(q) };
  }

  // Quota is blocked → use fallback (auto-unblocks at midnight Pacific)
  if (isQuotaBlocked()) {
    console.log(`[YouTube] Quota blocked until ${quotaBlockedUntil?.toISOString()} — using fallback`);
    return { source: 'fallback', videos: generateFallbackVideos(q) };
  }

  // Check cache first — avoids wasting quota on repeated searches
  const cacheKey = `${q}:${maxResults}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[YouTube] Cache hit for "${q}" — no API call needed ✅`);
    return cached;
  }

  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(q)}` +
      `&key=${YT_API_KEY}&videoDuration=medium`;
    const response = await fetch(url);
    const data = await response.json();

    // Detect quota exceeded (403) — block and schedule auto-recovery
    if (data.error && data.error.code === 403) {
      console.warn('[YouTube] Quota exceeded! Switching to fallback until midnight Pacific ⚠️');
      quotaBlocked = true;
      quotaBlockedUntil = getMidnightPacific();
      console.log(`[YouTube] Will auto-resume at ${quotaBlockedUntil.toISOString()}`);
      return { source: 'fallback', videos: generateFallbackVideos(q) };
    }

    const videos = (data.items || []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.default?.url ||
        `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    if (videos.length === 0) return { source: 'fallback', videos: generateFallbackVideos(q) };

    // Cache successful result for 1 hour
    const result = { source: 'youtube-api', videos };
    setCache(cacheKey, result);
    console.log(`[YouTube] Live results fetched & cached for "${q}" ✅`);
    return result;

  } catch (err) {
    console.error('[YouTube] Fetch error:', err.message);
    return { source: 'fallback', videos: generateFallbackVideos(q) };
  }
}

exports.generateFallbackVideos = generateFallbackVideos;
exports.searchYouTube = searchYouTube;
