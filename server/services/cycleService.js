const { getCycleBounds } = require('../lib/cycleBounds');
const { domainMatchesSkill, normalizeSkillKey } = require('../lib/skills');

function mapProfileRow(profile) {
  if (!profile) return { skill_domain: 'aiml', level: 'Beginner', points: 0 };
  return {
    skill_domain: normalizeSkillKey(profile.skill_domain || 'aiml'),
    level: profile.level || 'Beginner',
    points: profile.points || 0
  };
}

function pickWeightedRandom(tasks) {
  if (!tasks?.length) return null;
  return tasks[Math.floor(Math.random() * tasks.length)];
}

async function loadMatchingTasks(admin, skillKey, level) {
  const { data: all, error } = await admin.from('tasks').select('*');
  if (error || !all?.length) return [];
  let list = all.filter(
    (t) => domainMatchesSkill(t.domain, skillKey) && (!level || !t.level || t.level === level)
  );
  if (list.length === 0) list = all.filter((t) => domainMatchesSkill(t.domain, skillKey));
  return list.length ? list : all;
}

async function ensureUserCycle(admin, userId, profileRow) {
  mapProfileRow(profileRow);
  const nowMs = Date.now();
  const b = getCycleBounds(nowMs);
  const selDone = nowMs >= b.selectionDeadline.toMillis();

  let { data: row } = await admin.from('user_cycle_state').select('*').eq('user_id', userId).maybeSingle();

  const needReset = !row || row.cycle_start_iso !== b.cycleStartISO;
  if (needReset) {
    await admin.from('user_cycle_state').upsert(
      {
        user_id: userId,
        cycle_start_iso: b.cycleStartISO,
        cycle_end_iso: b.cycleEndISO,
        selection_deadline_iso: b.selectionDeadlineISO,
        locked_task_id: null,
        auto_assigned: false,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
  }

  const { data: cur } = await admin.from('user_cycle_state').select('*').eq('user_id', userId).single();
  row = cur;

  if (row && !row.locked_task_id && selDone && !row.auto_assigned) {
    const profile = mapProfileRow(profileRow);
    const pool = await loadMatchingTasks(admin, profile.skill_domain, profile.level);
    const picked = pickWeightedRandom(pool);
    if (picked) {
      await admin
        .from('user_cycle_state')
        .update({
          locked_task_id: picked.id,
          auto_assigned: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      row.locked_task_id = picked.id;
      row.auto_assigned = true;
    }
  }

  let lockedTask = null;
  if (row?.locked_task_id) {
    const { data: t } = await admin.from('tasks').select('*').eq('id', row.locked_task_id).maybeSingle();
    lockedTask = t;
  }

  const ts = Date.now();
  return {
    bounds: {
      timezone: b.zone,
      cycleStartISO: b.cycleStartISO,
      cycleEndISO: b.cycleEndISO,
      selectionDeadlineISO: b.selectionDeadlineISO,
      msToCycleEnd: b.msToCycleEnd,
      msToSelectionEnd: b.msToSelectionEnd
    },
    selectionDeadlineMs: Math.max(0, b.selectionDeadline.toMillis() - ts),
    cycleEndsMs: Math.max(0, b.cycleEnd.toMillis() - ts),
    selectionWindowOpen: nowMs < b.selectionDeadline.toMillis(),
    lockedTask,
    lockedTaskId: row?.locked_task_id || null,
    autoAssigned: !!row?.auto_assigned,
    cycleReset: !!needReset
  };
}

exports.ensureUserCycle = ensureUserCycle;
exports.loadMatchingTasks = loadMatchingTasks;
exports.pickWeightedRandom = pickWeightedRandom;
exports.mapProfileRow = mapProfileRow;
