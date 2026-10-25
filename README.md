# AarivOS

A tiny operating system that runs in a browser tab. Built from the Hack Club
webOS jam (batch guide) and customized:

- **Window manager** exactly like the jam teaches: one `createWindow`
  initializer, drag-by-handle, close dots, raise-on-focus z-index.
- **Boot screen**, top bar with a live clock and focused-app name.
- **Nine apps**: About, Files (persistent virtual file system in localStorage,
  click a file to read it), Notes (autosaves, files appear in Files), Text
  Editor (name + Save writes into the same file system, ⌘/Ctrl+S works), Music
  (Web Audio synth — one octave C4–C5 with sharps, sine/triangle toggle,
  record & replay, playable from your computer keyboard), Terminal (`help`,
  `ls`, `cat`, `echo`, `date`, `whoami`, `open <app>`, `clear`), Paint (canvas
  doodle with color and brush size), System Monitor (live CPU/MEM bars, uptime
  counter, real open-window count), Settings (three wallpapers, erase-all —
  persisted).
- Vanilla HTML/CSS/JS, zero dependencies, keyboard accessible (Enter opens an
  icon, Esc closes the focused window, the synth is playable from the A–K row).

![AarivOS running three apps at once](screenshot.png)

Live: https://aariv.me/webos/

## Why I built this

The Hack Club webOS mission said "make it yours", so I did what I always
do: gave it ten real apps instead of two toy ones and made the terminal able
to open the rest. The studio method, pointed at a mission.

## Honest AI note

Built by AI coding agents (ZCode + Claude Code) under Aariv Patel's direction,
following the jam guide's architecture; Aariv reviewed and tested it in a real
browser. No one-click site builder.

## License

MIT.
