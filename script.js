/* AarivOS — window system + apps, following the Hack Club webOS jam
   (icons with selection state, one createWindow initializer, drag via
   handle, close buttons, raise-on-focus z-index) and customized. */
"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const store = {
  get(k, d) { try { const v = localStorage.getItem("aarivos:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("aarivos:" + k, JSON.stringify(v)); } catch {} },
};

/* ---------- boot ---------- */
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    $("#boot").classList.add("done");
    $("#desktop").hidden = false;
    setTimeout(() => $("#boot").remove(), 600);
  }, 1100);
});

/* ---------- clock ---------- */
const BOOT_AT = Date.now(); // session start — uptime source for System Monitor
function tick() {
  const n = new Date();
  $("#tb-clock").textContent = n.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
setInterval(tick, 1000); tick();

/* ---------- window system (jam pattern) ---------- */
let topZ = 10;
const openWindows = new Map(); // appId -> { el }

function createWindow(app) {
  if (openWindows.has(app.id)) { // already open: focus it
    const w = openWindows.get(app.id);
    raise(w.el); return;
  }
  const el = document.createElement("section");
  el.className = "window";
  el.style.width = (app.w || 340) + "px";
  el.style.height = (app.h || 260) + "px";
  el.style.left = (40 + openWindows.size * 28 + (app.x || 0)) + "px";
  el.style.top = (24 + openWindows.size * 24) + "px";
  el.style.zIndex = ++topZ;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", app.name);

  const handle = document.createElement("div");
  handle.className = "handle";
  handle.innerHTML =
    '<span class="dots"><span class="dot close" title="close"></span><span class="dot min"></span><span class="dot z"></span></span>' +
    '<span class="title">' + app.name + "</span>";
  el.appendChild(handle);

  const body = document.createElement("div");
  body.className = "body";
  el.appendChild(body);

  makeDraggable(el, handle);
  raise(el);
  el.addEventListener("pointerdown", () => raise(el));

  const close = $(".dot.close", handle);
  close.style.cursor = "pointer";
  close.addEventListener("click", () => closeWindow(app.id));

  const cleanup = app.render(body, el);
  openWindows.set(app.id, { el, cleanup: typeof cleanup === "function" ? cleanup : null });
  $("#windows").appendChild(el);
  $("#tb-app").textContent = "— " + app.name;
  return el;
}

function closeWindow(id) {
  const w = openWindows.get(id);
  if (!w) return;
  if (w.cleanup) w.cleanup();
  w.el.remove();
  openWindows.delete(id);
  $("#tb-app").textContent = "";
}

const openWindowCount = () => openWindows.size; // live count for System Monitor

function raise(el) {
  el.style.zIndex = ++topZ;
  document.querySelectorAll(".window").forEach((w) => w.classList.toggle("focused", w === el));
}

function makeDraggable(win, handle) {
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
  handle.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("dot")) return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    ox = win.offsetLeft; oy = win.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const maxX = window.innerWidth - 90;
    const maxY = window.innerHeight - 60;
    win.style.left = Math.min(Math.max(ox + e.clientX - sx, -40), maxX) + "px";
    win.style.top = Math.min(Math.max(oy + e.clientY - sy, 34), maxY) + "px";
  });
  handle.addEventListener("pointerup", () => { dragging = false; });
}

window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const focused = document.querySelector(".window.focused");
  if (!focused) return;
  for (const [id, w] of openWindows) if (w.el === focused) closeWindow(id);
});

const defaultFS = {
  "read-me.txt": "Welcome to AarivOS.\n\nThis file system is fake but persistent: create a file in Notes and it appears here.",
  "ideas.md": "# ideas\n- ship everything by oct 31\n- rate 18 projects\n- wasitme film remaster",
};
if (store.get("fs", null) === null) store.set("fs", defaultFS);

/* ---------- apps ---------- */
const Apps = [];

