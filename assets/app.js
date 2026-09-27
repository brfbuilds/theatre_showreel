/* Benjamin Fowler — 3D cinema showreel site
   Scroll walks you down the hallway, through the doors, and into your seat. */
(async () => {
'use strict';
const T = window.THREE;
const IMG = window.IMAGES;
const $ = (s) => document.querySelector(s);

/* ------------------------------------------------------------------ data */
// blurb: the text shown when a visitor taps a poster. Leave '' to show the placeholder.
const BLURB_PLACEHOLDER = 'Placeholder: a few lines about this role will go here — the character, the scenes, and what the production involved.';
// production stills shown in each poster's card: how many photos are in assets/stills/<poster>/
// (01.jpg, 02.jpg ... with _t thumbnails). They load only when that card is opened.
const STILLS = { driftwood: 5, '1917': 1, hotd: 11, mota: 27, napoleon: 40 };
const STILL_VIDEOS = { napoleon: 'assets/stills/napoleon/clip.mp4' }; // optional behind-the-scenes clip per poster
function stillsFor(key) {
  const out = [];
  if (STILL_VIDEOS[key]) out.push({ video: STILL_VIDEOS[key], thumb: STILL_VIDEOS[key].replace(/clip\.mp4$/, 'clip_t.jpg') });
  for (let i = 1; i <= (STILLS[key] || 0); i++) {
    const n = String(i).padStart(2, '0');
    out.push({ full: `assets/stills/${key}/${n}.jpg`, thumb: `assets/stills/${key}/${n}_t.jpg` });
  }
  return out;
}
const HIGHLIGHTS = [
  { key: 'driftwood', year: '2026', title: 'Driftwood', role: 'Chris — Lead Actor', blurb: "The leading role in this emotional short film about grief." },
  { key: 'britains',  year: '2025', title: "Britain's Most Evil Killers", role: 'George Naylor — Lead Actor', blurb: "The leading role of George Naylor in reenactment scenes of this well-established true crime documentary series." },
  { key: 'gladiator', year: '2024', title: 'Gladiator II', role: 'Roman Standard Bearer (SPACT)', blurb: "In a special action role as a Roman standard bearer. This role required a week of special Roman army military boot camp to prepare, training with sword, shield, archery and marching drills." },
  { key: 'hotd',      year: '2023 & 2025', title: 'House of the Dragon', role: 'Seasons 2 & 3 — Darklyn Soldier & Mooton Army (SPACT)', blurb: "In a special action role that began with a month of work on the major battle sequence of Rook's Rest in Season 2, returning for Season 3 in a fiery climactic sequence. This role required boot camp days for Season 2, training with sword, shield, archery, crossbows and battle formations." },
  { key: 'worlds',    year: '2023', title: "World's Most Evil Killers", role: 'Gary — Supporting Actor', blurb: "In the supporting role of Gary, the killer's brother, in this well-established true crime documentary series." },
  { key: 'napoleon',  year: '2022', title: 'Napoleon', role: 'French, British & Prussian Soldier (SPACT)', blurb: "In the SPACT and supporting artist role of French, British and Prussian soldiers throughout a 5-month production. This role required an intensive 2-week boot camp to train in Napoleonic marching drills, musket handling, firing and cleaning, cannon drills and firing, as well as stunt falls and bullet hits." },
  { key: 'mota',      year: '2021', title: 'Masters of the Air', role: 'Prisoner of War (Supporting Artist)', blurb: "In the supporting artist role as a prisoner of war for 4 months of production." },
  { key: '1917',      year: '2019', title: '1917', role: 'British Soldier (SPACT)', blurb: "In the supporting artist and SPACT role of a British soldier in this WWI epic. Benjamin's first role in film, which came with boot camp training in rifle handling, firing and marching drill before months on set." },
];
const FULL_CREDITS = [
  ['2026', 'Driftwood', 'Chris (Lead)'],
  ['2026', 'Ministry of Time', 'Protester'],
  ['2026', 'SNL UK', 'Supporting Artist (Opening Credits)'],
  ['2026', 'Isle of Man', 'Paramedic'],
  ['2026', "Lord's Day", 'Cameraman'],
  ['2026', 'Grace', 'Club Goer'],
  ['2026', 'Sonic 4', 'Eggman Ravegoer'],
  ['2026', 'The Siege', 'Intelligence Officer'],
  ['2025–26', 'Ted Lasso', 'Richmond Fan'],
  ['2025', "Britain's Most Evil Killers", 'George Naylor (Lead)'],
  ['2025', 'The Thomas Crown Affair', 'Event Photographer / Race Attendee'],
  ['2025', 'House of the Dragon S3', 'Mooton Army (SPACT)'],
  ['2024', 'Gladiator II', 'Roman Standard Bearer (SPACT)'],
  ['2024', 'Vigil', 'Eric (Main Cast)'],
  ['2024', 'The Perfect Town', 'Gatecrasher'],
  ['2024', 'The Surface S2', 'Supporting Artist'],
  ['2024', 'Made in Chelsea', 'Supporting Artist'],
  ['2023', 'House of the Dragon S2', 'Darklyn Soldier — Special Action Performer'],
  ['2023', "World's Most Evil Killers", 'Gary (Supporting)'],
  ['2023', 'Beaumont', 'Soldier'],
  ['2023', 'Rivals', 'Supporting Artist'],
  ['2023', 'Ghostbusters: Frozen Empire', 'Coney Island Sprite'],
  ['2023', 'Dublin Down', 'Hotel Guest'],
  ['2023', 'The Amateur', 'Eurostar Passenger'],
  ['2023', 'Surface Season 2', "Gentleman's Club Member"],
  ['2023', 'Big Boys Season 2', 'Fresher Student'],
  ['2023', 'Six Triple Eight', 'WW2 American Soldier'],
  ['2023', 'Sex Education', 'Passerby'],
  ['2022', 'The Buckingham Murders', 'Passerby'],
  ['2022', 'Get Millie Black', 'Builder, JB'],
  ['2022', 'Napoleon', 'French Revolutionary, British & Prussian Soldier'],
  ['2021', 'Masters of the Air', 'Prisoner of War'],
  ['2019', '1917', 'British Soldier'],
];

/* ------------------------------------------------------------ utilities */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const rnd = (() => { let s = 1234567; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

function tex(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h, c);
  const t = new T.CanvasTexture(c);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function spacedText(g, text, x, y, spacing) {
  // letter-spaced centered text (works even where ctx.letterSpacing is unsupported)
  const widths = [...text].map((c) => g.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = x - total / 2; const align = g.textAlign; g.textAlign = 'left';
  [...text].forEach((c, i) => { g.fillText(c, cx, y); cx += widths[i] + spacing; });
  g.textAlign = align;
}
function fitFont(g, text, family, max, width) {
  let s = max; do { g.font = `${s}px ${family}`; s -= 2; } while (g.measureText(text).width > width && s > 10);
}
function noise(g, w, h, amt, alpha) {
  const d = g.getImageData(0, 0, w, h); const p = d.data;
  for (let i = 0; i < p.length; i += 4) { const n = (Math.random() - .5) * amt; p[i] += n; p[i + 1] += n; p[i + 2] += n; if (alpha) p[i + 3] = 255; }
  g.putImageData(d, 0, 0);
}

/* ------------------------------------------------------------- fonts */
try {
  await Promise.race([
    Promise.all(['64px Limelight', '40px "Josefin Sans"', '600 40px "Josefin Sans"', 'italic 40px "Cormorant Garamond"'].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
} catch (e) { /* fall back to system fonts */ }
const F_DECO = 'Limelight, Georgia, serif';
const F_SANS = '"Josefin Sans", Futura, sans-serif';
const F_ITAL = 'italic 500 %spx "Cormorant Garamond", Georgia, serif';
const ital = (s) => F_ITAL.replace('%s', s);

/* ---------------------------------------------------------- renderer */
const canvas = $('#stage');
// phones and tablets get a lighter render: fewer lights, no glow pass, lower resolution
const LITE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700;
let renderer;
if (document.body.classList.contains('simple-chosen')) return; // opened straight into the simple version: skip the 3D entirely
try {
  renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no webgl');
} catch (e) {
  // no 3D available: show the plain page with credits, links and the reel
  document.body.classList.remove('locked'); document.body.classList.add('nowebgl');
  const g = $('#gate'); if (g) g.remove();
  return;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new T.Scene();
scene.background = new T.Color(0x050203);
scene.fog = new T.FogExp2(0x0a0405, 0.011);

const camera = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 200);
const baseFov = () => (innerWidth / innerHeight < 0.8 ? 72 : innerWidth / innerHeight < 1.2 ? 62 : 55);

// environment for polished metal only
const pmrem = new T.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;

// multisampled HDR target so edges stay clean through post-processing (no jaggies / shimmer)
const composer = new T.EffectComposer(renderer, new T.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), { type: T.HalfFloatType, samples: 4 }));
composer.addPass(new T.RenderPass(scene, camera));
// guard: a single NaN/Inf pixel would smear into a cross through the bloom blur
composer.addPass(new T.ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); if(any(isnan(c)) || any(isinf(c))) c=vec4(0.0,0.0,0.0,1.0); gl_FragColor=vec4(min(c.rgb,vec3(12.0)),c.a); }',
}));
const bloom = new T.UnrealBloomPass(new T.Vector2(innerWidth / 2, innerHeight / 2), 0.16, 0.35, 1.0); // glow only on true light sources (bulbs, signs)
composer.addPass(bloom);
composer.addPass(new T.OutputPass());

const cssRenderer = new T.CSS3DRenderer({ element: $('#css3d') });
cssRenderer.setSize(innerWidth, innerHeight);
const cssScene = new T.Scene();

/* ----------------------------------------------------------- textures */
const glowTex = tex(128, 128, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,236,200,1)'); r.addColorStop(0.2, 'rgba(255,200,130,.55)'); r.addColorStop(1, 'rgba(255,160,80,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});
const wallWashTex = tex(128, 256, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, 0, 0, w / 2, 0, h * 0.95);
  r.addColorStop(0, 'rgba(255,214,150,.9)'); r.addColorStop(0.35, 'rgba(255,190,120,.35)'); r.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});

const carpetTex = tex(512, 512, (g, w, h) => {
  g.fillStyle = '#4a0910'; g.fillRect(0, 0, w, h);
  const gold = '#b0823a';
  g.fillStyle = gold; g.fillRect(16, 0, 12, h); g.fillRect(w - 28, 0, 12, h);
  g.fillRect(36, 0, 4, h); g.fillRect(w - 40, 0, 4, h);
  g.fillStyle = '#2c0508'; g.fillRect(0, 0, 16, h); g.fillRect(w - 16, 0, 16, h);
  const cols = 3, rows = 4, x0 = 48, cw = (w - 96) / cols, ch = h / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cx = x0 + cw * (c + 0.5), cy = ch * (r + 0.5);
    g.strokeStyle = gold; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cx, cy - ch / 2 + 6); g.lineTo(cx + cw / 2 - 6, cy); g.lineTo(cx, cy + ch / 2 - 6); g.lineTo(cx - cw / 2 + 6, cy); g.closePath(); g.stroke();
    g.fillStyle = '#6d111b'; g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.fill();
    g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8); g.lineTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22); g.stroke(); }
    g.fillStyle = gold; g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill();
  }
}, { repeat: [1, 10] });

const wallpaperTex = tex(1024, 1024, (g, W2, H2) => {
  g.scale(2, 2); const w = 512, h = 512;
  g.fillStyle = '#3a0c13'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(255,190,120,.05)'; g.fillRect(x + 32, 0, 2, h); }
  g.strokeStyle = 'rgba(196,148,82,.42)'; g.lineWidth = 1.8;
  const fan = (cx, cy, r) => {
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx, cy, r - k * 16, Math.PI, 2 * Math.PI); g.stroke(); }
    for (let a = Math.PI; a <= 2 * Math.PI + 0.01; a += Math.PI / 8) { g.beginPath(); g.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); }
  };
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { fan(x * 256 + 128 + (y ? 128 : 0), y * 256 + 190, 90); fan(x * 256 + (y ? 128 : 0) - 128, y * 256 + 190, 90); }
  g.setTransform(1, 0, 0, 1, 0, 0);
}, { repeat: [34, 2.6] });

const woodTex = tex(512, 256, (g, w, h) => {
  g.fillStyle = '#2a140a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    const y = rnd() * h; g.strokeStyle = rnd() > .5 ? 'rgba(70,36,16,.5)' : 'rgba(10,4,2,.45)'; g.lineWidth = 1 + rnd() * 2;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3); g.stroke();
  }
  // raised panel outline
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 6; g.strokeRect(34, 34, w - 68, h - 68);
  g.strokeStyle = 'rgba(190,130,70,.28)'; g.lineWidth = 2; g.strokeRect(40, 40, w - 80, h - 80);
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
}, { repeat: [34, 1] });

const leatherTex = tex(512, 1024, (g, w, h) => {
  g.fillStyle = '#4a080e'; g.fillRect(0, 0, w, h);
  const s = 64;
  for (let y = -s; y < h + s; y += s) for (let x = -s; x < w + s; x += s) {
    const cx = x + ((y / s) % 2 ? s / 2 : 0), cy = y;
    const r = g.createRadialGradient(cx, cy, 2, cx, cy, s * 0.62);
    r.addColorStop(0, '#8a1c26'); r.addColorStop(0.7, '#5a0c13'); r.addColorStop(1, '#2a0407');
    g.fillStyle = r; g.beginPath(); g.moveTo(cx, cy - s / 2); g.lineTo(cx + s / 2, cy); g.lineTo(cx, cy + s / 2); g.lineTo(cx - s / 2, cy); g.closePath(); g.fill();
  }
  for (let y = 0; y < h + s; y += s / 2) for (let x = 0; x < w + s; x += s / 2) {
    if (((x + y) / (s / 2)) % 2) continue;
    const r = g.createRadialGradient(x - 1, y - 1, 0, x, y, 5); r.addColorStop(0, '#fff1c0'); r.addColorStop(0.5, '#c79a45'); r.addColorStop(1, 'rgba(60,30,5,0)');
    g.fillStyle = r; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
  }
  // nail-head border
  for (let i = 10; i < h; i += 18) for (const x of [12, w - 12]) { g.fillStyle = '#d6ad5c'; g.beginPath(); g.arc(x, i, 4, 0, 7); g.fill(); }
  for (let i = 10; i < w; i += 18) for (const y of [12, h - 12]) { g.fillStyle = '#d6ad5c'; g.beginPath(); g.arc(i, y, 4, 0, 7); g.fill(); }
});

const fabricTex = tex(256, 256, (g, w, h) => {
  // pleated wall fabric for the auditorium
  for (let x = 0; x < w; x++) {
    const v = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 4);
    g.fillStyle = `rgb(${Math.round(40 + v * 45)},${Math.round(6 + v * 8)},${Math.round(10 + v * 10)})`; g.fillRect(x, 0, 1, h);
  }
}, { repeat: [16, 3] });

