const say = (id, t) => ($(id).textContent = t);

/* ---- Kemiringan HP → gravitasi air ---- */
let tiltX = 0,
  tiltY = 1; // arah gravitasi: default lurus ke bawah
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

/* ---- Simulasi partikel (dipakai di bagian 1 dan 2) ---- */
const INFO = {
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
function makeSim(cv, getMode) {
  const cx = cv.getContext("2d"),
    W = cv.width,
    H = cv.height,
    P = [];
  for (let i = 0; i < 40; i++) {
    const hx = W / 2 - 180 + (i % 10) * 40,
      hy = H / 2 - 60 + Math.floor(i / 10) * 40;
    P.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 });
  }
  let vis = true,
    last = 0,
    prev = null;
  new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(cv);
  function tick(t) {
    requestAnimationFrame(tick);
    const k = Math.min(3, (t - last) / 16.67 || 1);
    last = t;
    if (!vis || document.hidden) return;
    const mode = getMode();
    if (mode !== prev) {
      prev = mode;
      P.forEach((p) => {
        const a = Math.random() * 6.28;
        p.vx = Math.cos(a);
        p.vy = Math.sin(a);
      });
    }
    cx.clearRect(0, 0, W, H);
    const col = INFO[mode][1],
      sp = (mode === "gas" ? 5 : mode === "cair" ? 2.4 : 0) * k,
      top = mode === "gas" ? 10 : 0;
    P.forEach((p) => {
      if (mode === "padat") {
        p.x += (p.hx - p.x) * 0.15 + (Math.random() - 0.5) * 2.2;
        p.y += (p.hy - p.y) * 0.15 + (Math.random() - 0.5) * 2.2;
      } else {
        const l = Math.hypot(p.vx, p.vy) || 1,
          gx = mode === "cair" ? tiltX * 3 : 0,
          gy = mode === "cair" ? 0.15 + tiltY * 3 : 0;
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
      cx.fillStyle = col;
      cx.beginPath();
      cx.arc(p.x, p.y, 13, 0, 6.28);
      cx.fill();
      cx.fillStyle = "rgba(255,255,255,.55)";
      cx.beginPath();
      cx.arc(p.x - 4, p.y - 4, 4, 0, 6.28);
      cx.fill();
    });
  }
  requestAnimationFrame(tick);
}

/* ---- 1. Tiga wujud ---- */
let mW = "padat";
const seenW = new Set(["padat"]);
makeSim($("cv"), () => mW);
say("sayW", INFO.padat[0]);
document.querySelectorAll("#modes button").forEach(
  (b) =>
    (b.onclick = () => {
      mW = b.dataset.m;
      document
        .querySelectorAll("#modes button")
        .forEach((x) => x.classList.toggle("on", x === b));
      say("sayW", INFO[mW][0]);
      tone(INFO[mW][2], 0.15, "triangle");
      seenW.add(mW);
      if (seenW.size === 3) markDone("wujud");
    }),
);

/* ---- 2. Perubahan wujud ---- */
const stateOf = (t) => (t <= 0 ? "padat" : t < 100 ? "cair" : "gas"),
  NAME = { padat: "Padat 🧊", cair: "Cair 💧", gas: "Gas ☁️" },
  TXT = {
    padat:
      "Pada suhu 0 °C atau lebih rendah, air membeku menjadi es. Butirannya rapat dan hanya bergetar. Peristiwa ini disebut membeku.",
    cair: "Di antara 0 °C dan 100 °C, air berwujud cair. Es yang menerima panas akan mencair. Uap yang kehilangan panas akan mengembun.",
    gas: "Pada 100 °C air mendidih dan menguap menjadi uap air (gas). Butirannya berlari cepat ke mana-mana. Peristiwa ini disebut menguap.",
  },
  seenU = new Set(["cair"]);
let mU = "cair";
makeSim($("cv2"), () => mU);
say("sayU", "Geser pengatur suhu ke kiri dan ke kanan, lalu lihat apa yang terjadi pada air!");
function setTemp(v) {
  v = +v;
  $("temp").value = v;
  $("tv").textContent = v;
  const s = stateOf(v);
  $("tstate").textContent = NAME[s];
  if (s !== mU) {
    mU = s;
    say("sayU", TXT[s]);
    tone(INFO[s][2], 0.15, "triangle");
    seenU.add(s);
    if (seenU.size === 3) markDone("ubah");
  }
}
$("temp").oninput = (e) => setTemp(e.target.value);
document
  .querySelectorAll("#tq button")
  .forEach((b) => (b.onclick = () => setTemp(b.dataset.t)));

