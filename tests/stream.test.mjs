import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createParser } from "../stream.js";

test("SSE parser buffers partial frames and preserves authoritative snapshots", () => {
  const seen = [];
  const feed = createParser((e) => seen.push(e));
  feed("event: snapshot\ndata: {\"total\":78");
  assert.equal(seen.length, 0, "a half-received frame must not be emitted");
  feed("7}\n\nevent: heartbeat\ndata: {}\n\n");
  assert.equal(seen.length, 2);
  assert.deepEqual(seen[0], { event: "snapshot", data: { total: 787 } });
  assert.equal(seen[1].event, "heartbeat");
});

test("client reads the field name the parser actually emits", () => {
  // Regresi: app.js pernah membaca event.type, sehingga setiap snapshot dibuang
  // dan angka tidak pernah muncul meski stream membalas HTTP 200.
  const app = readFileSync("app.js", "utf8");
  assert.ok(!/event\.type/.test(app), "event.type tidak pernah di-set oleh createParser");
  assert.match(app, /event\.event\s*!==\s*"snapshot"/);

  const emitted = [];
  createParser((e) => emitted.push(e))("event: snapshot\ndata: {\"total\":1}\n\n");
  assert.ok("event" in emitted[0] && !("type" in emitted[0]));
});

test("browser offline event aborts the active streaming request", () => {
  const app = readFileSync("app.js", "utf8");
  assert.match(app, /addEventListener\("offline"/);
});

test("only the newest reconnect attempt is allowed to drive the UI", () => {
  const app = readFileSync("app.js", "utf8");
  // Retry otomatis dan event "online" pernah saling membatalkan koneksi.
  assert.match(app, /const mine = \+\+generation/);
  assert.match(app, /if \(mine !== generation\) return/);
  assert.match(app, /if \(mine === generation && token\) stream\(\)/);
  assert.ok(!/signal: controller\.signal/.test(app), "stream harus memakai controller miliknya sendiri");
});
