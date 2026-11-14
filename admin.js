const KEY = "admin";
async function hash(s) {
  const x = "ipa-salt:" + s;
  try {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x));
    return [...new Uint8Array(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let h = 0;
    for (const c of x) h = (h * 31 + c.charCodeAt(0)) | 0;
    return "f" + h;
  }
}
async function creds() {
  let c = store.get(KEY, null);
  if (!c) {
    c = { u: "zahra", h: await hash("zahra123"), def: true };
    store.set(KEY, c);
  }
  return c;
}
const authed = () => sessionStorage.getItem("ipa_adm") === "1";
const msg = (id, t) => {
  $(id).textContent = t;
  $(id).hidden = !t;
};
async function view() {
  const ok = authed(),
    c = await creds();
  $("login").hidden = ok;
  $("panel").hidden = !ok;
  if (ok) {
    $("nu").value = c.u;
    draw();
  }
}
let fails = 0,
  lockUntil = 0;
$("lf").onsubmit = async (e) => {
  e.preventDefault();
  if (Date.now() < lockUntil)
    return msg("lerr", "Terlalu banyak percobaan. Coba lagi sebentar.");
  const c = await creds();
  if ($("u").value.trim() === c.u && (await hash($("p").value)) === c.h) {
    sessionStorage.setItem("ipa_adm", "1");
    fails = 0;
    msg("lerr", "");
    $("p").value = "";
    S.benar();
    view();
  } else {
    if (++fails >= 3) {
      lockUntil = Date.now() + 15000;
      fails = 0;
    }
    S.salah();
    msg("lerr", "Username atau password salah.");
  }
};
/* ---- Data hasil ---- */
const data = () => store.get("hasil", []);
const pct = (r) => Math.round((r.s / r.j) * 100);
function draw() {
  const all = data(),
    q = $("q").value.trim().toLowerCase(),
    tb = $("rows");
  tb.innerHTML = "";
  $("sN").textContent = all.length;
  $("sS").textContent = new Set(all.map((r) => r.n.toLowerCase())).size;
  $("sA").textContent = all.length
    ? Math.round(all.reduce((a, r) => a + pct(r), 0) / all.length)
    : "-";
  const list = all
    .map((r, i) => ({ r, i }))
    .filter((x) => x.r.n.toLowerCase().includes(q))
    .reverse();
  $("empty").hidden = list.length > 0;
  list.forEach(({ r, i }) => {
    const tr = document.createElement("tr");
    [
      r.n,
      new Date(r.d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
      r.t,
      r.s + "/" + r.j,
      pct(r),
    ].forEach((v) => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    });
    const td = document.createElement("td"),
      b = document.createElement("button");
    b.textContent = "Hapus";
    b.className = "alt2";
    b.setAttribute("aria-label", "Hapus data " + r.n);
    b.onclick = () => {
      if (!confirm("Hapus data " + r.n + "?")) return;
      const a = data();
      a.splice(i, 1);
      store.set("hasil", a);
      draw();
    };
    td.appendChild(b);
    tr.appendChild(td);
    tb.appendChild(tr);
  });
}
$("q").oninput = draw;
$("ref").onclick = () => {
  draw();
  S.klik();
  toast("🔄 Data diperbarui");
};
addEventListener("storage", () => authed() && draw());
addEventListener("focus", () => authed() && draw());
$("clr").onclick = () => {
  if (data().length && confirm("Hapus SEMUA data hasil? Ini tidak bisa dibatalkan.")) {
    store.set("hasil", []);
    draw();
  }
};
$("csv").onclick = () => {
  const esc = (v) => {
    v = String(v);
    if (/^[=+\-@]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  };
  const rows = [["Nama", "Tanggal", "Topik", "Benar", "Total", "Nilai"]].concat(
    data().map((r) => [r.n, new Date(r.d).toLocaleString("id-ID"), r.t, r.s, r.j, pct(r)]),
  );
  const blob = new Blob(["\ufeff" + rows.map((r) => r.map(esc).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "hasil-latihan.csv";
  a.click();
  URL.revokeObjectURL(a.href);
};

/* ---- Ganti kredensial ---- */
const cp = $("cpcard");
function closeCp() {
  cp.hidden = true;
  ["cp", "np", "np2"].forEach((id) => ($(id).value = ""));
  msg("cerr", "");
}
$("pw").onclick = () => {
  cp.hidden = false;
  cp.scrollIntoView({ behavior: "smooth" });
  $("cp").focus();
};
$("cancel").onclick = closeCp;
$("cf").onsubmit = async (e) => {
  e.preventDefault();
  const c = await creds(),
    u = $("nu").value.trim(),
    p = $("np").value;
  if ((await hash($("cp").value)) !== c.h) return msg("cerr", "Password saat ini salah.");
  if (!u) return msg("cerr", "Username tidak boleh kosong.");
  if (p.length < 6) return msg("cerr", "Password baru minimal 6 karakter.");
  if (p !== $("np2").value) return msg("cerr", "Ulangi password tidak sama.");
  store.set(KEY, { u, h: await hash(p) });
  closeCp();
  S.benar();
  toast("✅ Username dan password diperbarui");
  view();
};
view();