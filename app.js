// Sonia's birthday tracker - live-ish status client.
// Reads ONLY {stop, note, updated} from a link-shared Google Sheet (row 2). No GPS, no history.
const SHEET_ID = (typeof window.TRACKER_SHEET_ID === 'string' && window.TRACKER_SHEET_ID.length > 10)
  ? window.TRACKER_SHEET_ID
  : null;
const GVIZ_URL = SHEET_ID
  ? 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:json&headers=1'
  : null;

const DEFAULTS = {
  name: "Tracker warming up...",
  note: "Saturday at 7:00pm, the plot begins. Check back for the latest public stop.",
  updated: "Updates begin party night"
};

const STOP_NOTES = {
  "Scottsdale pregame": "Opening act in Scottsdale. The trekkers are assembling.",
  "Hanshin Pocha": "Food + drinks at Hanshin Pocha in Mesa. The real general pregame.",
  "The Pemberton": "Downtown kickoff at The Pemberton. First official stop.",
  "Gracie's": "Downtown roulette landed on Gracie's.",
  "Contact": "Downtown roulette landed on Contact.",
  "Valley Bar": "Downtown roulette landed on Valley Bar.",
  "Downtown roulette": "Somewhere downtown. The plot is developing.",
  "Arcadia": "Emergency sleigh route activated. Arcadia it is.",
  "Off the radar": "Sonia has gone off the radar. Birthday magic in progress."
};

function relTime(iso) {
  const t = Date.parse(iso);
  if (!t) return "";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const h = Math.floor(mins / 60);
  return h + (h === 1 ? " hr ago" : " hrs ago");
}

function markRoute(stopName) {
  if (!stopName) return;
  const want = stopName.toLowerCase();
  document.querySelectorAll('.stop').forEach(el => {
    const h = el.querySelector('h3');
    if (!h) return;
    const txt = h.textContent.toLowerCase();
    const hit = txt === want || (want.includes(txt) && txt.length > 3) || (txt.includes(want) && want.length > 3);
    el.classList.toggle('here', hit);
  });
}

function render(d) {
  const nameEl = document.querySelector('#current-name');
  const noteEl = document.querySelector('#current-note');
  const updEl = document.querySelector('#updated');
  if (!d || !d.stop) {
    nameEl.textContent = DEFAULTS.name;
    noteEl.textContent = DEFAULTS.note;
    updEl.textContent = DEFAULTS.updated;
    return;
  }
  nameEl.textContent = d.stop;
  noteEl.textContent = d.note || STOP_NOTES[d.stop] || "Latest public stop, confirmed by Sonia.";
  updEl.textContent = "Updated " + relTime(d.updated);
  markRoute(d.stop);
}

function extract(g) {
  try {
    const rows = g.table.rows || [];
    if (!rows.length) return null;
    const c = rows[0].c || [];
    return {
      stop: (c[0] && c[0].v) || "",
      note: (c[1] && c[1].v) || "",
      updated: (c[2] && c[2].v) || ""
    };
  } catch (e) { return null; }
}

async function load() {
  if (!GVIZ_URL) { render(null); return; }
  const url = GVIZ_URL + '&cb=' + Date.now();
  try {
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) throw new Error('bad status');
    const text = await r.text();
    const start = text.indexOf('setResponse(');
    if (start === -1) throw new Error('unexpected payload');
    const json = text.slice(start + 12, text.lastIndexOf(')'));
    render(extract(JSON.parse(json)));
  } catch (e) {
    // Script-tag fallback if CORS is blocked
    try {
      const g = await new Promise((resolve, reject) => {
        window.google = window.google || {};
        window.google.visualization = { Query: { setResponse: resolve } };
        const s = document.createElement('script');
        s.src = url;
        s.onerror = reject;
        document.head.appendChild(s);
        setTimeout(() => reject(new Error('timeout')), 8000);
      });
      render(extract(g));
    } catch (e2) { render(null); }
  }
}

load();
setInterval(load, 60000);
