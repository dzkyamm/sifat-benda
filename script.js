function go(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}
/* ---- Kemiringan HP → gravitasi air ---- */
let tiltX = 0,
  tiltY = 1;
function onOrient(e) {
  if (e.beta === null && e.gamma === null) return;
  const b = Math.max(-90, Math.min(90, e.beta || 0)),
    g = Math.max(-90, Math.min(90, e.gamma || 0));
  tiltX = g / 90;
  tiltY = b / 90;
}
function enableTilt() {
  if (typeof DeviceOrientationEvent === "undefined") return;
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then((st) => st === "granted" && addEventListener("deviceorientation", onOrient))
      .catch(() => {});
  } else {
    addEventListener("deviceorientation", onOrient);
  }
}
if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
  addEventListener("click", enableTilt, { once: true });
  addEventListener("touchend", enableTilt, { once: true });
} else {
  enableTilt();
}
/* ---- Suara (Web Audio, tanpa file) ---- */
let ac,
  muted = false;
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
const muteBtn = document.getElementById("mute");
muteBtn.onclick = () => {
  muted = !muted;
  muteBtn.textContent = muted ? "🔇 Suara: mati" : "🔊 Suara: nyala";
  muteBtn.setAttribute("aria-pressed", muted);
  S.klik();
};
/* ---- 1. Partikel ---- */
const cv = document.getElementById("cv"),
  cx = cv.getContext("2d"),
  W = cv.width,
  H = cv.height,
  N = 40;
const info = {
  padat: [
    "Butirannya rapat dan rapi. Mereka hanya bergetar di tempat, jadi bentuk benda padat tidak berubah. Contoh: es batu, batu, buku.",
    "#3a8dde",
    262,
  ],
  cair: [
    "Butirannya berdekatan tapi bisa bergeser. Karena itu air bisa mengalir dan mengikuti bentuk gelas, tapi jumlahnya tetap. Contoh: air, susu, jus.",
    "#27b0a0",
    392,
  ],
  gas: [
    "Butirannya berjauhan dan berlari cepat ke mana-mana. Gas memenuhi seluruh ruangan. Contoh: udara, uap air.",
    "#ff6f91",
    659,
  ],
};
const P = [];
for (let i = 0; i < N; i++) {
  const c = i % 10,
    r = Math.floor(i / 10),
    hx = W / 2 - 180 + c * 40,
    hy = H / 2 - 60 + r * 40;
  P.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 });
}
let mode = "padat",
  visible = true,
  last = 0;
function setMode(m) {
  mode = m;
  P.forEach((p) => {
    const a = Math.random() * 6.28;
    p.vx = Math.cos(a);
    p.vy = Math.sin(a);
  });
  document
    .querySelectorAll("#modes button")
    .forEach((b) => b.classList.toggle("on", b.dataset.m === m));
  document.getElementById("say1").textContent = info[m][0];
}
document.querySelectorAll("#modes button").forEach(
  (b) =>
    (b.onclick = () => {
      setMode(b.dataset.m);
      tone(info[b.dataset.m][2], 0.15, "triangle");
    }),
);
new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(cv);
function tick(t) {
  requestAnimationFrame(tick);
  const k = Math.min(3, (t - last) / 16.67 || 1);
  last = t;
  if (!visible || document.hidden) return;
  cx.clearRect(0, 0, W, H);
  cx.fillStyle = info[mode][1];
  const sp = (mode === "gas" ? 5 : mode === "cair" ? 2.4 : 0) * k,
    top = mode === "gas" ? 10 : mode === "cair" ? H * 0.5 : 0;
  P.forEach((p) => {
    if (mode === "padat") {
      p.x += (p.hx - p.x) * 0.15 + (Math.random() - 0.5) * 2.2;
      p.y += (p.hy - p.y) * 0.15 + (Math.random() - 0.5) * 2.2;
    } else {
      const l = Math.hypot(p.vx, p.vy) || 1,
        gx = mode === "cair" ? tiltX * 0.6 : 0,
        gy = mode === "cair" ? 0.15 + tiltY * 0.6 : 0;
      p.vx = (p.vx / l) * sp + (Math.random() - 0.5) * 0.4 + gx;
      p.vy = (p.vy / l) * sp + (Math.random() - 0.5) * 0.4 + gy;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 14 || p.x > W - 14) {
        p.vx *= -1;
        p.x = Math.min(W - 14, Math.max(14, p.x));
      }
      if (p.y < top + 14 || p.y > H - 14) {
        p.vy *= -1;
        p.y = Math.min(H - 14, Math.max(top + 14, p.y));
      }
    }
    cx.beginPath();
    cx.arc(p.x, p.y, 13, 0, 6.28);
    cx.fill();
    cx.fillStyle = "rgba(255,255,255,.55)";
    cx.beginPath();
    cx.arc(p.x - 4, p.y - 4, 4, 0, 6.28);
    cx.fill();
    cx.fillStyle = info[mode][1];
  });
}
setMode("padat");
requestAnimationFrame(tick);
/* ---- 2. Apung / tenggelam ---- */
const items = [
  ["🪵", "kayu", 1],
  ["🍃", "daun kering", 1],
  ["🪨", "batu", 0],
  ["🪙", "koin logam", 0],
  ["🍎", "apel", 1],
  ["🔩", "baut besi", 0],
  ["🧽", "spons kering", 1],
  ["🥚", "telur", 0],
];
let cur = null;
const it = document.getElementById("items"),
  tank = document.getElementById("tank"),
  water = tank.querySelector(".water"),
  pr = document.getElementById("pred"),
  s2 = document.getElementById("say2");
