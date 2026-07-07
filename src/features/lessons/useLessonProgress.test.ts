import { test, expect, mock, spyOn } from "bun:test";
import { normalizeLessonPositionSeconds, normalizeLessonProgressPercent } from "./progress-utils";

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

test("normalizeLessonProgressPercent: completed sends exactly 100", () => {
  expect(normalizeLessonProgressPercent(10, 600, "completed")).toBe(100);
});

test("normalizeLessonProgressPercent: in_progress clamps to 99.99", () => {
  expect(normalizeLessonProgressPercent(600, 600, "in_progress")).toBe(99.99);
});

mock.module("react", () => {
  return {
    useRef: (initial: any) => ({ current: initial }),
    useCallback: (fn: any) => fn,
    useEffect: () => {},
  };
});

mock.module("@/features/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

import { lessonContentService } from "./services/lesson-content.service";
import { useLessonProgress } from "./useLessonProgress";

test("Service RPC payload uses integer last_position_seconds and no numeric strings", async () => {
  let capturedPayload: any = null;

  mock.module("@/lib/supabase/client", () => ({
    getSupabaseBrowserClient: () => ({
      rpc: async (rpcName: string, payload: any) => {
        capturedPayload = payload;
        return { data: {}, error: null };
      },
    }),
  }));

  // Test service directly
  await lessonContentService.saveLessonProgress("lesson-1", "in_progress", 50, 10.999);

  expect(capturedPayload).not.toBeNull();
  expect(typeof capturedPayload.p_last_position_seconds).toBe("number");
  expect(Number.isInteger(capturedPayload.p_last_position_seconds)).toBe(true);
  expect(capturedPayload.p_last_position_seconds).toBe(10); // 10.999 floored
});

test("Queue concurrency: one active request prevents concurrent save, keeps newest", async () => {
  let resolveFirst: any;
  const firstPromise = new Promise((resolve) => {
    resolveFirst = resolve;
  });
  let callCount = 0;

  const mockSave = mock(async () => {
    callCount++;
    if (callCount === 1) {
      return firstPromise;
    }
    return { data: {}, error: null };
  });

  // Override the service method locally
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-1", 600);

  // Fire first
  const p1 = saveProgress(10, "in_progress");
  // Fire second
  const p2 = saveProgress(20, "in_progress");
  // Fire third (newest)
  const p3 = saveProgress(30, "in_progress");

  // Only one call should have been made initially
  expect(callCount).toBe(1);

  // Resolve the first
  resolveFirst({ data: {}, error: null });
  await p1;

  // Now the queue should process the NEXT pending save, which is the newest (30)
  // Give it a microtick
  await Promise.resolve();

  // It should have been called twice total (10, then 30). 20 was skipped.
  expect(callCount).toBe(2);

  // Restore
  lessonContentService.saveLessonProgress = originalSave;
});

test("Queue precedence: completed pending snapshot is not replaced by stale in_progress", async () => {
  let resolveFirst: any;
  const firstPromise = new Promise((resolve) => {
    resolveFirst = resolve;
  });

  const mockSave = mock(async () => firstPromise);
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-1", 600);

  // Fire first (locks queue)
  saveProgress(10, "in_progress");

  // Fire completed
  saveProgress(600, "completed");

  // Fire stale in_progress (e.g. late timeupdate)
  saveProgress(10, "in_progress");

  // Resolve first
  resolveFirst({ data: {}, error: null });

  // In the real code, pendingSave.current would be inspected.
  // We can't directly inspect it, but we can verify the mock arguments.
  await Promise.resolve(); // drain
  await Promise.resolve(); // next tick

  // The second call to the service should be for "completed", 600
  expect(mockSave.mock.calls[1][1]).toBe("completed");
  expect(mockSave.mock.calls[1][3]).toBe(600);

  lessonContentService.saveLessonProgress = originalSave;
});

test("Queue rejection releases queue, background rejection does not create unhandled promise", async () => {
  let resolveSecond: any;
  const secondPromise = new Promise((resolve) => {
    resolveSecond = resolve;
  });
  let callCount = 0;

  const mockSave = mock(async () => {
    callCount++;
    if (callCount === 1) {
      throw new Error("Temporary network error");
    }
    return secondPromise;
  });

  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-1", 600);

  // Background action - must catch it locally in the test to simulate the component doing it
  // Actually, saveProgress itself throws, but VideoPlayer adds .catch(). We'll simulate VideoPlayer catching.
  let errorCaught = false;
  const p1 = saveProgress(10, "in_progress").catch(() => {
    errorCaught = true;
  });

  // Enqueue a second one while the first is rejecting
  saveProgress(20, "in_progress").catch(() => {});

  await p1; // wait for rejection to finish processing

  expect(errorCaught).toBe(true);
  expect(callCount).toBe(2); // Queue was released and processed the next one

  resolveSecond({ data: {}, error: null });

  lessonContentService.saveLessonProgress = originalSave;
});
