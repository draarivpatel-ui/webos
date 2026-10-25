# AarivOS build log (2026-10-24)

Followed the Hack Club webOS jam (jams.hackclub.com/batch/webOS) parts 1-4.

1. Read the jam guide (4 parts) from the hackclub/jams repo.
2. Boot screen + desktop + top bar with live clock (jam: desktop/top bar).
3. Window system per the jam: createWindow initializer, drag handle,
   close dots, raise-on-focus z-index (jam: windows + z-index chapters).
4. Icon grid with selection state + double-click to open (jam: app icons).
5. Apps: About, Files (localStorage FS), Notes (autosave into FS).
6. Terminal with 8 commands, `open` launches other apps in windows.
7. Paint (pointer canvas) + Settings (3 wallpapers, persisted, erase-all).
8. Fixed two bugs found in testing: terminal printed escaped HTML
   (switched to insertAdjacentHTML), default FS wasn't persisted.
9. Verified in a real browser: boot, 2 windows, terminal help/ls/cat, screenshot.
10. Added Text Editor: filename + Save writes into the same localStorage FS as
    Files/Notes, so saved files show up in Files automatically; ⌘/Ctrl+S saves.
11. Added Music: Web Audio synth, one octave C4-C5 (with black keys), sine/
    triangle toggle, record + replay of the take, also playable from the
    A-K / W E T Y U computer keys. AudioContext and timers are cleaned up when
    the window closes (render-cleanup pattern).
12. Added System Monitor: requestAnimationFrame noise-driven CPU/MEM bars that
    also react to how many windows are open, a real uptime counter, and a live
    window count + process chips read from the openWindows Map.
13. Small pattern extensions for the monitor: openWindowCount() helper next to
    the window system and a BOOT_AT timestamp for uptime.
14. node --check clean. Browser pass still to do: sound needs one interaction
    before it starts (autoplay policy), and the piano layout wants eyeballing.

Each numbered step is a devlog-sized chunk. Attach screenshot.png to devlogs.
