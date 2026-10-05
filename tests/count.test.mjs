import test from "node:test";
import assert from "node:assert/strict";
import { countValue, countDuration, changedDigits, easeOut } from "../count.js";

test("count animation always lands exactly on the real total", () => {
  assert.equal(countValue(0, 759, 0, 1100), 0);
  assert.equal(countValue(0, 759, 1100, 1100), 759);
  assert.equal(countValue(0, 759, 99999, 1100), 759, "overshoot clamps to the true value");
  assert.equal(countValue(759, 760, 0, 420), 759);
  assert.equal(countValue(759, 760, 420, 420), 760);
  assert.equal(countValue(500, 500, 0, 0), 500, "no change needs no animation");
});

test("count animation is monotonic and decelerating", () => {
  let previous = -1;
  for (let t = 0; t <= 1100; t += 55) {
    const value = countValue(0, 759, t, 1100);
    assert.ok(value >= previous, `value must not go backwards at ${t}ms`);
    previous = value;
  }
  assert.ok(easeOut(0.25) > 0.25, "early frames move faster than linear");
  assert.ok(easeOut(0.9) < 1, "final frames slow down");
  assert.equal(easeOut(1), 1);
});

test("duration is short for small increments and longer for first load", () => {
  assert.equal(countDuration(759, 759), 0);
  assert.ok(countDuration(0, 759) > countDuration(759, 760));
  assert.ok(countDuration(759, 760) <= 450, "a single new order must feel instant");
  assert.ok(countDuration(700, 759) <= 900, "mid-size jumps stay capped");
});

test("only digits that actually change are spun", () => {
  const same = changedDigits(759, 759);
  assert.deepEqual(same.map((d) => d.spin), [false, false, false]);
  const inc = changedDigits(759, 760);
  assert.deepEqual(inc.map((d) => d.char).join(""), "760");
  assert.deepEqual(inc.map((d) => d.spin), [false, true, true]);
  const grow = changedDigits(999, 1000);
  assert.equal(grow.length, 4);
  assert.deepEqual(grow.map((d) => d.spin), [true, true, true, true]);
});