/* ----------------------------------------------------------- materials */
const M = {
  gold: new T.MeshStandardMaterial({ color: 0xc9a14f, metalness: 1, roughness: 0.34, envMap, envMapIntensity: 0.38 }),
  brass: new T.MeshStandardMaterial({ color: 0xb08a45, metalness: 1, roughness: 0.45, envMap, envMapIntensity: 0.35 }),
  iron: new T.MeshStandardMaterial({ color: 0x1a1512, metalness: 0.6, roughness: 0.6, envMap, envMapIntensity: 0.3 }),
  wood: new T.MeshStandardMaterial({ map: woodTex, roughness: 0.55, metalness: 0 }),
  darkWood: new T.MeshStandardMaterial({ color: 0x1c0d07, roughness: 0.5 }),
  wallpaper: new T.MeshStandardMaterial({ map: wallpaperTex, roughness: 0.85 }),
  carpet: new T.MeshStandardMaterial({ map: carpetTex, roughness: 1 }),
  floor: new T.MeshStandardMaterial({ color: 0x160a06, roughness: 0.35, metalness: 0.1, envMap, envMapIntensity: 0.25 }),
  ceiling: new T.MeshStandardMaterial({ color: 0x150b09, roughness: 0.9 }),
  leather: new T.MeshStandardMaterial({ map: leatherTex, roughness: 0.55 }),
  velvet: LITE ? new T.MeshStandardMaterial({ color: 0x7a0c17, roughness: 0.8 }) : new T.MeshPhysicalMaterial({ color: 0x6d0a14, roughness: 0.85, sheen: 1, sheenColor: new T.Color(0xff5a6a), sheenRoughness: 0.45 }),
  seatVelvet: LITE ? new T.MeshStandardMaterial({ color: 0x6a0c16, roughness: 0.85 }) : new T.MeshPhysicalMaterial({ color: 0x5a0911, roughness: 0.9, sheen: 1, sheenColor: new T.Color(0xd94a58), sheenRoughness: 0.5 }),
  fabric: new T.MeshStandardMaterial({ map: fabricTex, roughness: 0.95 }),
  black: new T.MeshStandardMaterial({ color: 0x050303, roughness: 0.9 }),
  glass: new T.MeshStandardMaterial({ color: 0x0b0606, metalness: 0.2, roughness: 0.05, envMap, envMapIntensity: 0.6 }),
  unlitDark: new T.MeshBasicMaterial({ color: 0x1a120c }),
  bulb: new T.MeshBasicMaterial({ color: new T.Color(4, 3.1, 2.0) }),
  bulbSoft: new T.MeshBasicMaterial({ color: new T.Color(1.5, 1.1, 0.7) }),
};

const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m;
};
const glowSprite = (x, y, z, s, color = 0xffc98a, opacity = 0.9, parent = scene) => {
  const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  sp.position.set(x, y, z); sp.scale.set(s, s, 1); parent.add(sp); return sp;
};

/* ===================================================================
   HALLWAY  (x: -3..3, y: 0..4.2, z: +4 .. -36)
   =================================================================== */
const HALL = { w: 6, h: 4.2, z0: 4, z1: -36 };
const hallLen = HALL.z0 - HALL.z1, hallMidZ = (HALL.z0 + HALL.z1) / 2;
{
  const floor = new T.Mesh(new T.PlaneGeometry(HALL.w, hallLen), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, hallMidZ); scene.add(floor);
  const runner = new T.Mesh(new T.PlaneGeometry(3.8, hallLen), M.carpet);
  runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.005, hallMidZ); scene.add(runner);
  const ceil = new T.Mesh(new T.PlaneGeometry(HALL.w, hallLen), M.ceiling);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HALL.h, hallMidZ); scene.add(ceil);
  // ceiling beams + central gold strip
  for (let z = HALL.z0 - 1; z > HALL.z1; z -= 3.6) {
    box(HALL.w, 0.22, 0.28, M.darkWood, 0, HALL.h - 0.11, z);
    box(HALL.w, 0.03, 0.3, M.iron, 0, HALL.h - 0.235, z);
  }

  for (const side of [-1, 1]) {
    const x = side * HALL.w / 2;
    const rot = -side * Math.PI / 2;
    // wallpaper
    const wp = new T.Mesh(new T.PlaneGeometry(hallLen, HALL.h - 1.05), M.wallpaper);
    wp.rotation.y = rot; wp.position.set(x, 1.05 + (HALL.h - 1.05) / 2, hallMidZ); scene.add(wp);
    // wainscot
    const wn = new T.Mesh(new T.PlaneGeometry(hallLen, 1.05), M.wood);
    wn.rotation.y = rot; wn.position.set(x - side * 0.03, 0.525, hallMidZ); scene.add(wn);
    // chair rail, skirting, crown
    box(0.08, 0.06, hallLen, M.gold, x - side * 0.05, 1.07, hallMidZ);
    box(0.06, 0.16, hallLen, M.darkWood, x - side * 0.05, 0.08, hallMidZ);
    box(0.16, 0.14, hallLen, M.darkWood, x - side * 0.08, HALL.h - 0.07, hallMidZ);
    box(0.05, 0.03, hallLen, M.gold, x - side * 0.17, HALL.h - 0.15, hallMidZ);
  }
}

/* -- hall lights: pendant globes on the ceiling -- */
const hallLights = [];
for (const z of [-2.3, -6.2, -13.4, -20.6, -27.8, -33.6]) {
  const L = new T.PointLight(0xffc27e, 11, 18, 1.2); // gentler falloff = smoother pools
  L.position.set(0, 3.0, z); scene.add(L); hallLights.push(L);
  box(0.02, 0.55, 0.02, M.unlitDark, 0, HALL.h - 0.28, z);
  const globe = new T.Mesh(new T.SphereGeometry(0.16, 24, 16), M.bulbSoft); globe.position.set(0, 3.45, z); scene.add(globe);
  const cap = new T.Mesh(new T.CylinderGeometry(0.06, 0.12, 0.1, 20), M.unlitDark); cap.position.set(0, 3.62, z); scene.add(cap);
}
scene.add(new T.HemisphereLight(0x6a4638, 0x160808, 0.8));

/* -- posters -- */
const posterSlots = [];
const clickables = [];
const images = {};
await Promise.all(Object.keys(IMG).map(async (k) => { images[k] = await loadImg(IMG[k]); }));

function plaqueTexture(p) {
  return tex(1600, 470, (g, w, h) => {
    const lg = g.createLinearGradient(0, 0, w, h);
    lg.addColorStop(0, '#b88c44'); lg.addColorStop(0.4, '#f0d89c'); lg.addColorStop(0.6, '#e2c07a'); lg.addColorStop(1, '#b0843c');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(40,20,4,.85)'; g.lineWidth = 6; g.strokeRect(18, 18, w - 36, h - 36);
    g.strokeStyle = 'rgba(255,240,200,.5)'; g.lineWidth = 1.5; g.strokeRect(22, 22, w - 44, h - 44);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#1a0c02'; g.font = `700 54px ${F_SANS}`; spacedText(g, p.year, w / 2, 88, 18);
    fitFont(g, p.title.toUpperCase(), F_DECO, 124, w - 170); g.fillText(p.title.toUpperCase(), w / 2, 212);
    g.fillStyle = '#2b1505';
    let rs = 80; do { g.font = ital(rs).replace('500', '600'); rs -= 2; } while (g.measureText(p.role).width > w - 180 && rs > 20);
    g.fillText(p.role, w / 2, 350);
    // screws
    for (const x of [52, w - 52]) { g.fillStyle = '#5c3e14'; g.beginPath(); g.arc(x, h / 2, 12, 0, 7); g.fill(); g.strokeStyle = '#2a1606'; g.beginPath(); g.moveTo(x - 6, h / 2); g.lineTo(x + 6, h / 2); g.stroke(); }
  });
}

HIGHLIGHTS.forEach((p, i) => {
  const side = i % 2 === 0 ? -1 : 1; // even -> left wall
  const z = -4.6 - i * 3.6;
  const img = images[p.key];
  const aspect = img ? img.width / img.height : 2 / 3;
  const H = 2.1, W = H * aspect;
  const grp = new T.Group();
  grp.position.set(side * (HALL.w / 2 - 0.02), 0, z);
  grp.rotation.y = -side * Math.PI / 2;
  scene.add(grp);

  const t = new T.Texture(img); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  const cy = 2.28;
  // frame: backing + gilt moulding + inner fillet
  box(W + 0.34, H + 0.34, 0.05, M.black, 0, cy, 0.03, grp);
  const fw = 0.1, fd = 0.1;
  box(W + 0.34, fw, fd, M.gold, 0, cy + H / 2 + 0.17 - fw / 2, 0.07, grp);
  box(W + 0.34, fw, fd, M.gold, 0, cy - H / 2 - 0.17 + fw / 2, 0.07, grp);
  box(fw, H + 0.34, fd, M.gold, -(W / 2 + 0.17 - fw / 2), cy, 0.07, grp);
  box(fw, H + 0.34, fd, M.gold, (W / 2 + 0.17 - fw / 2), cy, 0.07, grp);
  const poster = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: LITE ? new T.Color(0.62, 0.6, 0.56) : new T.Color(0.4, 0.38, 0.35), roughness: 0.95, metalness: 0 }));
  poster.position.set(0, cy, 0.062); grp.add(poster);
  // glass sheen
  const glass = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.03, roughness: 0.3, metalness: 1, envMap, envMapIntensity: 0.8, depthWrite: false }));
  glass.position.set(0, cy, 0.075); grp.add(glass);
  // picture lamp
  box(0.04, 0.04, 0.32, M.brass, 0, cy + H / 2 + 0.36, 0.16, grp);
  const hood = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, Math.max(0.6, W * 0.55), 16, 1, false, 0, Math.PI), M.brass);
  hood.rotation.z = Math.PI / 2; hood.rotation.x = -0.6; hood.position.set(0, cy + H / 2 + 0.36, 0.32); grp.add(hood);
  const tube = box(Math.max(0.56, W * 0.52), 0.02, 0.02, M.bulb, 0, cy + H / 2 + 0.33, 0.33, grp);
  // real picture light: a soft spotlight from the lamp onto the poster and wall
  grp.updateMatrixWorld(true);
  if (!LITE) {
    const lamp = new T.SpotLight(0xffd6a8, 14, 6, 0.6, 1.0, 1.4);
    lamp.position.copy(grp.localToWorld(new T.Vector3(0, cy + H / 2 + 0.3, 0.55)));
    lamp.target.position.copy(grp.localToWorld(new T.Vector3(0, cy - 0.6, 0)));
    scene.add(lamp, lamp.target);
  }
  // plaque: large, flat and self-lit so it reads clearly
  const plTex = plaqueTexture(p);
  const pl = new T.Mesh(new T.BoxGeometry(1.8, 0.53, 0.035), [M.brass, M.brass, M.brass, M.brass,
    new T.MeshStandardMaterial({ map: plTex, emissiveMap: plTex, emissive: new T.Color(0.75, 0.72, 0.66), metalness: 0.3, roughness: 0.5 }), M.brass]);
  pl.position.set(0, 0.74, 0.05); grp.add(pl);
  const slot = { ...p, z, side, W, H, mesh: poster };
  poster.userData.slot = slot; clickables.push(poster);
  posterSlots.push(slot);
});

/* -- sconces between posters -- */
for (const side of [-1, 1]) for (let k = 0; k < 5; k++) {
  // midway between same-side posters (opposite the other wall's poster)
  const pz = (side < 0 ? -1.0 : -4.6) - k * 7.2;
  const x = side * (HALL.w / 2 - 0.06);
  if (pz > 2.5 || pz < -33) continue;
  const s = new T.Group(); s.position.set(x, 2.55, pz); scene.add(s);
  const plate = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.03, 24), M.brass); plate.rotation.z = Math.PI / 2; s.add(plate);
  const arm = box(0.2, 0.025, 0.025, M.brass, -side * 0.1, 0, 0, s);
  const shade = new T.Mesh(new T.ConeGeometry(0.1, 0.18, 18, 1, true), new T.MeshStandardMaterial({ color: 0xf2d9a8, emissive: 0xffb060, emissiveIntensity: 0.9, side: T.DoubleSide, roughness: .8 }));
  shade.position.set(-side * 0.2, 0.08, 0); shade.rotation.x = Math.PI; s.add(shade);
}

/* -- box office booth (opens the contact panel) -- */
{
  const b = new T.Group(); b.position.set(2.4, 0, -1.7); b.rotation.y = -0.95; scene.add(b);
  box(1.3, 1.05, 0.8, M.wood, 0, 0.525, 0, b);
  box(1.36, 0.06, 0.86, M.gold, 0, 1.08, 0, b);
  box(0.1, 1.5, 0.8, M.darkWood, -0.6, 1.85, 0, b);
  box(0.1, 1.5, 0.8, M.darkWood, 0.6, 1.85, 0, b);
  box(1.3, 0.1, 0.8, M.darkWood, 0, 2.6, 0, b);
  const winTex = tex(512, 560, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h / 2, w * 0.8);
    r.addColorStop(0, '#f2cf8c'); r.addColorStop(1, '#8a4a1c'); g.fillStyle = r; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(60,25,5,.7)'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h * 0.34); g.stroke();
    g.fillStyle = '#3a0d13'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 30px ${F_SANS}`; spacedText(g, 'CASTING ENQUIRIES', w / 2, h * 0.44, 8);
    fitFont(g, 'Spotlight · IMDb', F_DECO, 60, w - 60); g.fillText('Spotlight · IMDb', w / 2, h * 0.58);
    g.font = ital(38); g.fillText('tap the window', w / 2, h * 0.74);
  });
  const win = new T.Mesh(new T.PlaneGeometry(1.1, 1.2), new T.MeshBasicMaterial({ map: winTex, color: new T.Color(0.9, 0.86, 0.8) }));
  win.position.set(0, 1.72, 0.3); b.add(win);
  box(1.12, 0.03, 0.25, M.brass, 0, 1.12, 0.45, b);
  const signTex = tex(1024, 256, (g, w, h) => {
    g.fillStyle = '#140406'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8b46a'; g.lineWidth = 8; g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(255,190,110,.8)'; g.shadowBlur = 18;
    fitFont(g, 'BOX OFFICE', F_DECO, 130, w - 120); g.fillText('BOX OFFICE', w / 2, h / 2 + 6);
  });
  const sign = new T.Mesh(new T.PlaneGeometry(1.4, 0.35), new T.MeshBasicMaterial({ map: signTex, color: new T.Color(1.05, 1, 0.95) }));
  sign.position.set(0, 2.85, 0.42); b.add(sign);
  box(1.5, 0.45, 0.06, M.gold, 0, 2.85, 0.37, b);
  const bl = new T.PointLight(0xffc88a, 3, 3.5, 1.6); bl.position.set(0, 1.8, 0.9); b.add(bl);
  b.traverse((o) => { if (o.isMesh) o.userData.boxOffice = true; });
  clickables.push(b);
}

/* -- velvet rope stanchions at the entrance -- */
for (const side of [-1, 1]) {
  const posts = [];
  for (const z of [1.6, -0.4]) {
    const g = new T.Group(); g.position.set(side * 2.0, 0, z); scene.add(g);
    const base = new T.Mesh(new T.CylinderGeometry(0.16, 0.18, 0.04, 24), M.gold); base.position.y = 0.02; g.add(base);
    const pole = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.95, 12), M.gold); pole.position.y = 0.5; g.add(pole);
    const knob = new T.Mesh(new T.SphereGeometry(0.05, 16, 12), M.gold); knob.position.y = 1.0; g.add(knob);
    posts.push(new T.Vector3(side * 2.0, 0.92, z));
  }
  const mid = posts[0].clone().lerp(posts[1], 0.5); mid.y -= 0.22;
  const curve = new T.QuadraticBezierCurve3(posts[0], mid, posts[1]);
  scene.add(new T.Mesh(new T.TubeGeometry(curve, 24, 0.028, 10), M.velvet));
}

/* -- lobby easel with headshot -- */
{
  const card = tex(768, 1152, (g, w, h) => {
    g.fillStyle = '#eee2c3'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a6424'; g.lineWidth = 6; g.strokeRect(26, 26, w - 52, h - 52);
    g.lineWidth = 2; g.strokeRect(40, 40, w - 80, h - 80);
    g.fillStyle = '#5b1219'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 30px ${F_SANS}`; spacedText(g, "TONIGHT'S FEATURE", w / 2, 102, 10);
    const im = images.headshot;
    if (im) {
      const bx = 94, by = 150, bw = w - 188, bh = 690;
      const s = Math.max(bw / im.width, bh / im.height), iw = im.width * s, ih = im.height * s;
      g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
      g.filter = 'sepia(.25) contrast(1.05)'; g.drawImage(im, bx + (bw - iw) / 2, by + (bh - ih) / 2.6, iw, ih); g.restore();
      g.strokeStyle = '#3a0d13'; g.lineWidth = 4; g.strokeRect(bx, by, bw, bh);
    }
    g.fillStyle = '#3a0d13'; fitFont(g, 'BENJAMIN FOWLER', F_DECO, 78, w - 140); g.fillText('BENJAMIN FOWLER', w / 2, 915);
    g.font = `600 30px ${F_SANS}`; g.fillStyle = '#8a6424'; spacedText(g, 'ACTOR', w / 2, 978, 18);
    g.font = ital(40); g.fillStyle = '#5b1219'; g.fillText('This way to Screen One', w / 2, 1052);
  });
  const e = new T.Group(); e.position.set(-1.75, 0, -1.2); e.rotation.y = 0.55; scene.add(e);
  const legMat = M.darkWood;
  const l1 = box(0.05, 2.1, 0.05, legMat, -0.45, 1.02, 0, e); l1.rotation.z = -0.1;
  const l2 = box(0.05, 2.1, 0.05, legMat, 0.45, 1.02, 0, e); l2.rotation.z = 0.1;
  const l3 = box(0.05, 2.1, 0.05, legMat, 0, 1.0, -0.4, e); l3.rotation.x = 0.28;
  box(1.0, 0.05, 0.1, legMat, 0, 0.62, 0.05, e);
  const c = new T.Mesh(new T.PlaneGeometry(0.86, 1.29), new T.MeshStandardMaterial({ map: card, emissiveMap: card, emissive: new T.Color(0.35, 0.32, 0.28), roughness: 0.8 }));
  c.position.set(0, 1.3, 0.07); c.rotation.x = -0.1; e.add(c);
  const Ls = new T.SpotLight(0xffc88a, 10, 5, 0.6, 0.6, 1.4); Ls.position.set(-1.2, 3.5, 0.4); Ls.target = c; scene.add(Ls);
}

