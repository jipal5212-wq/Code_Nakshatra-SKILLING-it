function generateFallbackVideos(query) {
  const map = {
    AI: [
      { id: 'aircAruvnKk', title: 'Neural Networks Explained', channel: '3Blue1Brown' },
      { id: 'JMUxmLyrhSk', title: 'Intro to ML', channel: 'freeCodeCamp' },
      { id: 'i_LwzRVP7bg', title: 'ML Course', channel: 'freeCodeCamp' },
      { id: 'PZAlssNND-k', title: 'How AI Works', channel: '3Blue1Brown' }
    ],
    Web: [
      { id: 'PkZNo7MFNFg', title: 'JavaScript Full Course', channel: 'freeCodeCamp' },
      { id: 'Oe421EPjeBE', title: 'Node.js Course', channel: 'freeCodeCamp' },
      { id: 'lhCdVIgXKZE', title: 'HTTP & APIs', channel: 'Traversy Media' }
    ],
    Robotics: [
      { id: 'fJEoYhTRuxs', title: 'Arduino Course', channel: 'freeCodeCamp' },
      { id: 'mH7cQejntKw', title: 'Intro to Robotics', channel: 'Robotics Backend' },
      { id: 'RxpTScg9LX8', title: 'Motor control basics', channel: 'Various' }
    ],
    IoT: [
      { id: 'hFwvHsBhIQA', title: 'ESP8266 Crash Course', channel: 'Various' },
      { id: 'LywjCVpM3V4', title: 'MQTT Basics', channel: 'Various' },
      { id: 'nkD8QZpLBsY', title: 'Sensor dashboards', channel: 'Various' }
    ],
    Cybersec: [
      { id: 'qiQR5rTSshw', title: 'Ethical Hacking', channel: 'freeCodeCamp' },
      { id: 'mvzXZxYldaM', title: 'Cybersecurity Basics', channel: 'Simplilearn' },
      { id: 'EcE_KQd4PkA', title: 'Network scanning intro', channel: 'Various' }
    ],
    Data: [
      { id: 'vmEHCJofslg', title: 'Pandas Tutorial', channel: 'Keith Galli' },
      { id: 'p_tg5SlbY8E', title: 'Data Science Crash Course', channel: 'freeCodeCamp' },
      { id: 'ZyhVh-qRZPA', title: 'Python DS intro', channel: 'Various' }
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
  let videos = map[bucket] || map.AI;
  return videos.map((v) => ({
    ...v,
    thumbnail: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    watchUrl: `https://www.youtube.com/watch?v=${v.id}`
  }));
}

async function searchYouTube(q, maxResults = 7) {
  const YT_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_API_KEY || YT_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    return { source: 'fallback', videos: generateFallbackVideos(q) };
  }
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(q)}` +
      `&key=${YT_API_KEY}&videoDuration=medium`;
    const response = await fetch(url);
    const data = await response.json();
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
    return { source: 'youtube-api', videos };
  } catch {
    return { source: 'fallback', videos: generateFallbackVideos(q) };
  }
}

exports.generateFallbackVideos = generateFallbackVideos;
exports.searchYouTube = searchYouTube;
