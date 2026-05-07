/* tfeed.js — T-Feed frontend logic */
const DL={aiml:'AI/ML',datascience:'Data Science',robotics:'Robotics',iot:'IoT',cybersec:'Cybersecurity',webdev:'Web Dev'};
let posts=[];
let session=null;

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function initials(n){if(!n)return'?';const p=n.trim().split(/\s+/);return(p.length>=2?p[0][0]+p[1][0]:p[0][0]).toUpperCase();}
function timeAgo(iso){const s=Math.floor((Date.now()-new Date(iso))/1000);if(s<60)return'just now';if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago';}

/* ── Avatar ─────────────────────────────────────────────────── */
window.toggleAv=function(){document.getElementById('avDrop').classList.toggle('open');};
window.logout=function(){if(window.SkillingAuth)SkillingAuth.clear();location.href='/';};
document.addEventListener('click',function(e){const w=document.getElementById('avWrap');if(w&&!w.contains(e.target))document.getElementById('avDrop')?.classList.remove('open');});

function fillAvatar(p){
  if(!session)return;
  const ini=initials(session.name);
  ['avInit','avCircle'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ini;});
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('avName',session.name||'—');set('avEmail',session.email||'');
  set('avDomain',DL[p?.skill_domain||'']||p?.skill_domain||'—');
  set('avLevel',p?.level||'—');set('avPts',p?.points??0);
}

/* ── Like ───────────────────────────────────────────────────── */
window.toggleLike=async function(postId){
  if(!session?.access_token){alert('Sign in to like posts.');return;}
  const res=await fetch(`/api/tfeed/${postId}/like`,{method:'POST',headers:SkillingAuth.bearerHeaders()});
  const d=await res.json().catch(()=>({}));
  const card=document.querySelector(`[data-post-id="${postId}"]`);
  if(!card)return;
  const btn=card.querySelector('.like-btn');
  const cnt=card.querySelector('.like-count');
  if(btn)btn.classList.toggle('liked',d.liked);
  if(cnt)cnt.textContent=d.likeCount??0;
};

/* ── Comments ───────────────────────────────────────────────── */
window.toggleComments=async function(postId){
  const sec=document.getElementById(`comments-${postId}`);
  if(!sec)return;
  if(sec.classList.contains('open')){sec.classList.remove('open');return;}
  sec.classList.add('open');
  if(!sec.dataset.loaded){
    sec.dataset.loaded='1';
    await loadComments(postId);
  }
};

async function loadComments(postId){
  const list=document.getElementById(`clist-${postId}`);
  if(!list)return;
  list.innerHTML='<div style="font-size:12px;color:rgba(255,255,255,.3);padding:8px 0">Loading…</div>';
  const res=await fetch(`/api/tfeed/${postId}/comments`);
  const d=await res.json().catch(()=>({comments:[]}));
  renderComments(postId,d.comments||[]);
}

function renderComments(postId,comments){
  const list=document.getElementById(`clist-${postId}`);
  if(!list)return;
  if(!comments.length){list.innerHTML='<div style="font-size:12px;color:rgba(255,255,255,.25);padding:8px 0">No comments yet. Be the first!</div>';return;}
  list.innerHTML=comments.map(c=>`<div class="comment-item">
    <div class="c-avatar">${initials(c.display_name||'?')}</div>
    <div class="c-body"><div class="c-name">${esc(c.display_name||'Learner')}</div><div class="c-text">${esc(c.content)}</div></div>
  </div>`).join('');
}

window.submitComment=async function(postId){
  if(!session?.access_token){alert('Sign in to comment.');return;}
  const inp=document.getElementById(`cinput-${postId}`);
  const content=(inp?.value||'').trim();
  if(!content)return;
  inp.disabled=true;
  const res=await fetch(`/api/tfeed/${postId}/comment`,{method:'POST',headers:SkillingAuth.bearerHeaders(),body:JSON.stringify({content})});
  const d=await res.json().catch(()=>({}));
  inp.disabled=false;
  if(d.comment){inp.value='';await loadComments(postId);
    const cc=document.querySelector(`[data-post-id="${postId}"] .comment-count`);
    if(cc)cc.textContent=parseInt(cc.textContent||'0')+1;
  }
};

