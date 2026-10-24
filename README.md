# AarivOS

A tiny operating system that runs in a browser tab. Built from the Hack Club
webOS jam (batch guide) and customized:

- **Window manager** exactly like the jam teaches: one `createWindow`
  initializer, drag-by-handle, close dots, raise-on-focus z-index.
- **Boot screen**, top bar with a live clock and focused-app name.
- **Six apps**: About, Files (persistent virtual file system in localStorage,
  click a file to read it), Notes (autosaves, files appear in Files), Terminal
  (`help`, `ls`, `cat`, `echo`, `date`, `whoami`, `open <app>`, `clear`), Paint
  (canvas doodle with color and brush size), Settings (three wallpapers,
  erase-all — persisted).
- Vanilla HTML/CSS/JS, zero dependencies, keyboard accessible (Enter opens an
  icon, Esc closes the focused window).

Live: https://aariv.me/webos/

## Honest AI note

Built by AI coding agents (ZCode + Claude Code) under Aariv Patel's direction,
following the jam guide's architecture; Aariv reviewed and tested it in a real
browser. No one-click site builder.

## License

MIT.