Apps.push({
  id: "about", name: "About", glyph: "✦", w: 330, h: 240,
  render(body) {
    body.innerHTML = `
      <h2 style="color:var(--accent);font-size:16px;margin-bottom:8px">AarivOS</h2>
      <p style="color:var(--dim)">A tiny operating system that runs in a browser tab.
      Built from the Hack Club webOS jam and customized: real window manager
      (drag, focus, close), a virtual file system, notes, a text editor, a synth,
      a terminal, paint, a system monitor, and settings
      that remember your wallpaper. Everything lives in localStorage — nothing leaves this tab.</p>
      <p style="margin-top:10px;font-size:12px;color:var(--dim)">Built by Aariv Patel with AI coding agents under his direction.</p>`;
  },
});

Apps.push({
  id: "files", name: "Files", glyph: "🗂", w: 360, h: 300,
  render(body) {
    const fs = store.get("fs", defaultFS);
    const draw = (path = "") => {
      const names = Object.keys(fs).sort();
      body.innerHTML = '<div class="path">/home/aariv' + (path ? "/" + path : "") + "</div>" +
        '<div class="filelist">' +
        (names.map((n) =>
          '<div class="filerow" data-f="' + n + '"><span class="name">' + n + "</span>" +
          '<span class="meta">' + (fs[n].length || 1) + " bytes</span></div>"
        ).join("") || '<div class="filerow"><span class="name" style="color:var(--dim)">(empty)</span></div>') +
        "</div>";
      body.querySelectorAll(".filerow[data-f]").forEach((row) => {
        row.addEventListener("click", () => {
          const name = row.dataset.f;
          body.innerHTML = '<div class="path">/home/aariv/' + name + '</div>' +
            '<pre style="white-space:pre-wrap;font:12.5px ui-monospace,monospace;color:var(--dim)">' +
            String(fs[name]).replace(/</g, "&lt;") + "</pre>" +
            '<div style="margin-top:10px"><button class="tb-btn" style="background:var(--panel-2);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:4px 10px;cursor:pointer">← back</button></div>';
          body.querySelector("button").addEventListener("click", () => draw());
        });
      });
    };
    draw();
  },
});

Apps.push({
  id: "notes", name: "Notes", glyph: "📝", w: 380, h: 300,
  render(body) {
    const saved = store.get("notes", "notes live here.\nautosaves as you type.");
    body.innerHTML = '<div class="saved-flash"></div><textarea class="notes-area"></textarea>';
    const ta = $("textarea", body); const flash = $(".saved-flash", body);
    ta.value = saved;
    let t;
    ta.addEventListener("input", () => {
      flash.textContent = "";
      clearTimeout(t);
      t = setTimeout(() => {
        store.set("notes", ta.value);
        const fs = store.get("fs", {}); fs["notes.txt"] = ta.value; store.set("fs", fs);
        flash.textContent = "saved ✓";
      }, 500);
    });
    setTimeout(() => ta.focus(), 50);
  },
});

Apps.push({
  id: "terminal", name: "Terminal", glyph: "›_", w: 420, h: 280,
  render(body) {
    body.innerHTML = '<div class="term"><div class="out"><b>AarivOS</b> terminal — try <b>help</b></div></div>' +
      '<div class="term-row"><span class="ps">aariv@os:~$</span><input autocomplete="off" spellcheck="false"></div>';
    const out = $(".out", body); const input = $("input", body);
    const print = (s) => { out.insertAdjacentHTML("beforeend", "\n" + s); body.scrollTop = body.scrollHeight; };
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const line = input.value.trim(); input.value = "";
      print('<span style="color:var(--accent)">aariv@os:~$</span> ' + line.replace(/</g, "&lt;"));
      const [cmd, ...rest] = line.split(/\s+/);
      const fs = store.get("fs", {});
      const cmds = {
        help: () => print("commands: help, ls, cat &lt;file&gt;, echo, date, whoami, open &lt;app&gt;, clear"),
        ls: () => print(Object.keys(fs).join("  ") || "(empty)"),
        cat: (f) => print(fs[f] !== undefined ? String(fs[f]).replace(/</g, "&lt;") : "cat: " + (f || "?") + ": no such file"),
        echo: (...w) => print(w.join(" ")),
        date: () => print(new Date().toString()),
        whoami: () => print("aariv — builder of this os"),
        open: (a) => { const app = Apps.find((x) => x.id === a); if (app) { createWindow(app); print("opened " + app.name); } else print("no app: " + (a || "?")); },
        clear: () => { out.innerHTML = ""; },
      };
      (cmds[cmd] || (() => print(cmd ? cmd + ": command not found" : "")))(...rest);
    });
    setTimeout(() => input.focus(), 50);
  },
});

