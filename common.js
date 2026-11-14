const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem("ipa_" + k);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("ipa_" + k, JSON.stringify(v));
    } catch (e) {}
  },
};
const go = (id) => $(id).scrollIntoView({ behavior: "smooth" });

/* ---- Suara (Web Audio, tanpa file audio) ---- */
let muted = store.get("muted", false),
  ac;
function tone(f, d, type = "sine", t0 = 0, f2) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    const o = ac.createOscillator(),
      g = ac.createGain(),
      t = ac.currentTime + t0;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  } catch (e) {}
}
const seq = (fs, d = 0.15, gap = 0.1) =>
  fs.forEach((f, i) => tone(f, d, "sine", i * gap));
const S = {
  klik: () => tone(660, 0.08, "triangle"),
  benar: () => seq([523, 659, 784]),
  salah: () => {
    tone(330, 0.2);
    tone(262, 0.3, "sine", 0.18);
  },
  balik: () => tone(300, 0.18, "triangle", 0, 900),
  plop: () => tone(500, 0.2, "sine", 0, 120),
  menang: () => seq([523, 659, 784, 1047], 0.2, 0.13),
};

/* ---- Maskot (dipakai ulang) + navigasi ---- */
document.body.insertAdjacentHTML(
  "afterbegin",
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="zahra" viewBox="28 -6 94 98"><circle cx="75" cy="52" r="42" fill="#fff4d6" stroke="#26334d" stroke-width="4"/><path d="M40 30 Q75 -5 110 30 Z" fill="#7b61ff" stroke="#26334d" stroke-width="4"/><circle cx="110" cy="22" r="7" fill="#7b61ff"/><ellipse cx="60" cy="54" rx="5" ry="7" fill="#26334d"/><ellipse cx="90" cy="54" rx="5" ry="7" fill="#26334d"/><path d="M58 70 Q75 86 92 70" fill="none" stroke="#26334d" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="68" r="6" fill="#ffb3c4"/><circle cx="102" cy="68" r="6" fill="#ffb3c4"/></symbol></svg>`,
);
const page = document.body.dataset.page,
  LINKS = [
    ["index.html#wujud", "Tiga wujud"],
    ["index.html#ubah", "Perubahan wujud"],
    ["index.html#apung", "Terapung"],
    ["index.html#sifat", "Sifat benda"],
    ["index.html#kelompok", "Kelompokkan"],
    ["latihan.html", "Latihan soal"],
    ["admin.html", "🔒 Guru"],
  ];
document.body.insertAdjacentHTML(
  "afterbegin",
  `<header class="nav"><div class="nav-in">
    <a class="brand" href="index.html"><svg class="zv" aria-hidden="true"><use href="#zahra"/></svg><span>Zahra IPA</span></a>
    <span class="sp"></span>
    <span id="stars" class="stars"></span>
    <button id="mute" class="mute"></button>
    <button id="burger" class="mute burger" aria-label="Buka menu" aria-expanded="false" aria-controls="menu">☰</button>
  </div>
  <nav id="menu" class="menu" hidden aria-label="Menu utama">${LINKS.map(
    (l) =>
      `<a href="${l[0]}"${(page === "latihan" && l[0] === "latihan.html") || (page === "admin" && l[0] === "admin.html") ? ' class="act" aria-current="page"' : ""}>${l[1]}</a>`,
  ).join("")}</nav></header><div id="toast" class="toast" role="status" aria-live="polite"></div>`,
);
const burger = $("burger"),
  menuEl = $("menu");
function toggleMenu(open) {
  menuEl.hidden = !open;
  burger.textContent = open ? "✕" : "☰";
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
}
burger.onclick = (e) => {
  e.stopPropagation();
  S.klik();
  toggleMenu(menuEl.hidden);
};
menuEl.onclick = (e) => e.target.closest("a") && toggleMenu(false);
document.addEventListener("click", (e) => {
  if (!menuEl.hidden && !e.target.closest(".nav")) toggleMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !menuEl.hidden) {
    toggleMenu(false);
    burger.focus();
  }
});
function paintMute() {
  const b = $("mute");
  b.textContent = muted ? "🔇" : "🔊";
  b.setAttribute("aria-label", muted ? "Suara mati" : "Suara nyala");
  b.setAttribute("aria-pressed", muted);
}
$("mute").onclick = () => {
  muted = !muted;
  store.set("muted", muted);
  paintMute();
  S.klik();
};
paintMute();

/* ---- Progres bintang ---- */
const LABEL = {
  wujud: "Tiga wujud benda",
  ubah: "Perubahan wujud",
  apung: "Terapung dan tenggelam",
  sifat: "Sifat-sifat benda",
  kel: "Mengelompokkan benda",
};
const prog = () => store.get("prog", []);
function paintStars() {
  const n = prog().length;
  $("stars").textContent = "⭐ " + n + "/5";
  $("stars").setAttribute("aria-label", n + " dari 5 bintang kegiatan");
}
let toastT;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2600);
}
function markDone(k) {
  const p = prog();
  if (p.includes(k)) return;
  p.push(k);
  store.set("prog", p);
  paintStars();
  toast("⭐ Bintang baru: " + LABEL[k] + "!");
  setTimeout(p.length === 5 ? S.menang : S.benar, 150);
}
paintStars();