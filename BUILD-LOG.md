# AarivOS Build Log

My development log for building **AarivOS** for the Hack Club Stardance webOS mission.

## 1. Desktop Shell, Boot Screen & Window Manager (`index.html`, `style.css`, `script.js`)

1. Followed the 4-part Hack Club webOS jam guide to lay out the boot screen, desktop icon grid, and top menu bar with a live clock and focused-app title indicator.
2. Built the `createWindow(appId)` window manager with pointer-based titlebar dragging, viewport boundary clamping, traffic-light close buttons, and `topZ` focus elevation whenever a window is clicked or re-opened.
3. Added keyboard accessibility across the desktop: `Enter` launches a focused desktop icon and `Escape` closes the currently focused window.

## 2. Shared Virtual File System & Core Productivity Apps

4. Implemented a persistent virtual file system in `localStorage` seeded with starter text files (`welcome.txt`, `readme.md`, `shortcuts.txt`).
5. Built **About**, **Files** (two-pane directory browser and file reader), **Notes** (autosaving scratchpad), and **Text Editor** (filename input + `Cmd/Ctrl + S` saving straight into the virtual file system with live refresh across open Files windows).

## 3. Terminal, Paint, Web Audio Synth, System Monitor & Settings

6. Built **Terminal** with 8 commands (`help`, `ls`, `cat`, `echo`, `date`, `whoami`, `open <app>`, `clear`) wired directly to the virtual file system and window launcher.
7. Built **Paint** with HTML5 `<canvas>` pointer drawing, color palette, brush width control, and clear button.
8. Built **Music**, a 1-octave (`C4-C5`) Web Audio API synthesizer with `Sine`/`Triangle` waveform switching, computer keyboard playback (`A-K` and `W E T Y U`), and a Record/Replay loop recorder.
9. Built **System Monitor** with a live uptime counter, active window process list, and dynamic CPU/MEM bars, plus **Settings** with 3 persistent desktop wallpapers and a storage reset button.
10. Added window teardown hooks (`winEl._cleanup`) so closing Music or System Monitor cleanly stops active audio nodes, replay timers, and animation frames.
