import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const app = readFileSync("app.js", "utf8");
const css = readFileSync("style.css", "utf8");

test("papan angka punya wadah sumber order yang dibaca app.js", () => {
  assert.match(html, /id="funnel-list"/);
  assert.match(app, /paintFunnels\(data\.funnels\)/);
});

test("baris sumber dipakai ulang, bukan dibuat ulang setiap snapshot", () => {
  // Kalau daftar selalu di-replaceChildren, transisi lebar bar tidak pernah
  // jalan dan pembaca layar mengumumkan seluruh daftar tiap 1 order masuk.
  assert.match(app, /list\.childElementCount !== funnels\.length/);
});

test("snapshot tanpa funnels tidak boleh melempar", () => {
  assert.match(app, /if \(!Array\.isArray\(funnels\)\) return/);
});

test("keluar mengosongkan daftar sumber", () => {
  const reset = app.slice(app.indexOf("function reset()"), app.indexOf("async function stream()"));
  assert.match(reset, /\$\("funnel-list"\)\.replaceChildren\(\)/);
});

test("lebar bar dibatasi 100% supaya tidak meluber", () => {
  assert.match(app, /Math\.min\(100, funnel\.share\)/);
});

test("kolom bar punya lebar sama di semua baris", () => {
  // Kolom label harus lebar tetap. Dengan `auto`, setiap bar mulai di titik
  // berbeda dan panjang bar antar baris tidak bisa dibandingkan.
  const row = css.slice(css.indexOf(".funnel-row {"));
  assert.match(row, /grid-template-columns:\s*9\.6em/);
  assert.doesNotMatch(row.split("}")[0], /auto/);
});

test("gerak berkurang mematikan transisi bar sumber", () => {
  const reduced = css.slice(css.indexOf("prefers-reduced-motion"));
  assert.match(reduced, /\.funnel-fill \{ transition: none; \}/);
});
