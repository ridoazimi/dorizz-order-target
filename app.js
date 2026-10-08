import { createParser } from "./stream.js";
import { countValue, countDuration, changedDigits } from "./count.js";

const API = "https://dorizzstore.com/api/order-target";
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString("id-ID");
const pct = (n) => `${n.toFixed(1).replace(".", ",")}%`;

let token = null;
let controller = null;
let shown = 0;
let retry = 0;
let generation = 0;

function connection(text, cls) {
  const el = $("connection");
  el.textContent = text;
  el.className = cls || "";
}

/** Render angka per-digit; hanya digit yang berubah yang bergulir. */
function paint(value) {
  const el = $("total");
  el.replaceChildren(
    ...changedDigits(fmt(shown), fmt(value)).map(({ char, spin }) => {
      const cell = document.createElement("span");
      cell.className = spin ? "d spin" : "d";
      const inner = document.createElement("span");
      inner.textContent = char;
      cell.appendChild(inner);
      return cell;
    }),
  );
  shown = value;
}

/** Hitung cepat dari angka saat ini menuju angka sebenarnya. */
function countTo(target) {
  const from = shown;
  const duration = countDuration(from, target);
  if (duration === 0) return;
  const started = performance.now();
  const step = (now) => {
    const elapsed = now - started;
    paint(countValue(from, target, elapsed, duration));
    if (elapsed < duration) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Daftar sumber order. Barisnya tetap, hanya angka dan lebar bar berubah. */
function paintFunnels(funnels) {
  const list = $("funnel-list");
  if (!Array.isArray(funnels)) return;
  // Baris dibuat sekali lalu dipakai ulang supaya transisi lebar bar berjalan
  // dan pembaca layar tidak mengumumkan seluruh daftar setiap snapshot.
  if (list.childElementCount !== funnels.length) {
    list.replaceChildren(
      ...funnels.map(() => {
        const row = document.createElement("li");
        row.className = "funnel-row";
        row.innerHTML =
          '<span class="funnel-label"></span>' +
          '<span class="funnel-orders"></span>' +
          '<span class="funnel-track"><span class="funnel-fill"></span></span>' +
          '<span class="funnel-share"></span>';
        return row;
      }),
    );
  }
  funnels.forEach((funnel, index) => {
    const row = list.children[index];
    row.dataset.key = funnel.key;
    row.querySelector(".funnel-label").textContent = funnel.label;
    row.querySelector(".funnel-orders").textContent = fmt(funnel.orders);
    row.querySelector(".funnel-share").textContent = pct(funnel.share);
    row.querySelector(".funnel-fill").style.width = `${Math.min(100, funnel.share)}%`;
  });
}

function render(data) {
  const progress = Math.min(100, data.progress);
  $("target").textContent = fmt(data.target);
  $("progress").textContent = pct(progress);
  $("fill").style.width = `${progress}%`;
  $("today").textContent = fmt(data.today);
  $("remaining").textContent = fmt(data.remaining);
  paintFunnels(data.funnels);
  countTo(data.total);
}

function reset() {
  generation += 1;
  controller?.abort();
  controller = null;
  token = null;
  shown = 0;
  sessionStorage.removeItem("dorizz-order-target");
  $("board").hidden = true;
  $("gate").hidden = false;
  $("total").textContent = "0";
  $("progress").textContent = "0%";
  $("fill").style.width = "0";
  $("today").textContent = "0";
  $("remaining").textContent = "0";
  $("funnel-list").replaceChildren();
  $("password").value = "";
  $("password").focus();
}

async function stream() {
  // Retry otomatis dan event "online" sama-sama memanggil stream(). Tanpa
  // penanda generasi, panggilan kedua membatalkan koneksi milik panggilan
  // pertama dan aliran bisa mati diam tanpa ada yang menyambung ulang.
  const mine = ++generation;
  controller?.abort();
  const own = new AbortController();
  controller = own;

  const parser = createParser((event) => {
    if (mine !== generation) return;
    if (event.event === "heartbeat") {
      retry = 0;
      connection("Realtime", "live");
      return;
    }
    if (event.event === "expired") return reset();
    if (event.event === "unavailable") {
      connection("Data tidak tersedia", "stale");
      return;
    }
    if (event.event !== "snapshot") return;
    retry = 0;
    connection("Realtime", "live");
    render(event.data);
  });

  try {
    const response = await fetch(`${API}/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: own.signal,
      cache: "no-store",
    });
    if (mine !== generation) return;
    if (response.status === 401) return reset();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (mine !== generation) return;
      if (done) break;
      parser(decoder.decode(value, { stream: true }));
    }
    throw new Error("Stream berakhir");
  } catch (error) {
    if (own.signal.aborted || mine !== generation || !token) return;
    connection("Menyambung ulang", "stale");
    retry = Math.min(retry + 1, 5);
    setTimeout(() => {
      if (mine === generation && token) stream();
    }, 500 * 2 ** (retry - 1));
  }
}

async function start(next) {
  token = next;
  sessionStorage.setItem("dorizz-order-target", next);
  $("gate").hidden = true;
  $("board").hidden = false;
  shown = 0;
  connection("Menghubungkan");
  stream();
}

$("gate").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("gate").querySelector("button");
  const status = $("gate-status");
  button.disabled = true;
  status.textContent = "";
  try {
    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: $("password").value }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Tidak dapat masuk.");
    $("password").value = "";
    await start(data.token);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$("logout").addEventListener("click", reset);

window.addEventListener("offline", () => {
  if (!token) return;
  generation += 1;
  controller?.abort();
  connection("Terputus", "stale");
});

window.addEventListener("online", () => {
  if (token) stream();
});

const saved = sessionStorage.getItem("dorizz-order-target");
if (saved) start(saved);
else $("password").focus();
