import { test, expect } from "bun:test";
import { calculateMediaRenewDelayMs } from "./useLessonMedia";

test("calculateMediaRenewDelayMs: 300 seconds returns 240000ms", () => {
  expect(calculateMediaRenewDelayMs(300)).toBe(240000);
});

test("calculateMediaRenewDelayMs: 90 seconds returns 30000ms", () => {
  expect(calculateMediaRenewDelayMs(90)).toBe(30000);
});

test("calculateMediaRenewDelayMs: invalid/non-positive TTL is safely clamped", () => {
  expect(calculateMediaRenewDelayMs(0)).toBe(30000);
  expect(calculateMediaRenewDelayMs(-10)).toBe(30000);
  expect(calculateMediaRenewDelayMs(NaN)).toBe(30000);
});

test("calculateMediaRenewDelayMs: too short TTL clamps to minimum 30000ms", () => {
  expect(calculateMediaRenewDelayMs(45)).toBe(30000);
});