Apps.push({
  id: "paint", name: "Paint", glyph: "🎨", w: 420, h: 340,
  render(body, win) {
    body.innerHTML = '<div class="paint-tools"><input type="color" value="#f5a742">' +
      '<input type="range" min="1" max="24" value="4" style="width:90px">' +
      '<button>clear</button></div><canvas class="paint" width="360" height="220"></canvas>';
    const cv = $("canvas", body); const ctx = cv.getContext("2d");
    const color = $('input[type="color"]', body); const size = $('input[type="range"]', body);
    let down = false;
    const pt = (e) => ({ x: e.clientX - cv.getBoundingClientRect().left, y: e.clientY - cv.getBoundingClientRect().top });
    cv.addEventListener("pointerdown", (e) => { down = true; const p = pt(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    cv.addEventListener("pointermove", (e) => {
      if (!down) return; const p = pt(e);
      ctx.strokeStyle = color.value; ctx.lineWidth = +size.value; ctx.lineCap = "round";
      ctx.lineTo(p.x, p.y); ctx.stroke();
    });
    window.addEventListener("pointerup", () => { down = false; });
    $("button", body).addEventListener("click", () => ctx.clearRect(0, 0, cv.width, cv.height));
  },
});

Apps.push({
  id: "settings", name: "Settings", glyph: "⚙️", w: 330, h: 220,
  render(body) {
    body.innerHTML = '<div class="settings">' +
      "<label>Wallpaper <select><option value=\"\">Nebula (default)</option><option value=\"alt-1\">Ember</option><option value=\"alt-2\">Forest</option></select></label>" +
      "<label>Reset everything <button style='background:var(--panel-2);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:4px 10px;cursor:pointer'>erase</button></label>" +
      '<p style="font-size:11.5px;color:var(--dim)">Choices are saved in localStorage on this device.</p></div>';
    const sel = $("select", body);
    sel.value = store.get("wall", "");
    sel.addEventListener("change", () => { store.set("wall", sel.value); $("#wall").className = sel.value; });
    $("button", body).addEventListener("click", () => {
      Object.keys(localStorage).filter((k) => k.startsWith("aarivos:")).forEach((k) => localStorage.removeItem(k));
      body.innerHTML = '<p style="color:var(--dim)">Everything erased. Reopen Settings to start fresh.</p>';
    });
  },
});

Apps.push({
  id: "clock", name: "Clock", glyph: "🕒", w: 320, h: 280,
  render(body) {
    const btnStyle = "flex:1;background:var(--panel-2);color:var(--text);border:1px solid var(--line);" +
      "border-radius:8px;padding:5px 10px;cursor:pointer;font-size:12px";
    body.innerHTML = '<div style="text-align:center">' +
      '<div class="clock-time" style="font:600 42px/1.1 ui-monospace,\'SF Mono\',Menlo,monospace;font-variant-numeric:tabular-nums;color:var(--accent)">--:--:--</div>' +
      '<div class="clock-date" style="margin-top:4px;font-size:12px;color:var(--dim)">&nbsp;</div>' +
      '</div>' +
      '<div style="margin:16px 0 10px;border-top:1px solid var(--line)"></div>' +
      '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Stopwatch</div>' +
      '<div class="sw-display" style="font:500 26px/1.2 ui-monospace,\'SF Mono\',Menlo,monospace;font-variant-numeric:tabular-nums">00:00.0</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
      '<button data-act="toggle" style="' + btnStyle + '">start</button>' +
      '<button data-act="reset" style="' + btnStyle + '">reset</button></div>';

    const timeEl = $(".clock-time", body);
    const dateEl = $(".clock-date", body);
    const swEl = $(".sw-display", body);
    const toggle = $('[data-act="toggle"]', body);
    const reset = $('[data-act="reset"]', body);

    const drawClock = () => {
      const n = new Date();
      timeEl.textContent = n.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      dateEl.textContent = n.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    };
    drawClock();
    const clockTimer = setInterval(drawClock, 1000);

    let elapsed = 0, startedAt = 0, running = false;
    const fmt = (ms) => {
      const tenths = Math.floor(ms / 100) % 10;
      const secs = Math.floor(ms / 1000) % 60;
      const mins = Math.floor(ms / 60000);
      return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0") + "." + tenths;
    };
    const drawSw = () => { swEl.textContent = fmt(elapsed + (running ? performance.now() - startedAt : 0)); };
    const swTimer = setInterval(() => { if (running) drawSw(); }, 100);

    toggle.addEventListener("click", () => {
      if (running) {
        elapsed += performance.now() - startedAt;
        running = false;
        toggle.textContent = "start";
      } else {
        startedAt = performance.now();
        running = true;
        toggle.textContent = "stop";
      }
      drawSw();
    });
    reset.addEventListener("click", () => {
      elapsed = 0; running = false;
      toggle.textContent = "start";
      drawSw();
    });
    drawSw();

    return () => { clearInterval(clockTimer); clearInterval(swTimer); };
  },
});

Apps.push({
  id: "editor", name: "Text Editor", glyph: "📄", w: 420, h: 320,
  render(body) {
    body.innerHTML = '<div class="editor-wrap">' +
      '<div class="editor-bar">' +
      '<input class="editor-name" value="untitled.txt" spellcheck="false" autocomplete="off" aria-label="File name">' +
      '<button class="btn" data-act="save">Save</button></div>' +
      '<div class="saved-flash"></div>' +
      '<textarea class="notes-area" aria-label="File contents"></textarea></div>';
    const name = $(".editor-name", body);
    const ta = $("textarea", body);
    const flash = $(".saved-flash", body);
    const save = () => {
      const fname = name.value.trim() || "untitled.txt";
      const fs = store.get("fs", {});
      fs[fname] = ta.value;
      store.set("fs", fs);
      name.value = fname;
      flash.textContent = "saved /home/aariv/" + fname + " ✓";
    };
    $('[data-act="save"]', body).addEventListener("click", save);
    ta.addEventListener("input", () => { flash.textContent = ""; });
    name.addEventListener("input", () => { flash.textContent = ""; });
    body.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    });
    setTimeout(() => { name.focus(); name.select(); }, 50);
  },
});

Apps.push({
  id: "music", name: "Music", glyph: "🎹", w: 460, h: 330,
  render(body) {
    // one octave C4-C5; b = white-key boundary a sharp sits behind (grid of 8)
    const NOTES = [
      { n: "C4", f: 261.63, k: "a" },
      { n: "C#4", f: 277.18, k: "w", b: 1, black: true },
      { n: "D4", f: 293.66, k: "s" },
      { n: "D#4", f: 311.13, k: "e", b: 2, black: true },
      { n: "E4", f: 329.63, k: "d" },
      { n: "F4", f: 349.23, k: "f" },
      { n: "F#4", f: 369.99, k: "t", b: 4, black: true },
      { n: "G4", f: 392.00, k: "g" },
      { n: "G#4", f: 415.30, k: "y", b: 5, black: true },
      { n: "A4", f: 440.00, k: "h" },
      { n: "A#4", f: 466.16, k: "u", b: 6, black: true },
      { n: "B4", f: 493.88, k: "j" },
      { n: "C5", f: 523.25, k: "k" },
    ];
    let wi = 0;
    const keysHtml = NOTES.map((nt) => {
      const hint = nt.n + (nt.black ? " (sharp)" : "") + ", key " + nt.k.toUpperCase();
      if (!nt.black) {
        return '<button class="pkey" data-n="' + nt.n + '" style="left:' + (wi++ * 12.5) +
          '%;width:12.5%" aria-label="' + hint + '"><span>' + nt.k.toUpperCase() + "</span></button>";
      }
      return '<button class="pkey black" data-n="' + nt.n + '" style="left:' + (nt.b * 12.5 - 3.75) +
        '%;width:7.5%" aria-label="' + hint + '"><span>' + nt.k.toUpperCase() + "</span></button>";
    }).join("");
    body.innerHTML = '<div class="music-row">' +
      '<label style="display:flex;gap:6px;align-items:center;font-size:12px;color:var(--dim)">Wave ' +
      '<select data-act="wave" aria-label="Oscillator wave"><option value="sine">sine</option><option value="triangle">triangle</option></select></label>' +
      '<button class="btn" data-act="rec">● rec</button>' +
      '<button class="btn" data-act="play">▶ replay</button>' +
      '<button class="btn" data-act="clear">clear</button>' +
      '<span class="music-count" style="font-size:11px;color:var(--dim)"></span></div>' +
      '<div class="piano">' + keysHtml + "</div>" +
      '<div class="music-note">Click the keys or play from your keyboard: A S D F G H J K (+ W E T Y U for sharps).</div>';

    const piano = $(".piano", body);
    const keyEls = {};
    NOTES.forEach((nt) => { keyEls[nt.n] = $('[data-n="' + nt.n + '"]', body); });
    const countEl = $(".music-count", body);
    const recBtn = $('[data-act="rec"]', body);
    const playBtn = $('[data-act="play"]', body);

    let ctx = null, wave = "sine";
    const ensureCtx = () => {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    };
    const playNote = (f, dur = 0.45) => {
      const ac = ensureCtx();
      const t0 = ac.currentTime;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = wave; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(ac.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    };

    let recOn = false, take = [], recStart = 0, playing = false;
    const timers = [];
    const flash = (n) => {
      const el = keyEls[n]; if (!el) return;
      el.classList.add("down");
      timers.push(setTimeout(() => el.classList.remove("down"), 180));
    };
    const drawCount = () => {
      countEl.textContent = take.length ? take.length + (take.length === 1 ? " note" : " notes") : "";
      playBtn.disabled = !take.length || playing;
    };
    const press = (n) => {
      const nt = NOTES.find((x) => x.n === n); if (!nt) return;
      playNote(nt.f);
      flash(n);
      if (recOn) { take.push({ n, t: performance.now() - recStart }); drawCount(); }
    };

    piano.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".pkey"); if (el) press(el.dataset.n);
    });
    const onKeys = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest && e.target.closest("input, textarea, select")) return;
      const nt = NOTES.find((x) => x.k === e.key.toLowerCase());
      if (nt) { e.preventDefault(); press(nt.n); }
    };
    window.addEventListener("keydown", onKeys);

    recBtn.addEventListener("click", () => {
      recOn = !recOn;
      if (recOn) { take = []; recStart = performance.now(); }
      recBtn.textContent = recOn ? "■ stop" : "● rec";
      recBtn.classList.toggle("rec-on", recOn);
      drawCount();
    });
    playBtn.addEventListener("click", () => {
      if (!take.length || playing) return;
      playing = true; playBtn.disabled = true;
      const total = take[take.length - 1].t + 450;
      take.forEach((ev) => {
        const nt = NOTES.find((x) => x.n === ev.n); if (!nt) return;
        timers.push(setTimeout(() => { playNote(nt.f); flash(ev.n); }, ev.t));
      });
      timers.push(setTimeout(() => { playing = false; drawCount(); }, total));
    });
    $('[data-act="clear"]', body).addEventListener("click", () => {
      take = []; recOn = false;
      recBtn.textContent = "● rec"; recBtn.classList.remove("rec-on");
      drawCount();
    });
    $('[data-act="wave"]', body).addEventListener("change", (e) => { wave = e.target.value; });
    drawCount();

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKeys);
      if (ctx) ctx.close();
      ctx = null;
    };
  },
});

