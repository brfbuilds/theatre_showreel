BENJAMIN FOWLER - 3D CINEMA WEBSITE
===================================

TO VIEW: double-click index.html (Chrome, Edge, Safari or Firefox).

REELS: on the live site (any http/https address) both reels play from YouTube:
  Showreel     https://www.youtube.com/watch?v=Wbg1a59RsY4
  Action reel  https://www.youtube.com/watch?v=bxoczr9P0GU
When you double-click index.html from disk, YouTube can't play, so it uses
..\showreel.mp4 and ..\Benjamin Fowler Action Reel.mp4 instead. Keep this "website"
folder inside ACTING RESUME, next to those files, for testing on your computer.
Keep both YouTube videos Public or Unlisted with "Allow embedding" switched on.

ENTRANCE OPTIONS
- "Tap to enter the cinema": the full walk-through.
- "Go straight to the showreel": same ticket, but fades straight to your seat.
- "or view the simple version": a plain, fast page with headshot, stats, skills, both reels
  and all credits (also reachable from the Box Office, or by adding #simple to the address).

CASTING STATS: taken from your Spotlight profile (Sept 2026). To change them, open
index.html in Notepad and search for "CASTING STATS" (the block appears twice: Box
Office and simple version), or ask Claude to re-read your Spotlight page.

HOW IT WORKS
- Click the ticket to enter (this also allows the reel to play with sound).
- A little floating usher leads the way, points out each poster, shows you through the
  doors to your seat, then floats off when the lights go down.
- Scroll the mouse wheel DOWN to walk forward (up to go back). On phones, swipe DOWN
  to walk forward. You turn to face each poster as you pass it.
  (To change the walking speed, edit WALK_SCREENS near "wheel" in assets/app.js:
  bigger = slower.)
- At your seat, two tickets appear: Showreel or Action Reel. Pick one and the lights dim,
  curtains open, 5-4-3-2-1 countdown, then the reel. (After someone has seen the
  countdown once, a "Skip countdown" button appears on later visits.)
- While watching, the remote control (bottom right) has play/pause, a slider to jump
  to any point, -10s/+10s, CH1/CH2 to switch between the two reels, mute, credits,
  lobby and box office. Keyboard: Space = play/pause, Left/Right = back/forward 10s.
- Nothing large downloads when the page opens: the reel only starts loading as you
  approach the theatre doors.
- The two reels are listed in index.html under window.REELS. "yt" is the YouTube
  video ID (the part after watch?v= in the link); "src" is the file used offline.
  To swap a reel for a new cut, upload it to YouTube and replace its yt ID. In the
  simple version, also replace the matching data-yt="..." on its <video> tag.
- If YouTube can't load (blocked network), the site falls back to the video files.
- When the reel ends, the full credits list rolls on the screen, then the Box Office opens.
- Arrow keys step poster to poster (Up/Right = forward), and on desktop the dots on
  the right-hand rail glide straight to a poster.
- Tap a poster (or "About this role") for a detail card. Tap the Box Office booth
  (or the Box office button) for Spotlight + IMDb links.
- Phones get a lighter version automatically (fewer lights, no glow) so it runs smoothly.
- If a device can't run 3D at all, a plain page with the reel, credits and links is shown.

EDITING THE POSTER TEXT AND STILLS
The text for each poster card is in assets/app.js, near the top, under HIGHLIGHTS
(the blurb: "..." for each production).
Behind-the-scenes photos: each poster card shows the photos in assets/stills/<poster>/
(01.jpg, 02.jpg ... plus small _t thumbnails). The number per poster is set in STILLS near
the top of assets/app.js. Currently: Driftwood 5, 1917 1, House of the Dragon 11,
Masters of the Air 27, Napoleon 40 + a short clip. To add more, send the photos to Claude.

LOBBY MUSIC
The hallway plays an original smooth-jazz loop composed and synthesised for this site
(no samples or recordings, so there are no licensing issues). It lives in
assets/lobby-music.js, loads only after the ticket is tapped, sounds muffled as you
go through the doors, and stops once you're seated.

SHARE PREVIEW: preview.jpg is the image shown when the link is shared. Once the site
has its own address, change content="preview.jpg" in index.html to the full URL,
e.g. https://benjaminfowler.co.uk/website/preview.jpg

TO PUT IT ONLINE: upload just the ACTING RESUME\website folder to any static host,
e.g. Netlify or GitHub Pages. The reels stream from YouTube, so the big video files
do not need uploading (no HandBrake step needed).

FILES
- index.html: the page
- assets/app.js: the whole 3D scene (hallway, posters, doors, auditorium, countdown, credits)
- assets/images.js: the posters and headshot, embedded
- assets/three.bundle.js: the three.js 3D engine (r160)
- assets/fonts.css: Limelight / Josefin Sans / Cormorant Garamond fonts, embedded
