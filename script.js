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

  openWindows.set(app.id, { el });
  $("#windows").appendChild(el);
  $("#tb-app").textContent = "— " + app.name;

  app.render(body, el);
  return el;
}

function closeWindow(id) {
  const w = openWindows.get(id);
  if (!w) return;
  w.el.remove();
  openWindows.delete(id);
  $("#tb-app").textContent = "";
}

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
      (drag, focus, close), a virtual file system, notes, a terminal, paint, and settings
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