/* -- end wall, doors, marquee -- */
const DOOR = { w: 2.6, h: 2.75, z: HALL.z1 };
const doors = [];
{
  const z = DOOR.z + 0.06;
  // wood panelling on the hall side of the end wall
  const wall = (w, h, x, y) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), M.darkWood); m.position.set(x, y, z); scene.add(m); };
  const sideW = (HALL.w - DOOR.w) / 2;
  wall(sideW, HALL.h, -(DOOR.w / 2 + sideW / 2), HALL.h / 2);
  wall(sideW, HALL.h, (DOOR.w / 2 + sideW / 2), HALL.h / 2);
  wall(DOOR.w, HALL.h - DOOR.h, 0, DOOR.h + (HALL.h - DOOR.h) / 2);
  // gilt architrave
  box(0.16, DOOR.h + 0.16, 0.12, M.gold, -DOOR.w / 2 - 0.08, (DOOR.h + 0.16) / 2, z + 0.05);
  box(0.16, DOOR.h + 0.16, 0.12, M.gold, DOOR.w / 2 + 0.08, (DOOR.h + 0.16) / 2, z + 0.05);
  box(DOOR.w + 0.32, 0.16, 0.12, M.gold, 0, DOOR.h + 0.08, z + 0.05);
  // deco sunburst over the door
  for (let k = 0; k <= 12; k++) {
    const a = Math.PI * (k / 12);
    const ray = box(0.03, 0.34, 0.02, M.gold, Math.cos(a) * 0.3, DOOR.h + 0.2 + Math.sin(a) * 0.3, z + 0.03); ray.rotation.z = a - Math.PI / 2;
  }
  // doors (pivot at outer edges)
  const dw = DOOR.w / 2;
  for (const side of [-1, 1]) {
    const pivot = new T.Group(); pivot.position.set(side * dw, 0, DOOR.z); scene.add(pivot);
    const leaf = new T.Group(); leaf.position.x = -side * dw / 2; pivot.add(leaf);
    const slab = new T.Mesh(new T.BoxGeometry(dw - 0.02, DOOR.h - 0.02, 0.08), [M.darkWood, M.darkWood, M.darkWood, M.darkWood, M.leather, M.leather]);
    slab.position.y = DOOR.h / 2; leaf.add(slab);
    for (const f of [1, -1]) {
      const ring = new T.Mesh(new T.TorusGeometry(0.17, 0.028, 12, 40), M.gold); ring.position.set(0, 1.78, f * 0.045); leaf.add(ring);
      const win = new T.Mesh(new T.CircleGeometry(0.17, 32), new T.MeshStandardMaterial({ color: 0x1a0507, emissive: 0x3a0a08, emissiveIntensity: 1, roughness: 0.05, metalness: 0.3, envMap, envMapIntensity: 0.8 }));
      win.position.set(0, 1.78, f * 0.042); if (f < 0) win.rotation.y = Math.PI; leaf.add(win);
      box(dw - 0.1, 0.22, 0.012, M.brass, 0, 0.16, f * 0.046, leaf);
      box(0.12, 0.34, 0.012, M.brass, side * (dw / 2 - 0.14) * -1, 1.12, f * 0.046, leaf);
    }
    doors.push({ pivot, side });
  }
  // dark void behind porthole-less gap, subtle warm light spill at floor
  const spill = new T.Mesh(new T.PlaneGeometry(DOOR.w, 0.6), new T.MeshBasicMaterial({ map: wallWashTex, color: 0xff7a50, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.01, DOOR.z + 0.3); scene.add(spill);
}

// marquee sign
const marqueeBulbs = [];
let bulbMesh;
{
  const sw = 4.9, sh = 1.08, sy = 3.47, sz = DOOR.z + 0.12;
  const signTex = tex(2048, 452, (g, w, h) => {
    const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, '#1b0508'); lg.addColorStop(1, '#0b0203'); g.fillStyle = lg; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8b46a'; g.lineWidth = 8; g.strokeRect(70, 60, w - 140, h - 120);
    g.lineWidth = 2; g.strokeRect(86, 76, w - 172, h - 152);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#d8b46a'; g.font = `600 44px ${F_SANS}`; spacedText(g, 'NOW SHOWING  ·  SCREEN ONE', w / 2, 128, 16);
    g.shadowColor = 'rgba(255,190,110,.9)'; g.shadowBlur = 28; g.fillStyle = '#fff3d6';
    fitFont(g, 'BENJAMIN FOWLER', F_DECO, 176, w - 360); g.fillText('BENJAMIN FOWLER', w / 2, 262);
    g.shadowBlur = 0; g.fillStyle = '#d8b46a'; g.font = `600 36px ${F_SANS}`; spacedText(g, 'THE SHOWREEL', w / 2, 360, 20);
  });
  const sign = new T.Mesh(new T.PlaneGeometry(sw, sh), new T.MeshBasicMaterial({ map: signTex, color: new T.Color(0.95, 0.92, 0.9) }));
  sign.position.set(0, sy, sz + 0.03); scene.add(sign);
  box(sw + 0.26, sh + 0.26, 0.12, M.gold, 0, sy, sz - 0.04);
  // chaser bulbs
  const pts = [];
  const bw = sw + 0.1, bh = sh + 0.1, step = 0.155;
  for (let x = -bw / 2; x <= bw / 2 + 1e-3; x += step) { pts.push([x, bh / 2]); }
  for (let y = bh / 2 - step; y >= -bh / 2 - 1e-3; y -= step) pts.push([bw / 2, y]);
  for (let x = bw / 2 - step; x >= -bw / 2 - 1e-3; x -= step) pts.push([x, -bh / 2]);
  for (let y = -bh / 2 + step; y < bh / 2 - 1e-3; y += step) pts.push([-bw / 2, y]);
  bulbMesh = new T.InstancedMesh(new T.SphereGeometry(0.03, 12, 8), new T.MeshBasicMaterial({ color: new T.Color(2.6, 2.0, 1.2) }), pts.length);
  const mtx = new T.Matrix4();
  pts.forEach(([x, y], i) => { mtx.makeTranslation(x, sy + y, sz + 0.05); bulbMesh.setMatrixAt(i, mtx); bulbMesh.setColorAt(i, new T.Color(1, 1, 1)); });
  scene.add(bulbMesh); marqueeBulbs.length = pts.length;
  const signLight = new T.PointLight(0xffc27a, 3, 6, 1.6); signLight.position.set(0, 2.6, DOOR.z + 1.6); scene.add(signLight);
}

/* ===================================================================
   AUDITORIUM  (x: -10..10, z: -36 .. -68)
   =================================================================== */
const TH = { x: 10, zBack: HALL.z1 - 0.1, zFront: -68, ceil: 10.5 };
const ROWS = 10, ROW_D = 1.9, ROW_RISE = 0.28, ROW_Z0 = -39.6;
const rowY = (r) => -ROW_RISE * (r + 1);
const rowZ = (r) => ROW_Z0 - ROW_D * r - ROW_D / 2; // seat line (centre of platform)
const FRONT_Y = rowY(ROWS - 1) - ROW_RISE;          // floor in front of first row
const SCREEN = { w: 12, h: 6.75, y: 2.2, z: -66.2 };
const STAGE_Y = -1.45, STAGE_Z = -61.4;
const theatre = new T.Group(); scene.add(theatre);
const houseLights = [];
const sconceGlows = [];
{
  const tb = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, theatre);
  // back wall (with doorway) — seen from inside the auditorium
  const zb = TH.zBack - 0.1;
  tb((TH.x * 2 - DOOR.w) / 2, 14, 0.2, M.fabric, -(DOOR.w / 2 + (TH.x - DOOR.w / 2) / 2), 4, zb);
  tb((TH.x * 2 - DOOR.w) / 2, 14, 0.2, M.fabric, (DOOR.w / 2 + (TH.x - DOOR.w / 2) / 2), 4, zb);
  tb(DOOR.w, 14 - DOOR.h - 3, 0.2, M.fabric, 0, DOOR.h + (14 - DOOR.h - 3) / 2, zb);
  // projection booth window
  const booth = new T.Mesh(new T.PlaneGeometry(1.2, 0.6), new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.4, 1.1) }));
  booth.position.set(0, 7.0, zb - 0.11); booth.rotation.y = Math.PI; theatre.add(booth);
  // back landing
  const landing = tb(TH.x * 2, 0.2, ROW_Z0 - zb, M.carpet, 0, -0.1, (ROW_Z0 + zb) / 2);
  // stepped rows
  for (let r = 0; r < ROWS; r++) {
    const z0 = ROW_Z0 - ROW_D * r, y = rowY(r);
    tb(TH.x * 2, 4, ROW_D, M.carpet, 0, y - 2, z0 - ROW_D / 2);
    // nosing with little aisle lights
    tb(TH.x * 2, 0.03, 0.05, M.brass, 0, y + 0.3 - 0.015 + ROW_RISE - 0.3, z0 + 0.02);
    for (const ax of [-7.1, 7.1]) {
      const l = new T.Mesh(new T.BoxGeometry(0.12, 0.04, 0.02), new T.MeshBasicMaterial({ color: new T.Color(3, 1.6, 0.6) }));
      l.position.set(ax, y + ROW_RISE - 0.12, z0 + 0.03); theatre.add(l);
    }
  }
  // front floor + stage
  const fz0 = ROW_Z0 - ROW_D * ROWS;
  tb(TH.x * 2, 4, fz0 - STAGE_Z, M.floor, 0, FRONT_Y - 2, (fz0 + STAGE_Z) / 2);
  tb(TH.x * 2 - 1, STAGE_Y - FRONT_Y + 4, TH.zFront - STAGE_Z, M.darkWood, 0, (STAGE_Y + FRONT_Y - 4) / 2, (STAGE_Z + TH.zFront) / 2);
  tb(TH.x * 2 - 1, 0.08, 0.1, M.gold, 0, STAGE_Y - 0.04, STAGE_Z + 0.05);
  // stage apron face
  const apron = new T.Mesh(new T.PlaneGeometry(TH.x * 2 - 1, STAGE_Y - FRONT_Y), M.velvet);
  apron.position.set(0, (STAGE_Y + FRONT_Y) / 2, STAGE_Z + 0.01); theatre.add(apron);
  // side walls + front wall + ceiling
  for (const s of [-1, 1]) {
    const w = new T.Mesh(new T.PlaneGeometry(TH.zBack - TH.zFront, 16), M.fabric);
    w.rotation.y = -s * Math.PI / 2; w.position.set(s * TH.x, 2.5, (TH.zBack + TH.zFront) / 2); theatre.add(w);
    // pilasters + sconces
    for (let k = 0; k < 6; k++) {
      const z = -40 - k * 4.4;
      tb(0.5, 16, 0.4, M.darkWood, s * (TH.x - 0.2), 2.5, z);
      tb(0.52, 0.12, 0.44, M.gold, s * (TH.x - 0.2), 6.2, z);
      tb(0.52, 0.12, 0.44, M.gold, s * (TH.x - 0.2), -0.2, z);
      const shell = new T.Mesh(new T.SphereGeometry(0.28, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xe8c890, emissive: 0xff9a50, emissiveIntensity: 1.2, side: T.DoubleSide, roughness: .6 }));
      shell.scale.set(1, 1.4, 0.6); shell.position.set(s * (TH.x - 0.45), 3.8, z); shell.rotation.x = Math.PI; theatre.add(shell);
      sconceGlows.push({ shell });
    }
  }
  const ceil = new T.Mesh(new T.PlaneGeometry(TH.x * 2, TH.zBack - TH.zFront), new T.MeshStandardMaterial({ color: 0x0a0a18, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, TH.ceil, (TH.zBack + TH.zFront) / 2); theatre.add(ceil);
  const fw = new T.Mesh(new T.PlaneGeometry(TH.x * 2, 16), M.black); fw.position.set(0, 2.5, TH.zFront); theatre.add(fw);

  // proscenium arch
  const pw = 7.4, ph = 8.0;
  tb(1.2, ph - STAGE_Y + 1, 0.6, M.gold, -pw - 0.6, (ph + STAGE_Y) / 2, STAGE_Z - 0.4);
  tb(1.2, ph - STAGE_Y + 1, 0.6, M.gold, pw + 0.6, (ph + STAGE_Y) / 2, STAGE_Z - 0.4);
  tb(pw * 2 + 2.4, 1.0, 0.6, M.gold, 0, ph + 0.5, STAGE_Z - 0.4);
  tb(pw * 2 + 3.4, 0.2, 0.7, M.gold, 0, ph + 1.1, STAGE_Z - 0.35);
  for (const s of [-1, 1]) tb(TH.x - pw - 1.2, 16, 0.3, M.fabric, s * (pw + 1.2 + (TH.x - pw - 1.2) / 2), 2.5, STAGE_Z - 0.5);
  tb(TH.x * 2, TH.ceil - ph - 1, 0.3, M.fabric, 0, ph + 1 + (TH.ceil - ph - 1) / 2, STAGE_Z - 0.5);
  // deco fan on the arch
  for (let k = 0; k <= 16; k++) {
    const a = Math.PI * (k / 16);
    const ray = tb(0.06, 1.3, 0.05, M.gold, Math.cos(a) * 1.1, ph + 1.25 + Math.sin(a) * 1.1, STAGE_Z - 0.02); ray.rotation.z = a - Math.PI / 2;
  }
  // masking around the screen
  tb(SCREEN.w + 3, SCREEN.h + 3, 0.1, new T.MeshBasicMaterial({ color: 0x020101 }), 0, SCREEN.y, SCREEN.z - 0.08);

  // house lights
  for (const [x, z] of [[-6, -43], [6, -43], [-6, -53], [6, -53]]) {
    const L = new T.PointLight(0xffa870, 22, 16, 1.5); L.position.set(x, 7.5, z); theatre.add(L); houseLights.push(L);
  }
  // star ceiling
  const starGeo = new T.BufferGeometry(); const sp = [];
  for (let i = 0; i < 420; i++) sp.push((rnd() - .5) * TH.x * 2 * 0.95, TH.ceil - 0.05, lerp(TH.zBack - 1, STAGE_Z - 1, rnd()));
  starGeo.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
  const stars = new T.Points(starGeo, new T.PointsMaterial({ color: new T.Color(2.2, 2.0, 1.6), size: 0.05, sizeAttenuation: true, fog: false }));
  theatre.add(stars);
}

/* -- screen (countdown / credits canvas) -- */
const scrCanvas = document.createElement('canvas'); scrCanvas.width = 1280; scrCanvas.height = 720;
const scr = scrCanvas.getContext('2d');
const scrTex = new T.CanvasTexture(scrCanvas); scrTex.colorSpace = T.SRGBColorSpace;
const screenMat = new T.MeshBasicMaterial({ map: scrTex, color: new T.Color(0.18, 0.18, 0.2) });
const screen = new T.Mesh(new T.PlaneGeometry(SCREEN.w, SCREEN.h), screenMat);
screen.position.set(0, SCREEN.y, SCREEN.z); theatre.add(screen);
scr.fillStyle = '#d8d8d8'; scr.fillRect(0, 0, 1280, 720); scrTex.needsUpdate = true;
const screenLight = new T.PointLight(0xcfd8ff, 0, 30, 1.2); screenLight.position.set(0, SCREEN.y, SCREEN.z + 5); theatre.add(screenLight);

/* -- curtains -- */
const curtains = [];
const CURT = { w: 7.7, h: 9.6, z: STAGE_Z - 0.9, top: 8.0, pivot: 7.45 };
{
  const make = (side) => {
    const seg = 160; const geo = new T.PlaneGeometry(CURT.w, CURT.h, seg, 24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const f = Math.sin((x + CURT.w / 2) * 7.5) * 0.11 + Math.sin((x + 3) * 2.3) * 0.05 + (y < -CURT.h / 2 + 0.3 ? 0.03 : 0);
      pos.setZ(i, f);
    }
    geo.translate(-side * CURT.w / 2, 0, 0); // pivot at the outer edge
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, M.velvet);
    const g = new T.Group(); g.position.set(side * CURT.pivot, CURT.top - CURT.h / 2, CURT.z); g.add(m); theatre.add(g);
    return g;
  };
  curtains.push(make(-1), make(1));
  // valance with swags
  const val = new T.Mesh(new T.BoxGeometry(15.2, 1.1, 0.3), M.velvet); val.position.set(0, CURT.top + 0.1, CURT.z + 0.35); theatre.add(val);
  for (let k = 0; k < 7; k++) {
    const swag = new T.Mesh(new T.TorusGeometry(1.05, 0.14, 10, 30, Math.PI), M.velvet);
    swag.rotation.z = Math.PI; swag.scale.set(1, 0.42, 1); swag.position.set(-6.3 + k * 2.1, CURT.top - 0.45, CURT.z + 0.5); theatre.add(swag);
  }
  const fringe = new T.Mesh(new T.BoxGeometry(15.2, 0.08, 0.32), M.gold); fringe.position.set(0, CURT.top - 0.45, CURT.z + 0.36); theatre.add(fringe);
  // footlights / curtain spots
  for (const x of [-4, 4]) {
    const s = new T.SpotLight(0xff8a64, 32, 30, 0.42, 0.8, 1.3); s.position.set(x * 1.4, 7.0, -50); s.target.position.set(x * 0.6, 1.2, CURT.z); theatre.add(s, s.target); houseLights.push(s);
  }
}