/* ---- 3. Terapung / tenggelam ---- */
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
const tried = new Set(),
  it = $("items"),
  tank = $("tank"),
  water = tank.querySelector(".water"),
  pr = $("pred");
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
    say("sayA", "Menurutmu, " + o[1] + " akan terapung atau tenggelam?");
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
        ew = e.offsetWidth;
      e.style.left =
        Math.round(
          tank.clientWidth * 0.15 + Math.random() * (tank.clientWidth * 0.7 - ew),
        ) + "px";
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
        { duration: floats ? 1400 : 1800, fill: "forwards", easing: "ease-in" },
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
      say(
        "sayA",
        (right ? "Tebakanmu benar! " : "Hampir! ") +
          o[1][0].toUpperCase() +
          o[1].slice(1) +
          (floats
            ? " terapung karena lebih ringan daripada air dengan ukuran yang sama."
            : " tenggelam karena lebih berat daripada air dengan ukuran yang sama.") +
          " Ayo coba benda lain.",
      );
      pr.hidden = true;
      tried.add(cur);
      if (tried.size >= 3) markDone("apung");
    }),
);

/* ---- 4. Kartu balik ---- */
const flips = document.querySelectorAll(".flip"),
  flipped = new Set();
flips.forEach(
  (c, i) =>
    (c.onclick = () => {
      const on = c.classList.toggle("go");
      c.setAttribute("aria-pressed", on);
      S.balik();
      if (on) flipped.add(i);
      if (flipped.size === flips.length) markDone("sifat");
    }),
);

/* ---- 5. Kelompokkan ---- */
const G = [
  ["🪨", "batu", "keras"],
  ["🧽", "spons", "lunak"],
  ["🔩", "besi", "keras"],
  ["🧸", "boneka kain", "lunak"],
  ["🪵", "kayu", "keras"],
  ["🍞", "roti", "lunak"],
  ["🔑", "kunci", "keras"],
  ["🧶", "benang wol", "lunak"],
];
let selG = null,
  placed = 0;
const pool = $("pool");
G.forEach((g, i) => {
  const b = document.createElement("button");
  b.className = "gi";
  b.draggable = true;
  b.innerHTML = `<span class="em">${g[0]}</span><small>${g[1]}</small>`;
  b.onclick = () => {
    selG = i;
    [...pool.children].forEach((c) => c.classList.toggle("sel", c === b));
    S.klik();
    say("sayK", "Kamu memilih " + g[1] + ". Sekarang ketuk keranjang yang tepat!");
  };
  b.ondragstart = (e) => {
    selG = i;
    e.dataTransfer.setData("text/plain", i);
  };
  b._i = i;
  pool.appendChild(b);
});
function place(kind) {
  if (selG === null) return say("sayK", "Pilih satu benda dulu ya!");
  const g = G[selG],
    btn = [...pool.children].find((c) => c._i === selG);
  if (!btn || btn.parentNode !== pool) return;
  if (g[2] === kind) {
    $("b-" + kind).querySelector(".list").appendChild(btn);
    btn.classList.remove("sel");
    btn.disabled = true;
    btn.draggable = false;
    selG = null;
    placed++;
    S.benar();
    say(
      "sayK",
      placed === G.length
        ? "Hebat! Semua benda sudah masuk keranjang yang tepat! 🎉"
        : "Tepat! " + g[1][0].toUpperCase() + g[1].slice(1) + " termasuk benda " + kind + ". Lanjut!",
    );
    if (placed === G.length) markDone("kel");
  } else {
    S.salah();
    btn.classList.add("shake");
    setTimeout(() => btn.classList.remove("shake"), 450);
    say(
      "sayK",
      "Hmm, belum tepat. Coba pikirkan: apakah " + g[1] + " mudah berubah bentuk kalau ditekan?",
    );
  }
}
["keras", "lunak"].forEach((k) => {
  const el = $("b-" + k);
  el.onclick = () => place(k);
  el.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      place(k);
    }
  };
  el.ondragover = (e) => {
    e.preventDefault();
    el.classList.add("over");
  };
  el.ondragleave = () => el.classList.remove("over");
  el.ondrop = (e) => {
    e.preventDefault();
    el.classList.remove("over");
    place(k);
  };
});

function restart() {
  store.set("prog", []);
  location.hash = "";
  location.reload();
}