function clearTank() {
  tank.querySelectorAll(".drop").forEach((d) => {
    d._anims && d._anims.forEach((a) => a.cancel());
    d.remove();
  });
}
items.forEach((o, i) => {
  const b = document.createElement("button");
  b.textContent = o[0];
  b.setAttribute("aria-label", o[1]);
  b.onclick = () => {
    cur = i;
    clearTank();
    S.klik();
    [...it.children].forEach((c, j) => c.classList.toggle("sel", j === i));
    pr.hidden = false;
    s2.textContent = "Menurutmu, " + o[1] + " akan terapung atau tenggelam?";
  };
  it.appendChild(b);
});
pr.querySelectorAll("button").forEach(
  (b) =>
    (b.onclick = () => {
      if (cur === null) return;
      const o = items[cur],
        floats = !!o[2],
        right = (b.dataset.p === "apung") === floats;
      clearTank();
      const e = document.createElement("span");
      e.className = "drop";
      e.textContent = o[0];
      tank.appendChild(e);
      const th = tank.clientHeight,
        eh = e.offsetHeight,
        ew = e.offsetWidth,
        x = Math.round(
          tank.clientWidth * 0.15 + Math.random() * (tank.clientWidth * 0.7 - ew),
        );
      e.style.left = x + "px";
      const surf = th - water.offsetHeight - eh * 0.6,
        bot = th - eh - 4,
        ty = (y) => `translateY(${y}px)`;
      e._anims = [];
      const a1 = e.animate(
        floats
          ? [
              { transform: ty(0) },
              { transform: ty(surf + 16), offset: 0.5 },
              { transform: ty(surf + 30), offset: 0.65 },
              { transform: ty(surf) },
            ]
          : [{ transform: ty(0) }, { transform: ty(bot) }],
        {
          duration: floats ? 1400 : 1800,
          fill: "forwards",
          easing: "ease-in",
        },
      );
      e._anims.push(a1);
      setTimeout(S.plop, floats ? 500 : 650);
      if (floats)
        a1.onfinish = () =>
          e._anims.push(
            e.animate(
              [
                { transform: ty(surf) },
                { transform: ty(surf + 8) },
                { transform: ty(surf) },
              ],
              { duration: 1600, iterations: Infinity },
            ),
          );
      setTimeout(right ? S.benar : S.salah, 1000);
      s2.textContent =
        (right ? "Tebakanmu benar! " : "Hampir! ") +
        o[1][0].toUpperCase() +
        o[1].slice(1) +
        (floats
          ? " terapung karena lebih ringan daripada air dengan ukuran yang sama."
          : " tenggelam karena lebih berat daripada air dengan ukuran yang sama.") +
        " Ayo coba benda lain.";
      pr.hidden = true;
    }),
);
/* ---- 3. Kartu balik ---- */
document.querySelectorAll(".flip").forEach(
  (c) =>
    (c.onclick = () => {
      const on = c.classList.toggle("go");
      c.setAttribute("aria-pressed", on);
      S.balik();
    }),
);
/* ---- 4. Kuis ---- */
const Q = [
  [
    "Air berubah menjadi uap ketika dipanaskan. Wujud uap air adalah …",
    ["Padat", "Cair", "Gas"],
    2,
  ],
  [
    "Partikel benda padat …",
    ["bergetar di tempat", "bergerak bebas ke mana-mana", "mengalir seperti air"],
    0,
  ],
  [
    "Benda mana yang ditarik magnet?",
    ["Penggaris kayu", "Paku besi", "Gelas plastik"],
    1,
  ],
  [
    "Batu dimasukkan ke dalam air. Apa yang terjadi?",
    ["Terapung", "Tenggelam", "Menghilang"],
    1,
  ],
  [
    "Air dituang dari botol ke gelas. Apa yang berubah?",
    ["Bentuknya", "Wujudnya jadi padat", "Wujudnya jadi gas"],
    0,
  ],
];
const qz = document.getElementById("quiz"),
  scoreEl = document.getElementById("score");
let sc = 0,
  ans = 0;
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildQuiz() {
  sc = 0;
  ans = 0;
  qz.innerHTML = "";
  scoreEl.textContent = "Jawab " + Q.length + " pertanyaan ini ya!";
  shuffle([...Q]).forEach((q, i) => {
    const d = document.createElement("div"),
      t = document.createElement("b"),
      btns = [];
    d.className = "q";
    t.textContent = i + 1 + ". " + q[0];
    d.append(t, document.createElement("br"));
    shuffle(q[1].map((txt, j) => ({ txt, ok: j === q[2] }))).forEach((o) => {
      const b = document.createElement("button");
      b.textContent = o.txt;
      b._ok = o.ok;
      btns.push(b);
      b.onclick = () => {
        if (d.dataset.done) return;
        d.dataset.done = 1;
        ans++;
        b.classList.add(o.ok ? "ok" : "no");
        if (o.ok) {
          sc++;
          S.benar();
        } else {
          btns.find((x) => x._ok).classList.add("ok");
          S.salah();
        }
        if (ans === Q.length) {
          scoreEl.textContent =
            sc === Q.length
              ? "Skor " + sc + "/" + Q.length + ". Hebat sekali, kamu ilmuwan cilik! 🎉"
              : "Skor " +
                sc +
                "/" +
                Q.length +
                ". Bagus! Yuk main lagi supaya makin pintar. 🌟";
          setTimeout(S.menang, 600);
        }
      };
      d.appendChild(b);
    });
    qz.appendChild(d);
  });
}
buildQuiz();
function restart() {
  buildQuiz();
  clearTank();
  document.querySelectorAll(".flip.go").forEach((c) => {
    c.classList.remove("go");
    c.setAttribute("aria-pressed", "false");
  });
  go("wujud");
}