Apps.push({
  id: "sysmon", name: "System Monitor", glyph: "📊", w: 380, h: 300,
  render(body) {
    body.innerHTML =
      '<div class="mon-row"><span class="mon-label">CPU</span>' +
      '<div class="mon-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-label="CPU usage"><div class="mon-fill" data-k="cpu"></div></div>' +
      '<span class="mon-val" data-v="cpu">--%</span></div>' +
      '<div class="mon-row" style="margin-top:10px"><span class="mon-label">MEM</span>' +
      '<div class="mon-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-label="Memory usage"><div class="mon-fill" data-k="mem"></div></div>' +
      '<span class="mon-val" data-v="mem">--%</span></div>' +
      '<div class="mon-stats">' +
      '<div class="mon-stat"><span class="mon-k">Uptime</span><span class="mon-v" data-v="up">0:00:00</span></div>' +
      '<div class="mon-stat"><span class="mon-k">Windows</span><span class="mon-v" data-v="win">' + openWindowCount() + "</span></div>" +
      "</div>" +
      '<div><div class="mon-k">Processes (live)</div><div class="mon-list" data-v="procs"></div></div>';

    const cpuFill = $('[data-k="cpu"]', body), memFill = $('[data-k="mem"]', body);
    const cpuVal = $('[data-v="cpu"]', body), memVal = $('[data-v="mem"]', body);
    const upVal = $('[data-v="up"]', body), winVal = $('[data-v="win"]', body);
    const procsEl = $('[data-v="procs"]', body);
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const fmtUp = (ms) => {
      const s = Math.floor(ms / 1000);
      return Math.floor(s / 3600) + ":" + String(Math.floor(s / 60) % 60).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    };
    let cpu = 22, mem = 38, cpuT = cpu, memT = mem, frame = 0, lastProcs = "";
    let raf;
    const loop = () => {
      frame++;
      const wins = openWindowCount();
      if (frame % 40 === 0) { // new noise target ~every 2/3s; more windows = busier
        cpuT = clamp(8 + wins * 4 + Math.random() * 34, 5, 97);
        memT = clamp(24 + wins * 5 + Math.random() * 14, 18, 92);
      }
      cpu += (cpuT - cpu) * 0.055;
      mem += (memT - mem) * 0.055;
      cpuFill.style.width = cpu.toFixed(1) + "%";
      memFill.style.width = mem.toFixed(1) + "%";
      if (frame % 12 === 0) {
        cpuVal.textContent = Math.round(cpu) + "%";
        memVal.textContent = Math.round(mem) + "%";
        cpuFill.parentElement.setAttribute("aria-valuenow", Math.round(cpu));
        memFill.parentElement.setAttribute("aria-valuenow", Math.round(mem));
        upVal.textContent = fmtUp(Date.now() - BOOT_AT);
        winVal.textContent = wins;
      }
      const sig = [...openWindows.keys()].join();
      if (sig !== lastProcs) {
        lastProcs = sig;
        procsEl.innerHTML = sig
          ? [...openWindows.keys()].map((id) => { const a = Apps.find((x) => x.id === id); return '<span class="proc">' + (a ? a.name : id) + "</span>"; }).join("")
          : '<span class="proc">nothing running — open an app!</span>';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  },
});

/* ---------- icon grid (jam pattern: selection state) ---------- */
function buildIcons() {
  const nav = $("#icons");
  let selected = null;
  Apps.forEach((app) => {
    const el = document.createElement("div");
    el.className = "icon";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "open " + app.name);
    el.innerHTML = '<div class="glyph">' + app.glyph + '</div><div class="label">' + app.name + "</div>";
    const pick = () => {
      if (selected) selected.classList.remove("selected");
      selected = el; el.classList.add("selected");
    };
    el.addEventListener("click", pick);
    el.addEventListener("dblclick", () => { pick(); createWindow(app); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); createWindow(app); } });
    nav.appendChild(el);
  });
}
buildIcons();

/* apply saved wallpaper */
$("#wall").className = store.get("wall", "");
