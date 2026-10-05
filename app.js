import { createParser } from "./stream.js";
import { countValue, countDuration, changedDigits } from "./count.js";

const API = "https://dorizzstore.com/api/order-target";
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString("id-ID");

let token = null;
let controller = null;
let shown = 0;
let retry = 0;

function connection(text, cls) {
  const el = $("connection");
  el.textContent = text;
  el.className = cls || "";
}

/** Render angka per-digit, hanya digit yang berubah yang diberi animasi. */
function paint(value) {
  const digits = changedDigits(fmt(shown), fmt(value));
  const el = $("total");
  el.replaceChildren(
    ...digits.map(({ char, spin }) => {
      const span = document.createElement("span");
      span.className = spin ? "d spin" : "d";
      span.textContent = char;
      return span;
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

function render(data) {
  const progress = Math.min(100, data.progress);
  $("target").textContent = fmt(data.target);
  $("progress").textContent = `${progress.toFixed(1).replace(".", ",")}%`;
  $("fill").style.width = `${progress}%`;
  countTo(data.total);
}

function reset() {
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
  $("password").value = "";
  $("password").focus();
}

async function stream() {
  controller?.abort();
  controller = new AbortController();
  const parser = createParser((event) => {
    if (event.type !== "snapshot") return;
    retry = 0;
    connection("Realtime", "live");
    render(event.data);
  });

  try {
    const response = await fetch(`${API}/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 401) return reset();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      parser(decoder.decode(value, { stream: true }));
    }
    throw new Error("Stream berakhir");
  } catch (error) {
    if (controller?.signal.aborted) return;
    connection("Menyambung ulang", "stale");
    retry = Math.min(retry + 1, 5);
    setTimeout(stream, 500 * 2 ** (retry - 1));
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
  controller?.abort();
  connection("Terputus", "stale");
});

window.addEventListener("online", () => {
  if (token) stream();
});

const saved = sessionStorage.getItem("dorizz-order-target");
if (saved) start(saved);
else $("password").focus();