/* -- seats (instanced) -- */
{
  const backGeo = new T.RoundedBoxGeometry(0.52, 0.62, 0.1, 3, 0.04);
  const cushGeo = new T.RoundedBoxGeometry(0.5, 0.11, 0.46, 3, 0.04);
  const armGeo = new T.BoxGeometry(0.06, 0.05, 0.46);
  const standGeo = new T.BoxGeometry(0.05, 0.62, 0.4);
  const SEATS_PER = 21, SP = 0.62;
  const n = ROWS * SEATS_PER;
  const backs = new T.InstancedMesh(backGeo, M.seatVelvet, n);
  const cush = new T.InstancedMesh(cushGeo, M.seatVelvet, n);
  const arms = new T.InstancedMesh(armGeo, M.darkWood, ROWS * (SEATS_PER + 1));
  const stands = new T.InstancedMesh(standGeo, M.iron, ROWS * (SEATS_PER + 1));
  const o = new T.Object3D(); let bi = 0, ai = 0;
  const seatPos = (r, x) => { const z = rowZ(r) - 0.012 * x * x; return [x, rowY(r), z]; };
  for (let r = 0; r < ROWS; r++) {
    for (let s = 0; s < SEATS_PER; s++) {
      const x = (s - (SEATS_PER - 1) / 2) * SP; const [px, py, pz] = seatPos(r, x);
      const yaw = Math.atan2(x, pz - SCREEN.z) * 0.6;
      o.position.set(px, py + 0.78, pz + 0.26); o.rotation.set(-0.16, yaw, 0); o.updateMatrix(); backs.setMatrixAt(bi, o.matrix);
      o.position.set(px, py + 0.45, pz); o.rotation.set(0.05, yaw, 0); o.updateMatrix(); cush.setMatrixAt(bi, o.matrix); bi++;
    }
    for (let s = 0; s <= SEATS_PER; s++) {
      const x = (s - SEATS_PER / 2) * SP; const [px, py, pz] = seatPos(r, x);
      const yaw = Math.atan2(x, pz - SCREEN.z) * 0.6;
      o.position.set(px, py + 0.66, pz + 0.02); o.rotation.set(0, yaw, 0); o.updateMatrix(); arms.setMatrixAt(ai, o.matrix);
      o.position.set(px, py + 0.33, pz + 0.06); o.updateMatrix(); stands.setMatrixAt(ai, o.matrix); ai++;
    }
  }
  theatre.add(backs, cush, arms, stands);
}

