const { DateTime } = require('luxon');

/**
 * Cycle: [anchor 06:00, anchor+24h).
 * Selection window (2h): [anchor, anchor+2h].
 * User must submit before cycleEnd (= next 6am).
 */
function getCycleBounds(nowMs = Date.now(), zoneStr) {
  const zone = zoneStr || process.env.CYCLE_TIMEZONE || 'Asia/Kolkata';
  let dt = DateTime.fromMillis(nowMs, { zone });
  let todaySix = dt.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
  let cycleStart;
  let cycleEnd;
  if (dt < todaySix) {
    cycleStart = todaySix.minus({ days: 1 });
    cycleEnd = todaySix;
  } else {
    cycleStart = todaySix;
    cycleEnd = todaySix.plus({ days: 1 });
  }
  const selectionDeadline = cycleStart.plus({ hours: 2 });
  return {
    zone,
    cycleStart,
    cycleEnd,
    selectionDeadline,
    cycleStartISO: cycleStart.toISO(),
    cycleEndISO: cycleEnd.toISO(),
    selectionDeadlineISO: selectionDeadline.toISO(),
    msToCycleEnd: cycleEnd.toMillis() - nowMs,
    msToSelectionEnd: Math.max(0, selectionDeadline.toMillis() - nowMs)
  };
}

function isPastSelectionDeadline(nowMs, bounds) {
  return bounds.selectionDeadline.toMillis() <= nowMs;
}

exports.getCycleBounds = getCycleBounds;
exports.isPastSelectionDeadline = isPastSelectionDeadline;