/* ── Render posts ───────────────────────────────────────────── */
function renderFeed(postsArr){
  const el=document.getElementById('feedCol');
  if(!el)return;
  if(!postsArr.length){el.innerHTML='<div class="empty-state">No posts yet.<br>Click "Refresh Feed" to generate news.</div>';return;}
  el.innerHTML=postsArr.map(p=>{
    const isAdmin = (p.sourceHint||'').toLowerCase()==='admin';
    const adminBadge = isAdmin
      ? `<div class="admin-news-badge">📢 Admin Post</div>`
      : '';
    const cardStyle = isAdmin
      ? ' style="border-top:3px solid #e60000;background:rgba(230,0,0,.04);"'
      : '';
    const imgHtml=p.imageUrl?`<div class="post-img-wrap"><img class="post-img" src="${esc(p.imageUrl)}" alt="${esc(p.title)}" loading="lazy" onerror="this.closest('.post-img-wrap').remove()"></div>`:'';
    const pubLabel=p.pubDate?`<span class="post-pubdate">${new Date(p.pubDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>`:`<span class="post-time">${timeAgo(p.createdAt)}</span>`;
    const readLink=p.articleUrl?`<a class="read-link" href="${esc(p.articleUrl)}" target="_blank" rel="noopener">Read Article ↗</a>`:'';
    return `
    <div class="post-card"${cardStyle} data-post-id="${esc(p.id)}">
      ${adminBadge}
      ${imgHtml}
      <div class="post-meta">
        <span class="post-source"${isAdmin?' style="color:#e60000;font-weight:700"':''}>${esc(p.sourceHint||'Tech News')}</span>
        <span class="post-domain">${esc(DL[p.domain]||p.domain||'General')}</span>
        ${pubLabel}
      </div>
      <div class="post-title">${p.articleUrl?`<a href="${esc(p.articleUrl)}" target="_blank" rel="noopener" class="post-title-link">${esc(p.title)}</a>`:esc(p.title)}</div>
      <div class="post-summary">${esc(p.summary)}</div>
      <div class="post-tags">${(p.tags||[]).map(t=>`<span class="post-tag">#${esc(t)}</span>`).join('')}</div>
      <div class="post-actions">
        <button class="action-btn like-btn${p.userLiked?' liked':''}" onclick="toggleLike('${esc(p.id)}')">
          ${p.userLiked?'❤️':'🤍'} <span class="like-count">${p.likeCount||0}</span> Like
        </button>
        <button class="action-btn" onclick="toggleComments('${esc(p.id)}')">
          💬 <span class="comment-count">${p.commentCount||0}</span> Comment
        </button>
        ${readLink}
      </div>
      <div class="comment-section" id="comments-${esc(p.id)}">
        <div class="comment-list" id="clist-${esc(p.id)}"></div>
        <div class="comment-input-row">
          <textarea class="comment-input" id="cinput-${esc(p.id)}" placeholder="Write a comment…" rows="2" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitComment('${esc(p.id)}');}"></textarea>
          <button class="comment-submit" onclick="submitComment('${esc(p.id)}')">Post</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Domain project templates (used when Gemini is unavailable) ─────────── */
const PROJECT_TEMPLATES = {
  'AI/ML': [
    { idea: 'Build a browser extension that auto-summarises any article you visit using a local LLM.', stack: 'JavaScript, Transformers.js', effort: '~4 hrs' },
    { idea: 'Create a daily AI news digest bot that pulls headlines and sends a WhatsApp/Telegram summary.', stack: 'Python, NewsData API, Telegram Bot', effort: '~3 hrs' },
    { idea: 'Build a sentiment analysis dashboard that colour-codes tech news headlines live.', stack: 'Python, HuggingFace, Streamlit', effort: '~5 hrs' },
  ],
  'Cybersecurity': [
    { idea: 'Build a phishing URL detector that scans links pasted into a chat-style UI.', stack: 'Python, scikit-learn, Flask', effort: '~5 hrs' },
    { idea: 'Create a password audit tool that checks for breaches via HaveIBeenPwned and scores strength.', stack: 'Node.js, HIBP API', effort: '~2 hrs' },
    { idea: 'Build a real-time port scanner CLI with a web dashboard showing open services.', stack: 'Python, Socket, React', effort: '~4 hrs' },
  ],
  'Web Dev': [
    { idea: 'Build a live CSS playground where designs are shareable via a short URL.', stack: 'React, Node.js, MongoDB', effort: '~4 hrs' },
    { idea: 'Create a browser extension that injects a reading-time estimate and highlights on every page.', stack: 'JavaScript, Manifest V3', effort: '~2 hrs' },
    { idea: 'Build a real-time collaborative whiteboard with WebSockets and canvas drawing.', stack: 'Node.js, Socket.io, Canvas API', effort: '~6 hrs' },
  ],
  'Data Science': [
    { idea: 'Build a CSV explorer that auto-generates charts, summary stats, and outlier alerts.', stack: 'Python, Pandas, Plotly, Dash', effort: '~3 hrs' },
    { idea: 'Create a dashboard visualising global tech hiring trends using public job listing APIs.', stack: 'Python, Streamlit, LinkedIn/Indeed API', effort: '~5 hrs' },
    { idea: 'Build a stock-news correlation tool: plot price movements alongside headline sentiment.', stack: 'Python, yFinance, VADER, Plotly', effort: '~4 hrs' },
  ],
  'Robotics': [
    { idea: 'Build a browser-based 3-DOF robot arm simulator with inverse-kinematics controls.', stack: 'Three.js, JavaScript', effort: '~6 hrs' },
    { idea: 'Create an A* pathfinding visualiser where you draw walls on a grid and watch it solve.', stack: 'JavaScript, Canvas API', effort: '~2 hrs' },
    { idea: 'Build a drone flight planner that generates GPS waypoints on an interactive map.', stack: 'React, Leaflet.js, Node.js', effort: '~4 hrs' },
  ],
  'IoT': [
    { idea: 'Build a smart home dashboard that simulates MQTT sensor streams with live charts.', stack: 'Node.js, MQTT.js, React, Chart.js', effort: '~5 hrs' },
    { idea: 'Create a browser oscilloscope that reads the microphone as a simulated sensor signal.', stack: 'JavaScript, Web Audio API', effort: '~2 hrs' },
    { idea: 'Build a Raspberry Pi temperature logger that pushes alerts to a Telegram bot.', stack: 'Python, RPi.GPIO, Telegram Bot API', effort: '~3 hrs' },
  ],
  'General': [
    { idea: 'Build a personal tech-news aggregator with topic filters and a read-later bookmark system.', stack: 'React, Node.js, Supabase', effort: '~5 hrs' },
    { idea: 'Create a terminal-based tech digest CLI that fetches the top 10 articles every morning.', stack: 'Node.js, Ink, NewsData API', effort: '~2 hrs' },
    { idea: 'Build a "today I learned" app: paste a news link and auto-extract a TIL summary card.', stack: 'Python, BeautifulSoup, FastAPI', effort: '~3 hrs' },
  ]
};

/* Pick a stable idea per post (hash of id → array index) */
function pickIdea(post) {
  if (post.projectIdea) {
    // Gemini provided one — use it
    return { idea: post.projectIdea, stack: post.projectStack || '', effort: post.projectEffort || '~2 hrs' };
  }
  const bucket = PROJECT_TEMPLATES[post.domain] || PROJECT_TEMPLATES['General'];
  const hash = (post.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return bucket[hash % bucket.length];
}

/* ── Render build ideas ────────────────────────────────────── */
function renderBuildIdeas(postsArr){
  const el=document.getElementById('ideaList');
  if(!el)return;
  if(!postsArr.length){
    el.innerHTML='<div class="empty-state" style="padding:32px 0">Generate a feed to see project ideas.</div>';
    return;
  }
  // Use ALL posts (up to 6); generate idea locally if Gemini didn't enrich
  const cards = postsArr.slice(0, 6).map(p => {
    const { idea, stack, effort } = pickIdea(p);
    return `
    <div class="idea-card">
      <div class="idea-inspired">Inspired by · ${esc(p.sourceHint || p.domain || 'Tech')}</div>
      <div class="idea-title">🛠 ${esc(idea.split('.')[0])}</div>
      <div class="idea-desc">${esc(idea)}</div>
      <div class="idea-meta">
        ${stack  ? `<span class="idea-badge">⚡ ${esc(stack)}</span>`  : ''}
        ${effort ? `<span class="idea-badge">⏱ ${esc(effort)}</span>` : ''}
      </div>
      <a href="/" class="try-btn">Start Building →</a>
    </div>`;
  });
  el.innerHTML = cards.join('');
}



/* ── Refresh (Gemini) ───────────────────────────────────────── */
window.refreshFeed=async function(){
  const btn=document.getElementById('refreshBtn');
  const el=document.getElementById('feedCol');
  if(btn){btn.disabled=true;btn.textContent='⏳ Generating…';}
  try{
    const res=await fetch('/api/tfeed/refresh',{method:'POST',headers:SkillingAuth.bearerHeaders()});
    const d=await res.json().catch(()=>({}));
    if(d.setup){showSetupBox();return;}
    if(d.ok){
      if(d.count===0&&d.message){
        // Already up to date — show banner, still reload
        if(el){const b=document.createElement('div');b.style.cssText='background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#4ade80;padding:10px 16px;border-radius:8px;margin-bottom:16px;font-size:.85rem;';b.textContent='Feed is up to date — '+d.message;el.prepend(b);setTimeout(()=>b.remove(),4000);}
      }
      await loadFeed();
    } else {
      if(el){const b=document.createElement('div');b.style.cssText='background:rgba(230,0,0,.1);border:1px solid rgba(230,0,0,.25);color:#ff7070;padding:10px 16px;border-radius:8px;margin-bottom:16px;font-size:.85rem;';b.textContent='Refresh failed: '+(d.error||'Unknown error');el.prepend(b);setTimeout(()=>b.remove(),5000);}
    }
  }catch(e){
    if(el){const b=document.createElement('div');b.style.cssText='background:rgba(230,0,0,.1);border:1px solid rgba(230,0,0,.25);color:#ff7070;padding:10px 16px;border-radius:8px;margin-bottom:16px;font-size:.85rem;';b.textContent='Network error — check your connection.';el.prepend(b);setTimeout(()=>b.remove(),5000);}
  }
  finally{if(btn){btn.disabled=false;btn.textContent='⚡ Refresh Feed';}}
};

async function loadFeed(){
  const el=document.getElementById('feedCol');
  if(el)el.innerHTML='<div class="empty-state">Loading…</div>';
  try{
    const res=await fetch('/api/tfeed',{headers:session?.access_token?SkillingAuth.bearerHeaders():{'Content-Type':'application/json'}});
    const d=await res.json().catch(()=>({posts:[]}));
    if(d.setup){showSetupBox();return;}
    // Admin posts always first, then newest
    posts=(d.posts||[]).sort((a,b)=>{
      const aA=(a.sourceHint||'').toLowerCase()==='admin'?1:0;
      const bA=(b.sourceHint||'').toLowerCase()==='admin'?1:0;
      if(bA!==aA)return bA-aA;
      return new Date(b.createdAt)-new Date(a.createdAt);
    });
    renderFeed(posts);
    renderBuildIdeas(posts);
  }catch(e){
    if(el)el.innerHTML='<div class="empty-state" style="color:#ff7070">Failed to load feed. Please try again.</div>';
  }
}

function showSetupBox(){
  const el=document.getElementById('feedCol');
  if(el)el.innerHTML=`<div class="setup-box">
    <div class="setup-title">⚠ Database Setup Required</div>
    <div class="setup-text">Run this SQL in your <a href="https://supabase.com/dashboard" style="color:var(--red)">Supabase dashboard</a> → SQL Editor:<br><br>
    <code>CREATE TABLE tfeed_posts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text,summary text,tags text[],domain text,source_hint text,article_url text,image_url text,pub_date text,project_idea text,project_stack text,project_effort text,like_count int DEFAULT 0,comment_count int DEFAULT 0,created_at timestamptz DEFAULT now());</code><br><br>
    <code>CREATE TABLE tfeed_likes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),post_id uuid,user_id uuid,created_at timestamptz DEFAULT now(),UNIQUE(post_id,user_id));</code><br><br>
    <code>CREATE TABLE tfeed_comments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),post_id uuid,user_id uuid,display_name text,content text,created_at timestamptz DEFAULT now());</code><br><br>
    <strong>If the table already exists, add the new columns:</strong><br>
    <code>ALTER TABLE tfeed_posts ADD COLUMN IF NOT EXISTS article_url text, ADD COLUMN IF NOT EXISTS image_url text, ADD COLUMN IF NOT EXISTS pub_date text;</code><br><br>
    Then click "Refresh Feed" to pull the latest tech news.</div>
  </div>`;
}

/* ── Init ───────────────────────────────────────────────────── */
async function init(){
  session=window.SkillingAuth?.toLegacy(window.SkillingAuth?.read())||null;
  if(!session?.access_token){location.href='/login.html';return;}
  try{
    const res=await fetch('/api/me/summary',{headers:SkillingAuth.bearerHeaders()});
    const d=await res.json().catch(()=>({}));
    fillAvatar(d.profile||{});
  }catch(e){fillAvatar({});}
  await loadFeed();
}

document.addEventListener('DOMContentLoaded',init);