/* -- projector beam + dust -- */
const BOOTH = new T.Vector3(0, 7.0, TH.zBack - 0.3);
let beam, dust;
{
  const target = new T.Vector3(0, SCREEN.y, SCREEN.z);
  const len = BOOTH.distanceTo(target);
  const geo = new T.CylinderGeometry(0.12, SCREEN.w * 0.69, len, 4, 1, true); // narrow at the booth, wide at the screen
  geo.rotateY(Math.PI / 4); geo.scale(1, 1, SCREEN.h / SCREEN.w);
  geo.translate(0, -len / 2, 0); // apex at origin, opens along -Y
  const mat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vPos; varying float vDepth; void main(){ vUv=uv; vPos=position; vec4 mv=modelViewMatrix*vec4(position,1.0); vDepth=-mv.z; gl_Position=projectionMatrix*mv;} `,
    fragmentShader: `uniform float uTime; uniform float uOpacity; varying vec2 vUv; varying vec3 vPos; varying float vDepth;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){ float along = 1.0 - vUv.y; float smoke = n(vec2(vUv.x*14.0, vUv.y*3.0 - uTime*0.15)) * 0.6 + n(vec2(vUv.x*40.0+uTime*0.2, vUv.y*9.0))*0.4;
        float edge = sin(fract(vUv.x*4.0)*3.14159); edge = pow(edge, 0.6); float near = smoothstep(3.0, 12.0, vDepth);
        float a = (1.0 - along*0.7) * (0.35 + smoke*0.8) * edge * near * uOpacity; gl_FragColor = vec4(vec3(0.85,0.88,1.0)*a*0.07, 1.0); }`,
  });
  beam = new T.Mesh(geo, mat);
  beam.position.copy(BOOTH);
  beam.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), target.clone().sub(BOOTH).normalize());
  theatre.add(beam);
  const dg = new T.BufferGeometry(); const dp = [];
  for (let i = 0; i < 700; i++) {
    const t = rnd(); const p = BOOTH.clone().lerp(target, t);
    p.x += (rnd() - .5) * SCREEN.w * t * 1.1; p.y += (rnd() - .5) * SCREEN.h * t * 1.1; dp.push(p.x, p.y, p.z);
  }
  dg.setAttribute('position', new T.Float32BufferAttribute(dp, 3));
  dust = new T.Points(dg, new T.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
  theatre.add(dust);
}

/* -- video on the screen (CSS3D so it also works when opened from disk) -- */
const fileVideo = $('#reel');
const REELS = (window.REELS && window.REELS.length) ? window.REELS : [{ key: 'showreel', title: 'Showreel', src: '../showreel.mp4' }];
const reelBy = (k) => REELS.find((r) => r.key === k) || REELS[0];

/* YouTube projector: a stand-in with the same few properties the remote uses on a <video>
   (paused, currentTime, duration, muted, volume, ended, play(), pause()), driven by the
   YouTube IFrame API. Used on the live site; if YouTube can't load it hands back to the files. */
function makeYTVideo(onFail) {
  const host = document.createElement('div'); host.className = 'ytwrap';
  const mount = document.createElement('div'); host.appendChild(mount);
  const ended = [];
  let player = null, ready = false, failed = false, id = '', builtId = '', st = -1;
  let paused = true, isEnded = false, muted = false, vol = 1, waiters = [], wantPlay = false;
  const settle = (ok) => { const w = waiters; waiters = []; w.forEach((f) => f(ok)); };
  const fail = () => { if (failed || ready) return; failed = true; onFail(); };
  function build() {
    if (player || failed) return;
    builtId = id;
    player = new window.YT.Player(mount, {
      host: 'https://www.youtube-nocookie.com', videoId: id, width: '1600', height: '900',
      playerVars: { controls: 0, rel: 0, playsinline: 1, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3, cc_load_policy: 0, origin: location.origin },
      events: {
        onReady: () => {
          ready = true; if (muted) player.mute(); else player.unMute(); player.setVolume(Math.round(vol * 100));
          const f = player.getIframe(); f.setAttribute('tabindex', '-1'); f.title = 'Showreel';
          if (id && id !== builtId) player.cueVideoById(id);
        },
        onStateChange: (e) => {
          st = e.data;
          if (st === 1) { paused = false; isEnded = false; wantPlay = false; settle(true); }
          else if (st === 5 && wantPlay) { player.playVideo(); } // a new reel finished loading: start it
          else if (st === 2) { paused = true; }
          else if (st === 0) { paused = true; isEnded = true; ended.forEach((fn) => fn()); }
        },
        onError: () => { settle(false); },
      },
    });
  }
  function loadApi() {
    if (window.YT && window.YT.Player) { build(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); build(); };
    if (!document.querySelector('script[data-ytapi]')) {
      const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.async = true; sc.dataset.ytapi = '1';
      sc.onerror = fail; document.head.appendChild(sc);
    }
    setTimeout(() => { if (!ready) fail(); }, 12000); // blocked or offline: use the video files
  }
  return {
    el: host, style: host.style, preload: 'none', isYT: true,
    getAttribute: (a) => (a === 'src' ? id : null),
    set src(v) { id = v; isEnded = false; paused = true; if (!player) loadApi(); else if (ready) player.cueVideoById(v); },
    get src() { return id; },
    get paused() { return paused; },
    get ended() { return isEnded; },
    get duration() { const d = ready ? player.getDuration() : 0; return d > 0 ? d : NaN; },
    get currentTime() { return ready ? (player.getCurrentTime() || 0) : 0; },
    set currentTime(t) { if (ready) { if (st === 5 || st === -1) { if (t > 0.5) player.seekTo(t, true); return; } player.seekTo(Math.max(0, t), true); isEnded = false; if (paused && !wantPlay && st !== 1) player.pauseVideo(); } },
    get muted() { return muted; },
    set muted(m) { muted = !!m; if (ready) { if (muted) player.mute(); else player.unMute(); } },
    get volume() { return vol; },
    set volume(v) { vol = v; if (ready) player.setVolume(Math.round(v * 100)); },
    play() {
      if (!ready) return Promise.reject(new Error('not ready'));
      paused = false; isEnded = false; wantPlay = true; player.playVideo();
      if (st === 1) return Promise.resolve();
      return new Promise((res, rej) => {
        let done = false;
        const w = (ok) => { if (done) return; done = true; if (ok) res(); else rej(new Error('yt')); };
        waiters.push(w);
        // browsers may refuse to start with sound without a tap: if it hasn't started, say so
        const check = (n) => setTimeout(() => {
          if (done || st === 1) return;
          if (st === 3 && n < 4) { check(n + 1); return; } // still buffering
          if (st === 5 && n < 2) { player.playVideo(); check(n + 1); return; } // reel still cueing
          waiters = waiters.filter((x) => x !== w); paused = true; wantPlay = false; w(false);
        }, 2500);
        check(0);
      });
    },
    pause() { paused = true; wantPlay = false; if (ready) player.pauseVideo(); },
    addEventListener(ev, fn) { if (ev === 'ended') ended.push(fn); },
  };
}

let video = fileVideo;
const reelWrap = document.createElement('div'); reelWrap.className = 'reel';
if (window.USE_YT && REELS.some((r) => r.yt)) {
  video = makeYTVideo(() => {
    // YouTube unavailable: swap the file-based projector back in
    const wasKey = show.reelKey; reelWrap.replaceChild(fileVideo, video.el); video = fileVideo;
    fileVideo.style.display = 'block'; applyReelVol();
    if (wasKey) { show.reelKey = null; setReel(wasKey, 'metadata'); }
  });
  reelWrap.appendChild(video.el);
} else { reelWrap.appendChild(fileVideo); fileVideo.style.display = 'block'; }
function setReel(key, preload = 'metadata') {
  // point the projector at a reel (nothing downloads until this is called)
  const r = reelBy(key);
  const src = video.isYT ? r.yt : r.src;
  if (show.reelKey !== r.key || !video.getAttribute('src')) { video.preload = preload; video.src = src; show.reelKey = r.key; show.reelStarted = false; }
  else if (preload === 'auto') video.preload = 'auto';
}
const reelObj = new T.CSS3DObject(reelWrap);
reelObj.position.set(0, SCREEN.y, SCREEN.z + 0.02);
reelObj.scale.setScalar(SCREEN.w / 1600);
cssScene.add(reelObj);

/* ===================================================================
   AUDIO (tiny synth: leader beeps + projector rattle)
   =================================================================== */
let actx = null, rattleGain = null, master = null, ambGain = null, ambLP = null, soundOn = true;
let musicVol = 0.6; try { const v = localStorage.getItem('bf_music_vol'); if (v !== null) musicVol = clamp(+v, 0, 1); } catch (e) { /* ignore */ }
function loadLobbyMusic() {
  // the loop lives in assets/lobby-music.js (embedded so it also plays when the page is opened from disk);
  // it's fetched only after the ticket is tapped, so it never slows the first load
  const start = () => {
    const M = window.LOBBY_MUSIC; if (!M || !actx) return;
    const bin = atob(M.src.split(',')[1]); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const done = (buf) => {
      const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      src.loopStart = M.loopStart; src.loopEnd = Math.min(M.loopEnd, buf.duration);
      src.connect(ambGain); src.start(0, M.loopStart);
    };
    const pr = actx.decodeAudioData(bytes.buffer, done, () => {}); if (pr && pr.catch) pr.catch(() => {});
  };
  if (window.LOBBY_MUSIC) { start(); return; }
  const sc = document.createElement('script'); sc.src = 'assets/lobby-music.js'; sc.onload = start; document.head.appendChild(sc);
}
function initAudio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 1; master.connect(actx.destination);
    // lobby music: gentle smooth jazz, softened as you move away from the entrance
    ambGain = actx.createGain(); ambGain.gain.value = 0;
    ambLP = actx.createBiquadFilter(); ambLP.type = 'lowpass'; ambLP.frequency.value = 12000;
    ambGain.connect(ambLP).connect(master);
    loadLobbyMusic();
    const len = actx.sampleRate * 2; const buf = actx.createBuffer(1, len, actx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { const ph = (i / actx.sampleRate) * 24 % 1; d[i] = (Math.random() * 2 - 1) * (ph < 0.18 ? 1 : 0.25); }
    const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.8;
    rattleGain = actx.createGain(); rattleGain.gain.value = 0;
    src.connect(bp).connect(rattleGain).connect(master); src.start();
  } catch (e) { actx = null; }
}
function beep(freq = 1000, dur = 0.08, vol = 0.18) {
  if (!actx) return; const o = actx.createOscillator(); const g = actx.createGain();
  o.frequency.value = freq; o.type = 'sine'; g.gain.setValueAtTime(0, actx.currentTime);
  g.gain.linearRampToValueAtTime(vol, actx.currentTime + 0.005); g.gain.linearRampToValueAtTime(0, actx.currentTime + dur);
  o.connect(g).connect(master); o.start(); o.stop(actx.currentTime + dur + 0.02);
}
function creak() {
  // old door hinge: a rough, wavering low tone through a narrow band
  if (!actx) return; const t0 = actx.currentTime;
  const o = actx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(95, t0); o.frequency.linearRampToValueAtTime(150, t0 + 0.7); o.frequency.linearRampToValueAtTime(120, t0 + 1.4);
  const lfo = actx.createOscillator(); lfo.frequency.value = 23; const lg = actx.createGain(); lg.gain.value = 18; lfo.connect(lg).connect(o.frequency);
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 850; bp.Q.value = 4;
  const g = actx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.07, t0 + 0.15);
  g.gain.linearRampToValueAtTime(0.05, t0 + 1.0); g.gain.linearRampToValueAtTime(0, t0 + 1.5);
  o.connect(bp).connect(g).connect(master); o.start(t0); lfo.start(t0); o.stop(t0 + 1.6); lfo.stop(t0 + 1.6);
}
function setAmbience(v, muffle = 0) {
  if (!ambGain) return;
  ambGain.gain.setTargetAtTime(v, actx.currentTime, 0.6);
  ambLP.frequency.setTargetAtTime(12000 - muffle * 10500, actx.currentTime, 0.4); // sounds 'through the wall' as you leave the lobby
}
function setRattle(v, t = 0.6) { if (rattleGain) rattleGain.gain.setTargetAtTime(v, actx.currentTime, t / 3); }

/* ===================================================================
   SCREEN DRAWING — Academy leader countdown + end credits
   =================================================================== */
function drawCountdown(t) {
  // t: seconds since countdown start (0..5)
  const W = 1280, H = 720, g = scr;
  const num = Math.max(1, 5 - Math.floor(t));
  const frac = t % 1;
  const jx = (Math.random() - .5) * 3, jy = (Math.random() - .5) * 3;
  const flick = 0.9 + Math.random() * 0.1;
  g.save(); g.translate(jx, jy);
  const base = Math.round(150 * flick);
  g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(-10, -10, W + 20, H + 20);
  // sweeping wedge
  const cx = W / 2, cy = H / 2, R = 900;
  g.fillStyle = `rgb(${Math.round(base * 0.55)},${Math.round(base * 0.55)},${Math.round(base * 0.55)})`;
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); g.closePath(); g.fill();
  // crosshair + rings
  g.strokeStyle = '#111'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(0, cy); g.lineTo(W, cy); g.moveTo(cx, 0); g.lineTo(cx, H); g.stroke();
  g.strokeStyle = '#f4f4f4'; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, 250, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, 300, 0, Math.PI * 2); g.stroke();
  // number
  // centre the digit by its actual ink, not its font box (fonts sit glyphs off-centre)
  g.fillStyle = '#0c0c0c'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `bold 330px Georgia, "Times New Roman", serif`;
  const digit = String(num), mm = g.measureText(digit);
  const inkW = mm.actualBoundingBoxLeft + mm.actualBoundingBoxRight, inkH = mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
  g.fillText(digit, cx - inkW / 2 + mm.actualBoundingBoxLeft, cy + inkH / 2 - mm.actualBoundingBoxDescent);
  g.restore();
  // scratches, dust, grain
  g.strokeStyle = 'rgba(20,20,20,.5)'; g.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) { const x = Math.random() * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (Math.random() - .5) * 20, H); g.stroke(); }
  g.fillStyle = 'rgba(10,10,10,.6)';
  for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + .5, 0, 7); g.fill(); }
  const vg = g.createRadialGradient(cx, cy, 200, cx, cy, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  scrTex.needsUpdate = true;
  return num;
}
function drawBlack() { scr.fillStyle = '#000'; scr.fillRect(0, 0, 1280, 720); scrTex.needsUpdate = true; }

const CREDIT_LINES = (() => {
  const L = [];
  L.push({ k: 'gap', h: 60 });
  L.push({ k: 'small', t: 'YOU HAVE BEEN WATCHING' });
  L.push({ k: 'big', t: 'BENJAMIN FOWLER' });
  L.push({ k: 'ital', t: 'Actor' });
  L.push({ k: 'gap', h: 80 });
  L.push({ k: 'head', t: 'SELECTED CREDITS' });
  L.push({ k: 'gap', h: 20 });
  for (const [y, t, r] of FULL_CREDITS) L.push({ k: 'row', y, t, r });
  L.push({ k: 'gap', h: 110 });
  L.push({ k: 'head', t: 'CASTING' });
  L.push({ k: 'small', t: 'SPOTLIGHT  6215-7835-8858' });
  L.push({ k: 'small', t: 'IMDB  NM10716244' });
  L.push({ k: 'gap', h: 90 });
  L.push({ k: 'ital', t: 'Thank you for watching' });
  L.push({ k: 'gap', h: 30 });
  L.push({ k: 'small', t: 'THE END' });
  L.push({ k: 'gap', h: 400 });
  return L;
})();
const lineH = (l) => ({ gap: l.h, small: 60, big: 130, ital: 70, head: 110, row: 168 }[l.k]);
const CREDITS_TOTAL = CREDIT_LINES.reduce((a, l) => a + lineH(l), 0);
function drawCredits(pos) {
  // pos = how far the roll has travelled, in canvas pixels
  const W = 1280, H = 720, g = scr;
  g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
  let y = H - pos + 40;
  g.textBaseline = 'middle';
  for (const l of CREDIT_LINES) {
    const lh = lineH(l);
    if (y > -120 && y < H + 120) {
      const c = y + lh / 2;
      if (l.k === 'small') { g.fillStyle = '#b9a47a'; g.font = `600 28px ${F_SANS}`; g.textAlign = 'center'; spacedText(g, l.t, W / 2, c, 9); }
      if (l.k === 'big') { g.fillStyle = '#f1e6cc'; g.font = `100px ${F_DECO}`; g.textAlign = 'center'; g.fillText(l.t, W / 2, c); }
      if (l.k === 'ital') { g.fillStyle = '#d9c9a4'; g.font = ital(50); g.textAlign = 'center'; g.fillText(l.t, W / 2, c); }
      if (l.k === 'head') { g.fillStyle = '#d8b46a'; g.font = `600 34px ${F_SANS}`; g.textAlign = 'center'; spacedText(g, l.t, W / 2, c, 12); }
      if (l.k === 'row') {
        g.textAlign = 'center';
        g.font = `600 24px ${F_SANS}`; g.fillStyle = '#a48b5c'; spacedText(g, l.y, W / 2, c - 54, 10);
        g.fillStyle = '#efe3c6'; fitFont(g, l.t.toUpperCase(), F_DECO, 54, W - 200); g.fillText(l.t.toUpperCase(), W / 2, c);
        g.fillStyle = '#cdbb94'; let rs = 40; do { g.font = ital(rs); rs -= 2; } while (g.measureText(l.r).width > W - 200 && rs > 14);
        g.fillText(l.r, W / 2, c + 52);
      }
    }
    y += lh;
  }
  scrTex.needsUpdate = true;
  return pos > CREDITS_TOTAL;
}

/* ===================================================================
   CAMERA PATH
   =================================================================== */
const SEAT_ROW = 4;
const SEAT = new T.Vector3(0, rowY(SEAT_ROW) + 1.12, rowZ(SEAT_ROW) + 0.08);
const SCREEN_C = new T.Vector3(0, SCREEN.y, SCREEN.z);
const P_WALK_END = 0.66, P_DOOR_A = 0.66, P_DOOR_B = 0.78, P_THEATRE = 0.8;
const WALK_Z0 = 2.6, WALK_Z1 = -31.4, DOOR_STOP_Z = -33.3;
const theatrePath = new T.CatmullRomCurve3([
  new T.Vector3(0, 1.65, DOOR_STOP_Z),
  new T.Vector3(0, 1.7, DOOR.z - 0.4),
  new T.Vector3(0, 2.4, -40.5),
  new T.Vector3(0, 1.5, -44.0),
  new T.Vector3(0, SEAT.y + 0.45, SEAT.z + 1.3),
  SEAT.clone(),
], false, 'centripetal', 0.5);
const lookPath = new T.CatmullRomCurve3([
  new T.Vector3(0, 1.7, DOOR_STOP_Z - 8),
  new T.Vector3(0, 1.4, -48),
  new T.Vector3(0, 2.0, -58),
  new T.Vector3(0, SCREEN.y - 0.2, SCREEN.z),
  SCREEN_C.clone(),
]);

const camPos = new T.Vector3(), camLook = new T.Vector3();
// Hallway timeline: walk to each poster, turn to face it square-on, linger, then move on.
const HALL_KEYS = (() => {
  const K = [{ z: WALK_Z0, yaw: 0, w: 0 }];
  posterSlots.forEach((s) => {
    const yaw = -s.side * Math.PI / 2; // left wall => turn left (+90deg)
    K.push({ z: s.z, yaw, w: 1.0, slot: s });  // walk + turn to face
    K.push({ z: s.z, yaw, w: 0.7, slot: s });  // linger in front of it
  });
  K.push({ z: WALK_Z1, yaw: 0, w: 1.1 });
  let acc = 0; K.forEach((k) => { acc += k.w; k.u = acc; }); K.forEach((k) => { k.u /= acc; });
  return K;
})();
const hallFocus = { slot: null, weight: 0 };
const hallState = { z: WALK_Z0, yaw: 0, f: 0 };
function hallAt(u) {
  let i = 1; while (i < HALL_KEYS.length - 1 && u > HALL_KEYS[i].u) i++;
  const a = HALL_KEYS[i - 1], b = HALL_KEYS[i];
  const t = clamp((u - a.u) / Math.max(1e-6, b.u - a.u), 0, 1);
  const e = t * t * (3 - 2 * t);
  return { z: lerp(a.z, b.z, e), yaw: lerp(a.yaw, b.yaw, e), a, b };
}
function cameraAt(p, out, look) {
  if (p <= P_WALK_END) {
    const h = hallAt(p / P_WALK_END);
    const sy = Math.sin(h.yaw), f = Math.abs(sy);
    const bob = Math.sin(h.z * 2.4) * 0.015 * (1 - f);
    // step back from the wall you're facing so the whole poster + plaque fits
    out.set(sy * 0.2, 1.65 + 0.22 * f + bob, h.z);
    look.set(out.x - sy * 3, out.y + 0.08 * f, out.z - Math.cos(h.yaw) * 3);
    const cands = [h.a.slot, h.b.slot].filter(Boolean).sort((x, y) => Math.abs(x.z - h.z) - Math.abs(y.z - h.z));
    hallFocus.slot = cands[0] || null; hallFocus.weight = f;
    hallState.z = h.z; hallState.yaw = h.yaw; hallState.f = f;
  } else if (p <= P_DOOR_B) {
    // approach the doors
    const z = lerp(WALK_Z1, DOOR_STOP_Z, smooth(P_DOOR_A, P_DOOR_B, p));
    out.set(0, 1.65, z);
    look.set(0, 1.65 + smooth(P_WALK_END, P_DOOR_B, p) * 0.35, z - 8);
    hallFocus.weight = 0;
  } else {
    hallFocus.weight = 0;
    const t = smooth(P_DOOR_B, 1, p);
    const tt = clamp((p - P_DOOR_B) / (1 - P_DOOR_B), 0, 1);
    const e = 1 - Math.pow(1 - tt, 2.2);
    theatrePath.getPointAt(clamp(lerp(tt, e, 0.6), 0, 1), out);
    lookPath.getPointAt(clamp(t, 0, 1), look);
  }
}

/* ===================================================================
   UI + STATE
   =================================================================== */
const ui = {
  hint: $('#hint'), caption: $('#caption'), rail: $('#rail .dot'), controls: $('#remote'), skip: $('#skip'), brand: $('#brand'),
  cy: $('#caption .y'), ct: $('#caption .t'), cr: $('#caption .ro'),
};
let targetP = 0, p = 0, entered = false, lastCaption = null;
/* The walk is driven directly by the wheel / touch (the page itself doesn't scroll).
   Inverted on purpose: wheel UP moves you forward; on phones, swipe DOWN moves you forward. */
const WALK_SCREENS = 25;
// the hallway keeps its unhurried pace; from the last poster to the doors and down to your seat moves 3x faster
const DOORS_SPEED = 3;
const zoneSpeed = (v) => lerp(1, DOORS_SPEED, smooth(P_WALK_END - 0.02, P_WALK_END + 0.01, v));            // how many screen-heights of input the whole journey takes (bigger = slower walk)
let walkVel = 0;                    // touch momentum, in progress-per-second
// input aimed at a panel, slider or on-screen control must not also move you through the building
const inPanel = (e) => !!(e.target && e.target.closest && e.target.closest('.panel, #lightbox, #remote, #musicVol, #choose, input, button'));
addEventListener('wheel', (e) => {
  if (!entered || panelOpen || inPanel(e)) return;
  e.preventDefault();
  const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
  targetP = clamp(targetP - (px / (WALK_SCREENS * innerHeight)) * zoneSpeed(targetP), 0, 1); // wheel up (negative deltaY) = forward
  walkVel = 0;
}, { passive: false });
let touchY = null, touchT = 0;
addEventListener('touchstart', (e) => {
  if (!entered || panelOpen || inPanel(e) || e.touches.length !== 1) { touchY = null; return; }
  touchY = e.touches[0].clientY; touchT = performance.now(); walkVel = 0;
}, { passive: true });
addEventListener('touchmove', (e) => {
  if (touchY === null || inPanel(e)) return;
  e.preventDefault();
  const y = e.touches[0].clientY, now = performance.now();
  const dp = ((y - touchY) / (WALK_SCREENS * 0.75 * innerHeight)) * zoneSpeed(targetP); // swipe down (finger moves down) = forward
  targetP = clamp(targetP + dp, 0, 1);
  const dts = Math.max(1, now - touchT) / 1000; walkVel = lerp(walkVel, dp / dts, 0.5);
  touchY = y; touchT = now;
}, { passive: false });
addEventListener('touchend', () => { if (performance.now() - touchT > 120) walkVel = 0; touchY = null; }, { passive: true });

// show states: idle | intro | countdown | reel | credits | done
const show = { state: 'idle', t: 0, lights: 1, curtain: 0, beamOn: 0, lastNum: 0, reelStarted: false };
const CREDIT_SPEED = 66, CREDIT_FAST = 4; // px per second, and the fast-forward multiplier
function setState(s) { show.state = s; show.t = 0; if (s === 'credits') { show.cpos = 0; setCreditsFast(false); } }
function setCreditsFast(on) {
  show.cfast = on; const b = $('#ffBtn'); if (!b) return;
  b.textContent = on ? 'Normal speed' : 'Speed up ▸▸'; b.setAttribute('aria-pressed', String(on));
}

function enterCinema() {
  initAudio();
  if (actx && actx.state === 'suspended') actx.resume();
  // unlock the video element for sound-on playback later (only a tiny first chunk loads here)
  video.muted = false; setReel(show.reelKey || REELS[0].key, 'metadata');
  const pr = video.play(); if (pr && pr.then) pr.then(() => { video.pause(); video.currentTime = 0; }).catch(() => {});
  $('#gate').classList.add('gone'); document.body.classList.remove('locked'); entered = true;
  setTimeout(() => { ui.hint.style.opacity = 1; }, 900);
  window.scrollTo(0, 0);
}
$('#enter').addEventListener('click', enterCinema);
// for busy visitors: same ticket, but fade straight to your seat for the reels
$('#enterReel').addEventListener('click', () => { enterCinema(); jumpTo(1); });
$('#boSimple').addEventListener('click', () => { closePanel(); window.setSimple(true); });
addEventListener('bf-simple', () => {
  if (!video.paused) video.pause(); setAmbience(0); if (lb.open) closeLightbox();
  document.querySelectorAll('.panel.open').forEach((el) => el.classList.remove('open')); panelOpen = null;
});
// jump buttons (rail dots, arrow keys, skip, back to lobby) glide the walk to a set point
function scrollToP(v) { targetP = clamp(v, 0, 1); walkVel = 0; }
// big jumps (lobby <-> theatre) fade to black and back instead of racing through the building
let jumping = false, snapFov = false;
function jumpTo(v) {
  v = clamp(v, 0, 1);
  if (jumping) return;
  if (Math.abs(v - p) < 0.12) { scrollToP(v); return; } // short hops still glide
  jumping = true; walkVel = 0;
  const fade = $('#fade'); fade.classList.add('on');
  setTimeout(() => {
    targetP = v; p = v; update.prevP = v; snapFov = true; // arrive instantly (and skip the door creak)
    setTimeout(() => { fade.classList.remove('on'); jumping = false; }, 180);
  }, 650);
}
$('#skipBtn').addEventListener('click', () => jumpTo(1));

// ---- panels (box office + poster details)
let panelOpen = null, lastFocus = null;
function openPanel(el) {
  if (panelOpen) closePanel();
  lastFocus = document.activeElement; panelOpen = el; el.classList.add('open');
  const x = el.querySelector('[data-close]'); if (x) setTimeout(() => x.focus(), 50);
}
function closePanel() {
  if (!panelOpen) return; panelOpen.classList.remove('open'); panelOpen = null;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll('.panel').forEach((el) => {
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-close]')) closePanel(); });
});
function openDetail(slot) {
  $('#dImg').src = IMG[slot.key]; $('#dImg').alt = `${slot.title} poster`;
  $('#dYear').textContent = slot.year; $('#dTitle').textContent = slot.title; $('#dRole').textContent = slot.role;
  const t = $('#dText'); t.textContent = slot.blurb || BLURB_PLACEHOLDER; t.classList.toggle('placeholder', !slot.blurb);
  const stills = stillsFor(slot.key);
  const strip = $('#dStills'); strip.innerHTML = ''; strip.hidden = !stills.length;
  $('#detail .card').classList.toggle('has-stills', stills.length > 0);
  if (stills.length) {
    const nv = stills.filter((x) => x.video).length, np = stills.length - nv;
    const lab = document.createElement('div'); lab.className = 'stills-label';
    lab.textContent = `Behind the scenes · ${np} photo${np === 1 ? '' : 's'}${nv ? ` + ${nv} clip` : ''}`; strip.appendChild(lab);
    const row = document.createElement('div'); row.className = 'stills-row'; strip.appendChild(row);
    stills.forEach((k, i) => {
      const b = document.createElement('button'); b.className = 'still' + (k.video ? ' is-video' : '');
      b.setAttribute('aria-label', k.video ? 'Play behind-the-scenes clip' : `View photo ${i + 1} of ${stills.length}`);
      const im = document.createElement('img'); im.src = k.thumb; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; b.appendChild(im);
      b.addEventListener('click', () => openLightbox(stills, i, slot.title)); row.appendChild(b);
    });
  }
  openPanel($('#detail'));
}
// full-size still viewer
const lb = { list: [], i: 0, open: false, title: '' };
function showStill() {
  const it = lb.list[lb.i], img = $('#lbImg'), vid = $('#lbVid');
  if (it.video) { img.hidden = true; vid.hidden = false; if (vid.getAttribute('src') !== it.video) vid.src = it.video; vid.play().catch(() => {}); }
  else { vid.pause(); vid.hidden = true; img.hidden = false; img.src = it.full; img.alt = `${lb.title}, photo ${lb.i + 1}`; }
  $('#lbCount').textContent = `${lb.title} · ${lb.i + 1} / ${lb.list.length}`;
  // warm up the next photo so paging feels instant
  const nx = lb.list[(lb.i + 1) % lb.list.length]; if (nx && nx.full) { const pre = new Image(); pre.src = nx.full; }
}
function openLightbox(list, i, title) { lb.list = list; lb.i = i; lb.title = title; lb.open = true; showStill(); $('#lightbox').classList.add('open'); setTimeout(() => $('#lbClose').focus(), 50); }
function closeLightbox() { lb.open = false; $('#lbVid').pause(); $('#lightbox').classList.remove('open'); }
function stepStill(d) { lb.i = (lb.i + d + lb.list.length) % lb.list.length; showStill(); }
$('#lbClose').addEventListener('click', closeLightbox);
$('#lbPrev').addEventListener('click', () => stepStill(-1));
$('#lbNext').addEventListener('click', () => stepStill(1));
$('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
let lbTouchX = null;
$('#lightbox').addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
$('#lightbox').addEventListener('touchend', (e) => { if (lbTouchX === null) return; const dx = e.changedTouches[0].clientX - lbTouchX; if (Math.abs(dx) > 40) stepStill(dx < 0 ? 1 : -1); lbTouchX = null; }, { passive: true });
// lobby music volume slider (remembered on this device)
$('#musicSlider').value = Math.round(musicVol * 100);
$('#musicSlider').addEventListener('input', (e) => {
  musicVol = e.target.value / 100;
  try { localStorage.setItem('bf_music_vol', String(musicVol)); } catch (err) { /* ignore */ }
});
$('#boxBtn').addEventListener('click', () => openPanel($('#boxoffice')));
$('#boxBtn2').addEventListener('click', () => openPanel($('#boxoffice')));
$('#boReel').addEventListener('click', () => { closePanel(); jumpTo(1); });
$('#moreBtn').addEventListener('click', () => { if (hallFocus.slot) openDetail(hallFocus.slot); });

// ---- sound toggle
$('#soundBtn').addEventListener('click', () => {
  soundOn = !soundOn;
  if (master) master.gain.setTargetAtTime(soundOn ? 1 : 0, actx.currentTime, 0.05);
  video.muted = !soundOn; $('#muteBtn').textContent = video.muted ? 'Unmute' : 'Mute';
  $('#soundBtn').textContent = soundOn ? 'Sound on' : 'Sound off'; $('#soundBtn').setAttribute('aria-pressed', String(soundOn));
});
$('#lobbyBtn').addEventListener('click', () => jumpTo(0));
function backToReel() { if (show.state !== 'reel') { setState('reel'); show.reelStarted = true; reelWrap.classList.add('on'); } }
function togglePlay() {
  if (show.state === 'credits' || show.state === 'done') { backToReel(); video.play().catch(() => {}); return; }
  if (show.state !== 'reel') return;
  if (video.paused) video.play().catch(() => {}); else video.pause();
}
function seekTo(t) {
  if (!isFinite(video.duration)) return;
  video.currentTime = clamp(t, 0, Math.max(0, video.duration - 0.25));
  if (show.state !== 'reel') { backToReel(); video.play().catch(() => {}); }
}
function switchReel(key) {
  // change channel: a flash of static, then the other reel from the start
  if (show.reelKey === key && show.state === 'reel') return;
  reelWrap.classList.add('static'); setTimeout(() => reelWrap.classList.remove('static'), 450);
  setReel(key, 'auto'); video.currentTime = 0; backToReel(); show.reelStarted = true;
  video.play().catch(() => {});
}
$('#playBtn').addEventListener('click', togglePlay);
// reel volume (remembered on this device). iPhones don't let web pages set video volume,
// so there the slider is hidden and the phone's own volume buttons do the job.
let reelVol = 1; try { const v = localStorage.getItem('bf_reel_vol'); if (v !== null) reelVol = clamp(+v, 0, 1); } catch (e) { /* ignore */ }
const volSupported = (() => { try { const t = document.createElement('video'); t.volume = 0.5; return Math.abs(t.volume - 0.5) < 0.01; } catch (e) { return false; } })();
if (!volSupported) $('#rmVolRow').hidden = true;
function applyReelVol() {
  video.volume = reelVol; $('#rmVol').value = Math.round(reelVol * 100); $('#rmVolNum').textContent = Math.round(reelVol * 100);
}
applyReelVol();
$('#rmVol').addEventListener('input', (e) => {
  reelVol = e.target.value / 100; applyReelVol();
  if (reelVol > 0 && video.muted) { video.muted = false; $('#muteBtn').textContent = 'Mute'; }
  try { localStorage.setItem('bf_reel_vol', String(reelVol)); } catch (err) { /* ignore */ }
});
$('#rmBack').addEventListener('click', () => seekTo(video.currentTime - 10));
$('#rmFwd').addEventListener('click', () => seekTo(video.currentTime + 10));
document.querySelectorAll('#remote [data-reel]').forEach((b) => b.addEventListener('click', () => switchReel(b.dataset.reel)));
let seeking = false;
$('#rmSeek').addEventListener('input', (e) => { seeking = true; if (isFinite(video.duration)) seekTo((e.target.value / 1000) * video.duration); });
$('#rmSeek').addEventListener('change', () => { seeking = false; });
$('#rmMin').addEventListener('click', () => {
  const r = $('#remote'); const mini = r.classList.toggle('mini');
  $('#rmMin').textContent = mini ? '+' : '–'; $('#rmMin').setAttribute('aria-expanded', String(!mini)); $('#rmMin').setAttribute('aria-label', mini ? 'Open remote' : 'Minimise remote');
});
// the remote dims when you're just watching, and wakes when you move or touch
let remoteIdleAt = 0;
['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, () => { remoteIdleAt = performance.now() + 3000; }, { passive: true }));
const fmt = (t) => { if (!isFinite(t)) return '0:00'; t = Math.max(0, Math.floor(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
function updateRemote() {
  const r = $('#remote');
  r.classList.toggle('idle', performance.now() > remoteIdleAt && show.state === 'reel' && !video.paused);
  $('#rmTitle').textContent = show.state === 'credits' || show.state === 'done' ? 'Credits' : reelBy(show.reelKey).title;
  $('#rmTime').textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
  if (!seeking && isFinite(video.duration) && video.duration > 0) $('#rmSeek').value = Math.round((video.currentTime / video.duration) * 1000);
  const playing = show.state === 'reel' && !video.paused;
  const pb = $('#playBtn'); const want = playing ? '❚❚' : '▶';
  if (pb.textContent !== want) { pb.textContent = want; pb.setAttribute('aria-label', playing ? 'Pause' : 'Play'); }
  document.querySelectorAll('#remote .chan').forEach((b) => b.classList.toggle('active', b.dataset.reel === show.reelKey));
}
$('#muteBtn').addEventListener('click', () => { video.muted = !video.muted; $('#muteBtn').textContent = video.muted ? 'Unmute' : 'Mute'; if (!video.muted && !soundOn) $('#soundBtn').click(); });
$('#creditsBtn').addEventListener('click', () => {
  if (show.state === 'credits' || show.state === 'done') { // replay
    video.currentTime = 0; backToReel(); video.play().catch(() => {}); $('#creditsBtn').textContent = 'Credits'; return;
  }
  video.pause(); reelWrap.classList.remove('on'); setState('credits');
});
const onReelEnded = () => { reelWrap.classList.remove('on'); setState('credits'); };
fileVideo.addEventListener('ended', onReelEnded); if (video.isYT) video.addEventListener('ended', onReelEnded);
$('#ffBtn').addEventListener('click', () => setCreditsFast(!show.cfast));
document.querySelectorAll('#choose [data-reel]').forEach((b) => b.addEventListener('click', () => {
  if (show.state !== 'choose') return;
  setReel(b.dataset.reel, 'auto');
  // this tap also counts as permission to play with sound
  const pr = video.play(); if (pr && pr.then) pr.then(() => { if (show.state !== 'reel') video.pause(); }).catch(() => {});
  show.picked = true; setState('intro');
}));
let seenCountdown = false; try { seenCountdown = localStorage.getItem('bf_seen_countdown') === '1'; } catch (e) { /* private mode */ }
$('#skipCdBtn').addEventListener('click', () => { if (show.state === 'countdown') show.t = 5.5; });

/* (film grain overlay removed for a clean, smooth image) */

// mouse parallax
const mouse = new T.Vector2(), mouseS = new T.Vector2();
addEventListener('pointermove', (e) => { mouse.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1); });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth / 2, innerHeight / 2); cssRenderer.setSize(innerWidth, innerHeight);
});


/* ===================================================================
   THE USHER — a small floating theatre usher who leads the way
   =================================================================== */
const usher = new T.Group(); usher.visible = false; scene.add(usher);
const U = {};
{
  const m = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.55, ...o });
  const jacket = m(0x8e1422, { roughness: 0.6 }), gold = M.gold, white = m(0xf6f1e6, { roughness: 0.7 });
  const skin = m(0xf0c6a0, { roughness: 0.65 }), dark = m(0x1a0f0c, { roughness: 0.4 }), hair = m(0x3b2518, { roughness: 0.8 });
  const body = new T.Group(); usher.add(body); U.body = body;
  // jacket: a lathe profile — shoulders, waist, flared hem, then a soft rounded (egg-shaped) bottom
  const bottom = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (i / 12) * (Math.PI / 2); bottom.push([Math.max(0.001, 0.185 * Math.cos(a)), -0.1 + 0.26 * Math.sin(a)]); }
  const prof = [...bottom, [0.16, 0.05], [0.15, 0.2], [0.17, 0.3], [0.12, 0.36], [0.05, 0.38], [0.001, 0.385]]
    .map(([x, y]) => new T.Vector2(x, y));
  const torso = new T.Mesh(new T.LatheGeometry(prof, 40), jacket); body.add(torso);
  // gold hem band + belt
  const hem = new T.Mesh(new T.TorusGeometry(0.183, 0.012, 10, 40), gold); hem.rotation.x = Math.PI / 2; hem.position.y = -0.1; body.add(hem);
  const hem2 = new T.Mesh(new T.TorusGeometry(0.152, 0.009, 10, 40), gold); hem2.rotation.x = Math.PI / 2; hem2.position.y = -0.245; body.add(hem2);
  // buttons (two rows) and lapel trim
  for (let i = 0; i < 4; i++) for (const sx of [-0.045, 0.045]) {
    const b = new T.Mesh(new T.SphereGeometry(0.012, 12, 8), gold); b.position.set(sx, 0.22 - i * 0.075, 0.158 - i * 0.004 + (i === 3 ? 0.01 : 0)); body.add(b);
  }
  const collar = new T.Mesh(new T.CylinderGeometry(0.075, 0.1, 0.05, 24), white); collar.position.y = 0.39; body.add(collar);
  const bow1 = new T.Mesh(new T.ConeGeometry(0.03, 0.05, 12), dark); bow1.rotation.z = Math.PI / 2; bow1.position.set(0.025, 0.37, 0.09); body.add(bow1);
  const bow2 = bow1.clone(); bow2.rotation.z = -Math.PI / 2; bow2.position.x = -0.025; body.add(bow2);
  for (const sx of [-1, 1]) { const ep = new T.Mesh(new T.BoxGeometry(0.09, 0.02, 0.07), gold); ep.position.set(sx * 0.15, 0.335, 0); ep.rotation.z = sx * -0.35; body.add(ep); }
  // head
  const head = new T.Group(); head.position.y = 0.53; body.add(head); U.head = head;
  head.add(new T.Mesh(new T.SphereGeometry(0.13, 32, 24), skin));
  const hairM = new T.Mesh(new T.SphereGeometry(0.135, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); hairM.rotation.x = -0.35; hairM.position.z = -0.012; head.add(hairM);
  U.eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new T.Mesh(new T.SphereGeometry(0.017, 16, 12), dark); eye.position.set(sx * 0.045, 0.015, 0.118); head.add(eye); U.eyes.push(eye);
    const glint = new T.Mesh(new T.SphereGeometry(0.005, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); glint.position.set(sx * 0.045 + 0.006, 0.022, 0.133); head.add(glint); U.eyes.push(glint);
    // happy eyes: a soft lower lid pushes up under each eye, giving a smiling crescent
    const lid = new T.Mesh(new T.SphereGeometry(0.021, 20, 14), skin); lid.scale.set(1.3, 1, 0.72); lid.position.set(sx * 0.045, -0.008, 0.121); head.add(lid);
    // raised, arched brows
    const brow = new T.Mesh(new T.TorusGeometry(0.019, 0.0045, 8, 16, Math.PI), hair); brow.position.set(sx * 0.046, 0.046, 0.121); brow.rotation.z = sx * 0.12; head.add(brow);
    // rosier cheeks sitting high, as if he's beaming
    const cheek = new T.Mesh(new T.SphereGeometry(0.024, 14, 10), m(0xef8f7c, { roughness: 0.8 })); cheek.scale.set(1.1, 0.7, 0.45); cheek.position.set(sx * 0.074, -0.018, 0.104); head.add(cheek);
    const ear = new T.Mesh(new T.SphereGeometry(0.025, 12, 8), skin); ear.scale.set(0.5, 1, 0.8); ear.position.set(sx * 0.13, 0, 0); head.add(ear);
  }
  const nose = new T.Mesh(new T.SphereGeometry(0.018, 12, 8), skin); nose.position.set(0, -0.005, 0.13); head.add(nose);
  // curly handlebar moustache: each side sweeps out from under the nose and curls up into a little spiral
  const stache = new T.Group(); stache.position.set(0, -0.026, 0); head.add(stache); U.stache = stache;
  const stacheMat = m(0x2e1b10, { roughness: 0.55, side: T.DoubleSide });
  const halfCurve = () => {
    const pts = [new T.Vector3(0.0, -0.002, 0.136), new T.Vector3(0.024, -0.009, 0.132), new T.Vector3(0.048, -0.01, 0.122)];
    const c = new T.Vector3(0.066, 0.006, 0.112);
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, a = -Math.PI * 0.75 + t * Math.PI * 1.75, r = 0.023 * (1 - 0.6 * t);
      pts.push(new T.Vector3(c.x + r * Math.cos(a), c.y + r * Math.sin(a), c.z - t * 0.006));
    }
    return new T.CatmullRomCurve3(pts);
  };
  const tubular = 64, radial = 10;
  const sGeo = new T.TubeGeometry(halfCurve(), tubular, 0.011, radial, false);
  { // taper: thick in the middle of the lip, fine at the curled tip
    const pos = sGeo.attributes.position, path = halfCurve(), cp = new T.Vector3();
    for (let i = 0; i <= tubular; i++) {
      const u = i / tubular; path.getPointAt(u, cp); const k = lerp(1, 0.28, Math.pow(u, 0.8));
      for (let j = 0; j <= radial; j++) {
        const idx = i * (radial + 1) + j;
        pos.setXYZ(idx, cp.x + (pos.getX(idx) - cp.x) * k, cp.y + (pos.getY(idx) - cp.y) * k, cp.z + (pos.getZ(idx) - cp.z) * k);
      }
    }
    sGeo.computeVertexNormals();
  }
  for (const sx of [1, -1]) { const half = new T.Mesh(sGeo, stacheMat); half.scale.x = sx; stache.add(half); }
  const knot = new T.Mesh(new T.SphereGeometry(0.014, 16, 12), stacheMat); knot.scale.set(1.3, 0.8, 0.7); knot.position.set(0, -0.003, 0.134); stache.add(knot);
  // pillbox hat with gold band, tilted jauntily
  const hat = new T.Group(); hat.position.set(0.02, 0.11, 0.0); hat.rotation.set(-0.12, 0, -0.18); head.add(hat); U.hat = hat;
  hat.add(new T.Mesh(new T.CylinderGeometry(0.075, 0.08, 0.075, 28), jacket));
  const band = new T.Mesh(new T.CylinderGeometry(0.081, 0.081, 0.02, 28), gold); band.position.y = -0.02; hat.add(band);
  const top = new T.Mesh(new T.SphereGeometry(0.014, 12, 8), gold); top.position.y = 0.045; hat.add(top);
  // arms: shoulder pivots so they can point / wave
  const arm = (sx) => {
    const sh = new T.Group(); sh.position.set(sx * 0.19, 0.28, 0); body.add(sh);
    const sleeve = new T.Mesh(new T.CapsuleGeometry(0.035, 0.2, 6, 12), jacket); sleeve.position.y = -0.13; sh.add(sleeve);
    const cuff = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.025, 16), gold); cuff.position.y = -0.245; sh.add(cuff);
    const glove = new T.Mesh(new T.SphereGeometry(0.045, 16, 12), white); glove.position.y = -0.29; sh.add(glove);
    return sh;
  };
  U.armR = arm(1); U.armL = arm(-1);
  // torch in the left hand
  const torch = new T.Group(); torch.position.set(0, -0.3, 0.03); U.armL.add(torch);
  const tb = new T.Mesh(new T.CylinderGeometry(0.018, 0.02, 0.16, 16), dark); tb.rotation.x = Math.PI / 2; tb.position.z = 0.05; torch.add(tb);
  const th = new T.Mesh(new T.CylinderGeometry(0.03, 0.02, 0.04, 16), M.brass); th.rotation.x = Math.PI / 2; th.position.z = 0.14; torch.add(th);
  const lens = new T.Mesh(new T.CircleGeometry(0.026, 20), new T.MeshBasicMaterial({ color: new T.Color(2.2, 1.9, 1.3) })); lens.position.z = 0.161; torch.add(lens);
  // soft warm fill that travels with the usher so he's always nicely lit
  U.light = new T.PointLight(0xffd6a8, 1.6, 2.2, 1.5); U.light.position.set(0, 0.4, 0.6); usher.add(U.light);
  usher.scale.setScalar(1.0);
}
U.pos = new T.Vector3(1, 1.5, 0); U.target = new T.Vector3(); U.point = new T.Vector3(); U.pointing = 0; U.fade = 0; U.blink = 0; U.nextBlink = 2;
const _q = new T.Quaternion(), _v = new T.Vector3(), _w = new T.Vector3(), _down = new T.Vector3(0, -1, 0);
function aimArm(sh, worldTarget, amount, dt) {
  // rotate the shoulder so the arm points at a world position (amount 0 = rest)
  sh.parent.updateMatrixWorld(true);
  const shoulder = sh.getWorldPosition(_v);
  _w.copy(worldTarget).sub(shoulder).normalize();
  const inv = sh.parent.getWorldQuaternion(_q).invert(); _w.applyQuaternion(inv);
  const rest = new T.Quaternion().setFromEuler(new T.Euler(0, 0, sh.position.x > 0 ? 0.12 : -0.12));
  const aim = new T.Quaternion().setFromUnitVectors(_down, _w);
  sh.quaternion.slerp(rest.slerp(aim, amount), 1 - Math.exp(-6 * dt));
}
const USHER_LINES = [
  'Our newest feature: <b>Driftwood</b>, with Benjamin in the lead as Chris.',
  "<b>Britain's Most Evil Killers</b>. Benjamin leads as George Naylor.",
  '<b>Gladiator II</b>! Keep an eye out for the Roman standard bearer.',
  '<b>House of the Dragon</b>. Two seasons of battle on this one.',
  "<b>World's Most Evil Killers</b>. Benjamin plays Gary.",
  '<b>Napoleon</b>. Three armies, one actor.',
  '<b>Masters of the Air</b>, as a prisoner of war.',
  '<b>1917</b>. Where it all began.',
];
const say = $('#say'); let sayKey = '';
// typewriter: the full line sits invisibly in the bubble (so it's sized once), and the visible copy types over it
const TYPE_CPS = 34;                                  // characters per second
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const typer = { tokens: [], total: 0, shown: 0, pause: 0, el: null, done: true };
function typedHtml(n) {
  // reveal n visible characters, keeping tags like <b> intact
  let out = '', left = n;
  for (const t of typer.tokens) {
    if (t.startsWith('<')) { out += t; continue; }
    if (left <= 0) continue;
    const chars = [...t]; out += chars.slice(0, left).join(''); left -= chars.length;
  }
  return out;
}
function usherSay(key, html) {
  if (key === sayKey) return; sayKey = key;
  if (!html) { say.classList.remove('on'); typer.done = true; return; }
  say.classList.remove('on'); typer.done = true;
  setTimeout(() => {
    if (sayKey !== key) return;
    say.innerHTML = `<span class="ghost">${html}</span><span class="typed" aria-hidden="true"></span>`;
    typer.el = say.querySelector('.typed');
    typer.tokens = html.split(/(<[^>]+>)/).filter(Boolean);
    typer.total = typer.tokens.filter((t) => !t.startsWith('<')).reduce((a, t) => a + [...t].length, 0);
    typer.shown = reduceMotion ? typer.total : 0; typer.pause = 0.15; typer.done = false;
    typer.el.innerHTML = typedHtml(typer.shown);
    say.classList.add('on');
  }, 220);
}
function tickTyping(dt) {
  if (typer.done || !typer.el) return false;
  if (typer.pause > 0) { typer.pause -= dt; return true; }
  const before = Math.floor(typer.shown);
  typer.shown = Math.min(typer.total, typer.shown + dt * TYPE_CPS);
  const now = Math.floor(typer.shown);
  if (now !== before) {
    typer.el.innerHTML = typedHtml(now);
    // tiny pauses after punctuation, like natural speech
    const plain = typer.tokens.filter((t) => !t.startsWith('<')).join('');
    const ch = [...plain][now - 1];
    if (ch === ',' ) typer.pause = 0.12; else if ('.!?'.includes(ch)) typer.pause = 0.28;
  }
  if (typer.shown >= typer.total) { typer.done = true; return false; }
  return true;
}
function updateUsher(dt, time) {
  if (!entered) { usher.visible = false; return; }
  const fwd = new T.Vector3(); camera.getWorldDirection(fwd);
  let key = '', line = '';
  const tgt = U.target, pt = U.point; let pointAmt = 0.9;
  if (p <= P_WALK_END) {
    const f = hallState.f, s = hallFocus.slot;
    // walking: float ahead, a little to the right, leading the way
    const narrowV = camera.aspect < 1;
    tgt.set(narrowV ? 0.42 : 0.85, narrowV ? 1.3 : 1.45, hallState.z - 2.8);
    pt.set(0.2, 1.4, hallState.z - 9);
    if (s && f > 0.05) {
      const narrow = camera.aspect < 1; // phones: tuck him into the lower corner so the poster stays clear
      const face = new T.Vector3(s.side * (narrow ? 1.1 : 2.3), narrow ? 1.08 : 1.45, s.z + s.side * (narrow ? 0.4 : 1.3));
      const k = f * f; tgt.lerp(face, k);
      pt.lerp(new T.Vector3(s.side * 3, 2.2, s.z), k);
    }
    if (f > 0.8 && s) { const i = posterSlots.indexOf(s); key = 'poster' + i; line = camera.aspect < 1 ? '' : USHER_LINES[i]; } // phones: the plaque says it, keep the poster clear
    else if (p < 0.02) { key = 'welcome'; line = "Good evening! I'm your usher. Scroll and I'll show you to your seat. Tap any poster to find out more."; }
    else if (p > P_WALK_END - 0.03) { key = 'doors'; line = 'Screen One is just through these doors...'; }
  } else if (p <= P_DOOR_B) {
    const o = smooth(P_DOOR_A + 0.03, P_DOOR_B, p);
    tgt.set(lerp(1.05, 0.7, o), 1.5, lerp(DOOR.z + 1.4, DOOR.z - 1.8, o));
    pt.set(0, 1.4, DOOR.z - 4);
    key = 'doors'; line = 'Screen One is just through these doors...';
  } else {
    const tt = clamp((p - P_DOOR_B) / (1 - P_DOOR_B), 0, 1);
    const camU = clamp(lerp(tt, 1 - Math.pow(1 - tt, 2.2), 0.6), 0, 1); // same easing as the camera
    theatrePath.getPointAt(clamp(camU + 0.3, 0, 1), tgt); tgt.x += 0.8; tgt.y -= 0.2;
    const endPos = new T.Vector3(2.3, SEAT.y + 0.55, SEAT.z - 3.0);
    tgt.lerp(endPos, smooth(0.86, 1, p));
    pt.copy(SEAT).lerp(SCREEN_C, smooth(0.9, 1, p) * 0.0 + (p > 0.97 ? 1 : 0));
    if (p > 0.97 && show.state === 'choose') { key = 'choose'; line = 'Best seat in the house! Which feature would you like tonight?'; pointAmt = 0.8; }
    else if (p > 0.97) { key = 'seat'; line = 'Enjoy the show!'; pointAmt = 0.8; }
    else { key = 'aisle'; line = 'Right this way. Mind the steps!'; }
  }
  // exit once the show starts
  const leaving = show.state !== 'idle' && show.state !== 'choose';
  U.fade = damp(U.fade, leaving ? 1 : 0, leaving ? 1.2 : 3, dt);
  usher.visible = U.fade < 0.98;
  if (leaving) { key = ''; line = ''; }
  if (panelOpen) { key = 'panel'; line = ''; }

  // smooth follow with a gentle float
  if (U.pos.distanceTo(tgt) > 8) U.pos.copy(tgt); // big jumps (skip / back to lobby): reappear at the new spot
  U.pos.lerp(tgt, 1 - Math.exp(-2.6 * dt));
  usher.position.copy(U.pos);
  usher.position.y += Math.sin(time * 1.8) * 0.05 + U.fade * 1.2;
  const baseScale = camera.aspect < 1 && p <= P_WALK_END && hallState.f > 0.5 ? 0.72 : 1;
  U.scaleS = damp(U.scaleS || 1, baseScale, 4, dt);
  usher.scale.setScalar(Math.max(0.001, U.scaleS * (1 - U.fade)));
  // face the visitor (yaw only), body tilting into the direction of travel
  const toCam = new T.Vector3(camera.position.x - usher.position.x, 0, camera.position.z - usher.position.z);
  let yaw = Math.atan2(toCam.x, toCam.z);
  if (pointAmt > 0 && key !== 'welcome' && key !== 'seat') {
    // turn partly toward what he's pointing at, so the gesture reads
    const yawPt = Math.atan2(pt.x - usher.position.x, pt.z - usher.position.z);
    let d = yawPt - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * 0.35;
  }
  usher.rotation.y = yaw;
  U.body.rotation.z = Math.sin(time * 1.3) * 0.05;
  U.body.rotation.x = Math.sin(time * 1.8 + 1) * 0.03;
  U.head.rotation.y = Math.sin(time * 0.7) * 0.15; U.head.rotation.z = Math.sin(time * 1.1) * 0.05;
  // arms: right points the way; waves hello at the start; left holds the torch forward
  if (key === 'welcome' || key === 'seat' || key === 'choose') {
    U.armR.rotation.set(0, 0, 2.4 + Math.sin(time * 7) * 0.35); // wave
    aimArm(U.armL, new T.Vector3().copy(usher.position).add(new T.Vector3(0, -1, 0.6).applyAxisAngle(new T.Vector3(0, 1, 0), yaw)), 0.4, dt);
  } else {
    const rW = U.armR.getWorldPosition(new T.Vector3()), lW = U.armL.getWorldPosition(new T.Vector3());
    const useR = rW.distanceTo(pt) < lW.distanceTo(pt);
    const pointArm = useR ? U.armR : U.armL, restArm = useR ? U.armL : U.armR;
    aimArm(pointArm, pt, pointAmt, dt);
    aimArm(restArm, new T.Vector3().copy(usher.position).add(new T.Vector3(0, -1, 0.45).applyAxisAngle(new T.Vector3(0, 1, 0), yaw)), 0.35, dt);
  }
  // blink
  U.nextBlink -= dt; if (U.nextBlink < 0) { U.blink = 0.14; U.nextBlink = 2 + Math.random() * 3; }
  U.blink = Math.max(0, U.blink - dt); const eyeS = U.blink > 0 ? 0.15 : 1;
  U.eyes.forEach((e) => { e.scale.y = eyeS; });
  // moustache twitches when he speaks
  // talking: while the bubble types, the moustache bobs up and down
  const talking = tickTyping(dt) && say.classList.contains('on');
  U.talk = damp(U.talk || 0, talking && typer.pause <= 0 ? 1 : 0, 12, dt);
  const chat = Math.abs(Math.sin(time * 15)) * U.talk;
  if (U.stache) { U.stache.position.y = -0.026 + chat * 0.009; U.stache.rotation.z = Math.sin(time * 7.5) * 0.05 * U.talk; }


  // speech bubble follows the usher's head on screen
  usherSay(key, line);
  const hp = U.head.getWorldPosition(new T.Vector3()); hp.y += 0.32 * usher.scale.x;
  const sp = hp.clone().project(camera);
  const onScreen = sp.z < 1 && Math.abs(sp.x) < 1.1 && Math.abs(sp.y) < 1.1;
  const sx = clamp((sp.x * 0.5 + 0.5) * innerWidth, 140, innerWidth - 140), sy = clamp((-sp.y * 0.5 + 0.5) * innerHeight, 110, innerHeight - 40);
  say.style.left = `${sx}px`; say.style.top = `${sy}px`;
  if (!onScreen && say.classList.contains('on')) say.classList.remove('on');
  else if (onScreen && line && sayKey === key && !say.classList.contains('on') && say.innerHTML) { say.classList.add('on'); }
}

/* ===================================================================
   NAVIGATION: poster stops, rail, keyboard, snap, clicking things
   =================================================================== */
const STOPS = [0];
const posterStopP = [];
for (let i = 0; i < posterSlots.length; i++) {
  const a = HALL_KEYS[1 + i * 2], b = HALL_KEYS[2 + i * 2];
  const sp = ((a.u + b.u) / 2) * P_WALK_END; posterStopP.push(sp); STOPS.push(sp);
}
STOPS.push(P_DOOR_B, 1);
posterSlots.forEach((s, i) => {
  const btn = document.createElement('button'); btn.className = 'stop'; btn.style.top = `${posterStopP[i] * 100}%`;
  btn.setAttribute('aria-label', `Go to ${s.title}`); btn.title = s.title;
  btn.addEventListener('click', () => scrollToP(posterStopP[i])); $('#rail').appendChild(btn);
});
function stepStop(dir) {
  const cur = targetP;
  const next = dir > 0 ? STOPS.find((v) => v > cur + 0.003) : [...STOPS].reverse().find((v) => v < cur - 0.003);
  if (next !== undefined) scrollToP(next);
}
addEventListener('keydown', (e) => {
  if (lb.open) {
    if (e.key === 'Escape') closeLightbox(); else if (e.key === 'ArrowRight') stepStill(1); else if (e.key === 'ArrowLeft') stepStill(-1);
    e.preventDefault(); return;
  }
  if (e.key === 'Escape' && panelOpen) { closePanel(); return; }
  if (!entered || panelOpen) return;
  if (['reel', 'credits', 'done'].includes(show.state)) {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); seekTo(video.currentTime + 10); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); seekTo(video.currentTime - 10); return; }
  }
  // arrows match the wheel: Up / Right = forward, Down / Left = back
  if (['ArrowUp', 'ArrowRight', 'PageUp'].includes(e.key)) { e.preventDefault(); stepStop(1); }
  if (['ArrowDown', 'ArrowLeft', 'PageDown'].includes(e.key)) { e.preventDefault(); stepStop(-1); }
});

// click / tap posters and the box office
const ray = new T.Raycaster(), ptr = new T.Vector2();
function pick(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(clickables, true)[0];
  if (!hit || hit.distance > 9) return null;
  return hit.object.userData.slot ? { slot: hit.object.userData.slot } : hit.object.userData.boxOffice ? { box: true } : null;
}
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!entered || !downAt || p > P_WALK_END + 0.02) return;
  if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) return; // it was a swipe
  const h = pick(e); if (!h) return;
  if (h.slot) openDetail(h.slot); else openPanel($('#boxoffice'));
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || !entered) return;
  canvas.style.cursor = p < P_WALK_END + 0.02 && pick(e) ? 'pointer' : '';
});

/* ===================================================================
   LOOP
   =================================================================== */
const clock = new T.Clock();
const tmpLook = new T.Vector3();
const bulbColor = new T.Color();
let fovCur = baseFov();

function update(dt, time, dtReal) {
  // smooth scroll progress
  if (walkVel && touchY === null) { targetP = clamp(targetP + walkVel * dt, 0, 1); walkVel *= Math.exp(-3.5 * dt); if (Math.abs(walkVel) < 1e-4) walkVel = 0; }
  p = damp(p, targetP, 1.9, dt); // eased so the walk glides rather than jumps
  if (Math.abs(p - targetP) < 1e-4) p = targetP;

  cameraAt(p, camPos, camLook);
  const focus = hallFocus;
  const inHall = p < P_WALK_END + 0.02;
  mouseS.lerp(mouse, 1 - Math.exp(-3 * dt));

  camera.position.copy(camPos);
  camera.lookAt(camLook);
  const seated = p > 0.985;
  const par = seated ? 0.035 : 0.06;
  camera.rotateY(-mouseS.x * par);
  camera.rotateX(-mouseS.y * par * 0.6);

  // fov narrows as you settle into the seat
  // seated: frame the whole screen, whatever the window shape
  const seatD = SEAT.z - SCREEN.z;
  const fitFov = 2 * Math.atan((SCREEN.w / 2 + 0.9) / seatD / camera.aspect) * 180 / Math.PI;
  const fovTarget = lerp(baseFov(), Math.max(baseFov() * 0.82, fitFov), smooth(0.9, 1, p));
  fovCur = snapFov ? fovTarget : damp(fovCur, fovTarget, 4, dt); snapFov = false;
  if (Math.abs(camera.fov - fovCur) > 0.01) { camera.fov = fovCur; camera.updateProjectionMatrix(); }

  // sound: hinge creak as the doors open
  // lobby jazz: full in the hallway, muffled through the doors, gone once you're seated
  setAmbience(entered && (show.state === 'idle' || show.state === 'choose') ? 0.57 * musicVol * musicVol * (1 - smooth(0.8, 0.975, p) * 0.85) : 0, smooth(0.72, 0.9, p));
  if (update.prevP !== undefined && update.prevP < P_DOOR_A + 0.03 && p >= P_DOOR_A + 0.03) creak();
  update.prevP = p;

  // doors
  const open = smooth(P_DOOR_A + 0.02, P_DOOR_B + 0.01, p) * 1.72;
  for (const d of doors) d.pivot.rotation.y = d.side < 0 ? open : -open;

  // marquee chaser
  for (let i = 0; i < marqueeBulbs.length; i++) {
    const on = ((i + Math.floor(time * 7)) % 3 === 0) ? 1 : 0.28;
    bulbMesh.setColorAt(i, bulbColor.setScalar(on));
  }
  bulbMesh.instanceColor.needsUpdate = true;

  // ------------- show sequence
  const atSeat = p > 0.975 && targetP > 0.975;
  show.t += dtReal;
  if (!atSeat && show.state !== 'idle') {
    // visitor left the seat → pause and bring the lights up
    if (!video.paused) video.pause();
    reelWrap.classList.remove('on'); setRattle(0); setState('idle');
  }
  switch (show.state) {
    case 'idle':
      if (atSeat && entered) setState(show.picked ? 'intro' : 'choose');
      break;
    case 'choose': // "Tonight's features": waiting for the visitor to pick a reel
      break;
    case 'intro': // lights down, curtains open
      if (show.t > 3.6) {
        if (show.reelStarted && !video.ended && video.currentTime > 0.5) { setState('reel'); reelWrap.classList.add('on'); video.play().catch(() => {}); }
        else { setState('countdown'); show.lastNum = 0; setRattle(0.05); }
      }
      break;
    case 'countdown': {
      if (show.t < 5) {
        const n = drawCountdown(show.t);
        if (n !== show.lastNum) { show.lastNum = n; beep(n === 2 ? 1000 : 640, n === 2 ? 0.12 : 0.05, n === 2 ? 0.22 : 0.09); }
      } else if (show.t < 5.5) { drawBlack(); }
      else {
        seenCountdown = true; try { localStorage.setItem('bf_seen_countdown', '1'); } catch (e) { /* ignore */ }
        setState('reel'); show.reelStarted = true; reelWrap.classList.add('on');
        video.currentTime = 0; video.play().catch(() => { video.muted = true; $('#muteBtn').textContent = 'Unmute'; video.play().catch(() => {}); });
        setRattle(0.012, 2);
      }
      break;
    }
    case 'reel':
      break;
    case 'credits': {
      setRattle(0.0);
      show.cpos = (show.cpos || 0) + dtReal * CREDIT_SPEED * (show.cfast ? CREDIT_FAST : 1);
      const done = drawCredits(show.cpos);
      if (done) { setState('done'); $('#creditsBtn').textContent = 'Replay reel'; if (!show.boShown) { show.boShown = true; openPanel($('#boxoffice')); } }
      break;
    }
  }
  if (show.state === 'credits') $('#creditsBtn').textContent = 'Replay reel';
  else if (show.state === 'reel') $('#creditsBtn').textContent = 'Credits';

  const dark = show.state !== 'idle' && show.state !== 'choose';
  show.lights = damp(show.lights, dark ? 0.1 : 1, dark ? 1.1 : 2.5, dtReal);
  show.curtain = damp(show.curtain, dark ? 1 : 0, dark ? 1.3 : 1.6, dtReal);
  const projecting = ['countdown', 'reel', 'credits', 'done'].includes(show.state);
  show.beamOn = damp(show.beamOn, projecting ? 1 : 0, 3, dtReal);

  houseLights.forEach((L, i) => { L.intensity = (i < 4 ? 22 : 32) * show.lights; });
  sconceGlows.forEach(({ shell }) => { shell.material.emissiveIntensity = 1.2 * show.lights; });
  const c = show.curtain;
  curtains.forEach((g, i) => { g.scale.x = lerp(1, 0.13, c); g.children[0].scale.z = lerp(1, 2.4, c); });
  const flick = 0.92 + Math.random() * 0.08;
  beam.material.uniforms.uOpacity.value = show.beamOn * flick;
  beam.material.uniforms.uTime.value = time;
  dust.material.opacity = show.beamOn * 0.35;
  dust.rotation.z = Math.sin(time * 0.05) * 0.002;
  const scrBright = ['idle', 'choose', 'intro'].includes(show.state) ? 0.16 : 0.95;
  screenMat.color.setScalar(damp(screenMat.color.r, scrBright, 3, dt));
  screenLight.intensity = show.beamOn * (show.state === 'reel' ? 9 : 14) * flick;
  if (['idle', 'choose', 'intro'].includes(show.state)) { if (!show._idleDrawn) { scr.fillStyle = '#cfcfcf'; scr.fillRect(0, 0, 1280, 720); scrTex.needsUpdate = true; show._idleDrawn = true; } }
  else show._idleDrawn = false;

  if (entered && p > 0.6 && !show.buffering) { show.buffering = true; setReel(show.reelKey || REELS[0].key, 'auto'); }

  updateUsher(dtReal, time);

  // ------------- HUD
  const hintOp = entered ? clamp(1 - p * 30, 0, 1) : 0;
  ui.hint.style.opacity = hintOp;
  if (inHall && focus.weight > 0.6 && focus.slot) {
    if (lastCaption !== focus.slot.key) {
      lastCaption = focus.slot.key; ui.cy.textContent = focus.slot.year; ui.ct.textContent = focus.slot.title; ui.cr.textContent = focus.slot.role;
    }
    ui.caption.style.opacity = clamp((focus.weight - 0.6) * 3, 0, 1);
  } else ui.caption.style.opacity = 0;
  ui.rail.style.top = `${p * 100}%`;
  $('#more').classList.toggle('on', inHall && focus.weight > 0.85 && !!focus.slot && !panelOpen);
  const showing = show.state !== 'idle' && show.state !== 'choose';
  ui.controls.classList.toggle('on', ['reel', 'credits', 'done'].includes(show.state) && !panelOpen);
  if (ui.controls.classList.contains('on')) updateRemote();
  $('#choose').classList.toggle('on', show.state === 'choose' && !panelOpen);
  $('#skipCd').classList.toggle('on', show.state === 'countdown' && seenCountdown);
  $('#ffBtn').hidden = show.state !== 'credits';
  ui.skip.style.opacity = p > 0.7 ? 0 : 1; ui.skip.style.pointerEvents = p > 0.7 ? 'none' : 'auto';
  $('#musicVol').style.opacity = p > 0.7 || !entered ? 0 : 1; $('#musicVol').style.pointerEvents = p > 0.7 || !entered ? 'none' : 'auto';
  ui.brand.style.opacity = showing ? 0.35 : 1;
  $('#rail').style.opacity = showing || p > 0.9 ? 0 : 1;
}

let started = false;
function frame() {
  if (document.body.classList.contains('nowebgl')) { clock.getDelta(); requestAnimationFrame(frame); return; } // simple version showing: pause the 3D
  const raw = clock.getDelta();
  const dt = Math.min(raw, 0.05);
  const time = clock.elapsedTime;
  update(dt, time, Math.min(raw, 0.5));
  if (LITE) renderer.render(scene, camera); else composer.render();
  if (show.state === 'reel' || reelWrap.classList.contains('on') || p > 0.9) cssRenderer.render(cssScene, camera);
  if (!started) { started = true; $('#loading').style.opacity = 0; }
  requestAnimationFrame(frame);
}
scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { if (m.isMeshStandardMaterial || m.isMeshBasicMaterial) { m.dithering = true; m.needsUpdate = true; } }); });
camera.fov = fovCur; camera.updateProjectionMatrix();
renderer.compile(scene, camera);
frame();
window.__bf3dReady = true;
if (location.hash === '#debug') window.__cinema = { usher, U, scene, camera, T, getP: () => [p, targetP], setP: (v) => { targetP = v; p = v; }, show, get video() { return video; }, setState };



})();
