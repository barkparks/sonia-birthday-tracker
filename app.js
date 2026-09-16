// Sonia's birthday tracker - live-ish status client.
// Reads ONLY {stop, note, updated} from the tiny backend. No GPS, no history.
const BACKEND = (typeof window.TRACKER_BACKEND === 'string' && window.TRACKER_BACKEND.startsWith('https://'))
  ? window.TRACKER_BACKEND
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
  noteEl.textContent = d.note || STOP_NOTES[d.stop] || "Latest public stop, posted by Sonia.";
  updEl.textContent = "Updated " + relTime(d.updated);
  markRoute(d.stop);
}

async function load() {
  if (!BACKEND) { render(null); return; }
  try {
    const r = await fetch(BACKEND + (BACKEND.includes('?') ? '&' : '?') + 'path=status&cb=' + Date.now(), { redirect: 'follow' });
    if (!r.ok) throw new Error('bad status');
    render(await r.json());
  } catch (e) {
    // JSONP fallback if CORS is blocked
    try {
      const d = await new Promise((resolve, reject) => {
        const cb = 'trackerJsonp' + Math.floor(Math.random() * 1e9);
        window[cb] = resolve;
        const s = document.createElement('script');
        s.src = BACKEND + (BACKEND.includes('?') ? '&' : '?') + 'path=status&callback=' + cb + '&cb=' + Date.now();
        s.onerror = reject;
        document.head.appendChild(s);
        setTimeout(() => reject(new Error('timeout')), 8000);
      });
      render(d);
    } catch (e2) { render(null); }
  }
}

load();
setInterval(load, 60000);
