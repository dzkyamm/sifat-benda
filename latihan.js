const TOP = {
  semua: ["🌟", "Campuran semua topik"],
  wujud: ["🧊", "Wujud benda"],
  apung: ["🛟", "Terapung dan tenggelam"],
  sifat: ["🧲", "Sifat benda"],
};
const DESC = {
  semua: "Soal dari semua topik, diacak. Ada 10 soal.",
  wujud: "Padat, cair, gas, dan perubahan wujud.",
  apung: "Benda yang terapung dan tenggelam.",
  sifat: "Magnet, keras-lunak, kasar-halus, dan sifat lainnya.",
};
const COL = { semua: "#d63a63", wujud: "#1f78c8", apung: "#d6891a", sifat: "#6a4df0" };
/* k = topik, bs = benar/salah (urutan pilihan tidak diacak) */
const BANK = [
  { k: "wujud", t: "Es batu termasuk benda berwujud …", o: ["Padat", "Cair", "Gas"], a: 0, e: "Es batu bentuknya tetap dan butirannya rapat, jadi wujudnya padat." },
  { k: "wujud", t: "Udara termasuk benda berwujud …", o: ["Padat", "Cair", "Gas"], a: 2, e: "Udara tidak punya bentuk tetap dan memenuhi ruangan, jadi wujudnya gas." },
  { k: "wujud", t: "Air dituang dari botol ke gelas. Apa yang berubah?", o: ["Bentuknya", "Wujudnya menjadi padat", "Wujudnya menjadi gas"], a: 0, e: "Air tetap cair. Bentuknya mengikuti wadah, tapi jumlahnya tetap." },
  { k: "wujud", t: "Butiran benda padat …", o: ["bergetar di tempat", "bergerak bebas ke mana-mana", "mengalir seperti air"], a: 0, e: "Butiran benda padat rapat dan hanya bergetar, sehingga bentuknya tidak berubah." },
  { k: "wujud", t: "Air mendidih berubah menjadi uap air. Peristiwa ini disebut …", o: ["Membeku", "Menguap", "Mengembun"], a: 1, e: "Cair berubah menjadi gas karena dipanaskan. Itu namanya menguap." },
  { k: "wujud", t: "Es batu di piring lama-lama menjadi air. Peristiwa ini disebut …", o: ["Mencair", "Menguap", "Membeku"], a: 0, e: "Padat berubah menjadi cair karena menerima panas. Itu namanya mencair." },
  { k: "wujud", bs: 1, t: "Benar atau salah? Gas bisa memenuhi seluruh ruangan.", o: ["Benar", "Salah"], a: 0, e: "Butiran gas berjauhan dan bergerak cepat, jadi gas menyebar memenuhi ruangan." },
  { k: "apung", t: "Batu dimasukkan ke dalam air. Apa yang terjadi?", o: ["Terapung", "Tenggelam", "Menghilang"], a: 1, e: "Batu lebih berat daripada air dengan ukuran yang sama, jadi tenggelam." },
  { k: "apung", t: "Benda mana yang terapung di air?", o: ["Kayu", "Baut besi", "Koin logam"], a: 0, e: "Kayu lebih ringan daripada air dengan ukuran yang sama, jadi terapung." },
  { k: "apung", t: "Telur dimasukkan ke dalam air biasa. Telur akan …", o: ["terapung", "tenggelam", "melayang di udara"], a: 1, e: "Telur lebih berat daripada air biasa, jadi tenggelam." },
  { k: "apung", t: "Sebelum melakukan percobaan, ilmuwan cilik sebaiknya …", o: ["menebak hasilnya dulu", "langsung menyerah", "menebak tanpa mencoba"], a: 0, e: "Ilmuwan membuat tebakan dulu, lalu membuktikannya dengan percobaan." },
  { k: "apung", bs: 1, t: "Benar atau salah? Semua benda berat pasti tenggelam di air.", o: ["Benar", "Salah"], a: 1, e: "Salah. Kapal besi sangat berat tapi bisa terapung, sedangkan paku kecil tenggelam." },
  { k: "sifat", t: "Benda mana yang ditarik magnet?", o: ["Penggaris kayu", "Paku besi", "Gelas plastik"], a: 1, e: "Paku terbuat dari besi, dan besi ditarik magnet." },
  { k: "sifat", t: "Kaca bening termasuk benda yang …", o: ["tembus cahaya", "tidak tembus cahaya", "ditarik magnet"], a: 0, e: "Cahaya bisa melewati kaca bening, jadi kaca tembus cahaya." },
  { k: "sifat", t: "Permukaan amplas terasa …", o: ["halus", "kasar", "basah"], a: 1, e: "Amplas dibuat kasar supaya bisa menghaluskan kayu." },
  { k: "sifat", t: "Sendok mana yang paling cepat panas di air hangat?", o: ["Sendok kayu", "Sendok plastik", "Sendok logam"], a: 2, e: "Logam menghantar panas dengan baik, jadi cepat ikut panas." },
  { k: "sifat", t: "Spons mudah berubah bentuk saat ditekan. Spons termasuk benda …", o: ["keras", "lunak", "tembus cahaya"], a: 1, e: "Benda yang mudah berubah bentuk saat ditekan disebut benda lunak." },
  { k: "sifat", bs: 1, t: "Benar atau salah? Semua benda logam ditarik magnet.", o: ["Benar", "Salah"], a: 1, e: "Salah. Yang ditarik magnet umumnya besi dan baja. Koin dan aluminium tidak." },
];
const sh = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const show = (id) => {
  ["start", "play", "end"].forEach((x) => ($(x).hidden = x !== id));
  scrollTo({ top: 0, behavior: "smooth" });
};
let set = [],
  idx = 0,
  sc = 0,
  wrong = [],
  topic = "semua",
  locked = false;

