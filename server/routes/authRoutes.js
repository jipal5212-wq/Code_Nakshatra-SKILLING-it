const express = require('express');
const crypto = require('crypto');
const { getAnonAuthClient } = require('../lib/supabase');
const { sendOtpEmail } = require('../lib/resendMail');
const { normalizeSkillKey } = require('../lib/skills');

const OTP_MIN_MS = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10) * 60 * 1000;
const FLOW_MIN_MS = 30 * 60 * 1000;

module.exports = function authRoutes(admin) {
  const r = express.Router();

  const normEmail = (e) => String(e || '').trim().toLowerCase();

  r.post('/api/auth/otp/send', async (req, res) => {
    if (!admin) return res.status(503).json({ error: 'Server not configured for auth.' });
    const email = normEmail(req.body?.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires_at = new Date(Date.now() + OTP_MIN_MS).toISOString();
    await admin.from('email_otps').upsert({ email, code, expires_at, attempts: 0 }, { onConflict: 'email' });

    const sent = await sendOtpEmail(email, code);

    // Dev mode: always log OTP to console so you can test without email delivery
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n  ┌─────────────────────────────────────┐`);
      console.log(`  │  DEV OTP  →  ${email}`);
      console.log(`  │  Code     →  ${code}`);
      console.log(`  └─────────────────────────────────────┘\n`);
    }

    if (!sent.ok) {
      // In dev mode, still allow flow even if email fails
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ ok: true, expiresInMinutes: OTP_MIN_MS / 60000, devNote: 'OTP logged to server console' });
      }
      console.error('[OTP send]', sent.error);
      return res.status(502).json({ error: sent.error || 'Email send failed.' });
    }
    res.json({ ok: true, expiresInMinutes: OTP_MIN_MS / 60000 });
  });

  r.post('/api/auth/otp/verify', async (req, res) => {
    if (!admin) return res.status(503).json({ error: 'Server not configured.' });
    const email = normEmail(req.body?.email);
    const raw = String(req.body?.code || '').replace(/\s/g, '');
    if (!email || raw.length !== 6) return res.status(400).json({ error: 'Email and 6-digit code required.' });

    const { data: row, error } = await admin.from('email_otps').select('*').eq('email', email).maybeSingle();
    if (error || !row) return res.status(400).json({ error: 'Request a code first.' });
    if (new Date(row.expires_at) < new Date()) {
      await admin.from('email_otps').delete().eq('email', email);
      return res.status(400).json({ error: 'Code expired. Request another.' });
    }
    if (row.code !== raw) {
      await admin.from('email_otps').update({ attempts: (row.attempts || 0) + 1 }).eq('email', email);
      return res.status(400).json({ error: 'Incorrect code.' });
    }

    await admin.from('email_otps').delete().eq('email', email);

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + FLOW_MIN_MS).toISOString();
    await admin.from('signup_tokens').delete().eq('email', email);
    await admin.from('signup_tokens').insert({ email, token, expires_at });

    res.json({ ok: true, signupToken: token });
  });

  r.post('/api/auth/complete-signup', async (req, res) => {
    if (!admin) return res.status(503).json({ error: 'Server not configured.' });
    const anon = getAnonAuthClient();
    if (!anon) return res.status(503).json({ error: 'Missing anon Supabase client.' });

    const email = normEmail(req.body?.email);
    const signupToken = String(req.body?.signupToken || '');
    const password = String(req.body?.password || '');
    const confirm = String(req.body?.confirmPassword || '');
    const displayName = String(req.body?.displayName || '').trim().slice(0, 120);
    const skillKey = normalizeSkillKey(req.body?.skillDomain || 'aiml');
    const level = String(req.body?.level || 'Beginner');

    if (password.length < 8) return res.status(400).json({ error: 'Password min 8 characters.' });
    if (password !== confirm) return res.status(400).json({ error: 'Passwords do not match.' });
    if (!signupToken || !email) return res.status(400).json({ error: 'Invalid signup payload.' });

    const { data: st, error: stErr } = await admin.from('signup_tokens').select('*').eq('token', signupToken).maybeSingle();
    if (stErr || !st || st.email !== email) return res.status(400).json({ error: 'Invalid signup session.' });
    if (new Date(st.expires_at) < new Date()) {
      await admin.from('signup_tokens').delete().eq('token', signupToken);
      return res.status(400).json({ error: 'Signup session expired.' });
    }

    const {
      data: created,
      error: createErr
    } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || email.split('@')[0], skill_domain: skillKey, level }
    });
    if (createErr) {
      if (String(createErr.message).includes('already')) return res.status(409).json({ error: 'Email already registered. Sign in instead.' });
      return res.status(400).json({ error: createErr.message });
    }

    await admin.from('signup_tokens').delete().eq('token', signupToken);

    const uid = created.user.id;
    await admin
      .from('profiles')
      .update({
        display_name: displayName || email.split('@')[0],
        email,
        skill_domain: skillKey,
        level,
        loop_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', uid);

    const { data: sess, error: sErr } = await anon.auth.signInWithPassword({ email, password });
    if (sErr || !sess?.session)
      return res.json({
        ok: true,
        message: 'Account created — sign in with email + password.',
        userId: uid
      });

    res.json({
      ok: true,
      session: {
        access_token: sess.session.access_token,
        refresh_token: sess.session.refresh_token,
        expires_at: sess.session.expires_at,
        user: { id: uid, email, displayName: displayName || email.split('@')[0], skill_domain: skillKey, level }
      }
    });
  });

  r.post('/api/auth/login', async (req, res) => {
    const anon = getAnonAuthClient();
    if (!anon) return res.status(503).json({ error: 'Auth not configured.' });
    const email = normEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !data?.session) {
      const msg = error?.message || '';
      // Surface meaningful error vs generic invalid credentials
      const friendlyMsg = msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')
        ? 'Incorrect email or password.'
        : msg || 'Could not sign in.';
      return res.status(401).json({ error: friendlyMsg });
    }

    const uid = data.user.id;
    const { data: profile } = admin ? await admin.from('profiles').select('*').eq('id', uid).maybeSingle() : { data: null };

    res.json({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: uid,
          email: data.user.email,
          displayName: profile?.display_name || '',
          skill_domain: profile?.skill_domain || '',
          level: profile?.level || 'Beginner',
          points: profile?.points || 0
        }
      }
    });
  });

  /** Direct signup — no OTP. Username + email + password in one step. */
  r.post('/api/auth/register', async (req, res) => {
    if (!admin) return res.status(503).json({ error: 'Server not configured.' });
    const email = normEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || '').trim().slice(0, 120);
    const skillDomain = normalizeSkillKey(req.body?.skillDomain || 'aiml');
    const level = ['Beginner', 'Intermediate', 'Advanced'].includes(req.body?.level) ? req.body.level : 'Beginner';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email required.' });
    if (!displayName) return res.status(400).json({ error: 'Username is required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    try {
      // Create user via Supabase Admin (skips email confirmation)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { displayName }
      });
      if (createErr) {
        if (createErr.message?.toLowerCase().includes('already')) {
          return res.status(400).json({ error: 'An account with this email already exists.' });
        }
        return res.status(400).json({ error: createErr.message });
      }
      const uid = created.user.id;

      // Create profile row
      await admin.from('profiles').upsert({
        id: uid,
        display_name: displayName,
        skill_domain: skillDomain,
        level,
        points: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // Sign in to get a session token — retry once after brief delay
      // (Supabase admin user creation may need a moment to propagate)
      const anonClient = getAnonAuthClient();
      if (!anonClient) {
        console.warn('[register] SUPABASE_ANON_KEY not set — cannot auto sign-in after register.');
        return res.status(200).json({ ok: true, message: 'Account created. Please sign in.' });
      }

      const trySignIn = () => anonClient.auth.signInWithPassword({ email, password });
      let { data: signInData, error: signInErr } = await trySignIn();

      if (signInErr || !signInData?.session) {
        // Wait 800ms and retry — Supabase needs a moment after admin createUser
        await new Promise(r => setTimeout(r, 800));
        ({ data: signInData, error: signInErr } = await trySignIn());
      }

      if (signInErr || !signInData?.session) {
        console.warn('[register] Auto sign-in failed after retry:', signInErr?.message);
        return res.status(200).json({ ok: true, message: 'Account created. Please sign in.' });
      }

      res.json({
        ok: true,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_at: signInData.session.expires_at,
          user: {
            id: uid,
            email,
            displayName,
            skill_domain: skillDomain,
            level,
            points: 0
          }
        }
      });
    } catch (e) {
      console.error('[register]', e);
      res.status(500).json({ error: e.message });
    }
  });

  /** Refresh an expired access_token using the stored refresh_token */
  r.post('/api/auth/refresh', async (req, res) => {
    const anon = getAnonAuthClient();
    if (!anon) return res.status(503).json({ error: 'Auth not configured.' });
    const refreshToken = String(req.body?.refresh_token || '');
    if (!refreshToken) return res.status(400).json({ error: 'refresh_token required.' });
    const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    res.json({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  });

  return r;
};
