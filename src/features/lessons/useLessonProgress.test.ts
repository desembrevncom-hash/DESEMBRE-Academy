import { test, expect } from "bun:test";
import { normalizeLessonPositionSeconds } from "./useLessonProgress";

test("normalizeLessonPositionSeconds: 9.203 normalizes to 9", () => {
  expect(normalizeLessonPositionSeconds(9.203)).toBe(9);
});

test("normalizeLessonPositionSeconds: 9.999 normalizes to 9", () => {
  expect(normalizeLessonPositionSeconds(9.999)).toBe(9);
});

test("normalizeLessonPositionSeconds: negative position normalizes to 0", () => {
  expect(normalizeLessonPositionSeconds(-3)).toBe(0);
});

test("normalizeLessonPositionSeconds: NaN normalizes to 0", () => {
  expect(normalizeLessonPositionSeconds(NaN)).toBe(0);
});

test("normalizeLessonPositionSeconds: Infinity normalizes to 0", () => {
  expect(normalizeLessonPositionSeconds(Infinity)).toBe(0);
});

test("normalizeLessonPositionSeconds: position beyond duration clamps to floored duration", () => {
  expect(normalizeLessonPositionSeconds(605, 600)).toBe(600);
});

test("normalizeLessonPositionSeconds: duration with decimals is floored for max clamp", () => {
  expect(normalizeLessonPositionSeconds(605.5, 600.8)).toBe(600);
});