function card(k, box) {
  const b = document.createElement("button"),
    best = store.get("best_" + k, null),
    cnt = k === "semua" ? 10 : BANK.filter((q) => q.k === k).length;
  b.className = "tcard";
  b.style.setProperty("--c", COL[k]);
  b.innerHTML =
    '<span class="ic">' + TOP[k][0] + "</span><h4>" + TOP[k][1] + "</h4><p>" + DESC[k] +
    '</p><small>' + cnt + " soal · " + (best ? "Nilai terbaik: " + best : "Belum dicoba") +
    '</small><span class="go">Mulai →</span>';
  b.onclick = () => {
    if (!$("nama").value.trim()) {
      $("nmsg").hidden = false;
      $("nama").focus();
      scrollTo({ top: 0, behavior: "smooth" });
      S.salah();
      return;
    }
    $("nmsg").hidden = true;
    store.set("nama", $("nama").value.trim());
    S.klik();
    start(k);
  };
  box.appendChild(b);
}
function menu() {
  playing = false;
  $("topics").innerHTML = "";
  $("mix").innerHTML = "";
  ["wujud", "apung", "sifat"].forEach((k) => card(k, $("topics")));
  card("semua", $("mix"));
  show("start");
}
/* keluar tugas + peringatan sebelum progres hilang */
let playing = false;
const dlg = $("dlg");
$("exit").onclick = () => dlg.showModal();
$("stay").onclick = () => dlg.close();
$("leave").onclick = () => {
  dlg.close();
  menu();
};
addEventListener("beforeunload", (e) => {
  if (playing) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function start(k) {
  topic = k;
  const pool =
    k === "semua"
      ? sh([...BANK]).slice(0, 10)
      : sh(BANK.filter((q) => q.k === k));
  set = pool.map((q) => {
    const opts = q.o.map((txt, j) => ({ txt, ok: j === q.a }));
    return { q, opts: q.bs ? opts : sh(opts), pick: null };
  });
  idx = 0;
  playing = true;
  $("ptopic").textContent = TOP[k][1];
  show("play");
  render();
}
function render() {
  const it = set[idx],
    q = it.q,
    btns = [],
    box = $("opts");
  $("pn").textContent = "Soal " + (idx + 1) + " dari " + set.length;
  $("qt").textContent = q.t;
  $("prev").hidden = idx === 0;
  $("next").textContent = idx + 1 < set.length ? "Lanjut →" : "Lihat hasil →";
  box.innerHTML = "";
  function paint() {
    const done = it.pick !== null;
    $("prog").style.width = (set.filter((x) => x.pick !== null).length / set.length) * 100 + "%";
    btns.forEach((b, j) => {
      b.classList.toggle("ok", done && it.opts[j].ok);
      b.classList.toggle("bad", done && it.pick === j && !it.opts[j].ok);
      b.setAttribute("aria-disabled", done);
    });
    $("next").disabled = !done;
    $("fb").textContent = !done
      ? "Pilih jawabanmu dulu supaya bisa lanjut ya!"
      : it.opts[it.pick].ok
        ? "Benar! " + q.e
        : "Belum tepat, tidak apa-apa. " + q.e;
  }
  it.opts.forEach((o, j) => {
    const b = document.createElement("button");
    b.textContent = o.txt;
    btns.push(b);
    b.onclick = () => {
      if (it.pick !== null) return;
      it.pick = j;
      o.ok ? S.benar() : S.salah();
      paint();
    };
    box.appendChild(b);
  });
  paint();
}
$("next").onclick = () => {
  if (set[idx].pick === null) return;
  S.klik();
  if (idx + 1 < set.length) {
    idx++;
    render();
  } else finish();
};
$("prev").onclick = () => {
  if (idx > 0) {
    S.klik();
    idx--;
    render();
  }
};
function finish() {
  playing = false;
  sc = set.filter((x) => x.opts[x.pick].ok).length;
  wrong = set.filter((x) => !x.opts[x.pick].ok).map((x) => x.q);
  const n = set.length,
    pct = sc / n,
    m =
      pct >= 0.9
        ? ["🥇", "Ilmuwan Hebat", "Luar biasa! Kamu sudah paham materi ini dengan sangat baik."]
        : pct >= 0.6
          ? ["🥈", "Ilmuwan Cilik", "Bagus sekali! Sedikit lagi kamu jadi ilmuwan hebat."]
          : ["🥉", "Calon Ilmuwan", "Jangan menyerah! Baca materinya lagi lalu coba lagi ya."];
  $("prog").style.width = "100%";
  $("nm").textContent = $("nama").value.trim() || "-";
  $("tgl").textContent = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  $("etopic").textContent = TOP[topic][1];
  $("medal").textContent = m[0];
  $("bs").textContent = sc + " / " + n;
  $("title").textContent = m[1];
  $("rmsg").textContent = m[2];
  const rv = $("review");
  rv.innerHTML = "";
  if (wrong.length) {
    const h = document.createElement("h3");
    h.textContent = "Yuk, pelajari lagi soal ini:";
    const ul = document.createElement("ul");
    wrong.forEach((q) => {
      const li = document.createElement("li"),
        b = document.createElement("b");
      b.textContent = q.t;
      li.append(b, document.createElement("br"), "Jawaban benar: " + q.o[q.a] + ". " + q.e);
      ul.appendChild(li);
    });
    rv.append(h, ul);
  }
  const prev = store.get("best_" + topic, null);
  if (!prev || sc / n >= parseInt(prev) / parseInt(prev.split("/")[1]))
    store.set("best_" + topic, sc + "/" + n);
  const all = store.get("hasil", []);
  all.push({ n: $("nama").value.trim(), d: Date.now(), t: TOP[topic][1], s: sc, j: n });
  store.set("hasil", all);
  show("end");
  setTimeout(pct >= 0.6 ? S.menang : S.salah, 300);
}
$("again").onclick = () => start(topic);
$("menu").onclick = menu;
$("nama").value = store.get("nama", "");
menu();