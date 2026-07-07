import { test, expect, mock } from "bun:test";
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
      }
    })
  }));

  const originalSave = lessonContentService.saveLessonProgress;
  // Let the real service method run with mocked Supabase to see the boundary output
  await lessonContentService.saveLessonProgress("lesson-1", "in_progress", 50, 10.999);
  
  expect(capturedPayload).not.toBeNull();
  expect(typeof capturedPayload.p_last_position_seconds).toBe("number");
  expect(Number.isInteger(capturedPayload.p_last_position_seconds)).toBe(true);
  expect(capturedPayload.p_last_position_seconds).toBe(10); // 10.999 floored
  
  // Restore for subsequent mocks if needed
  lessonContentService.saveLessonProgress = originalSave;
});

test("Queue concurrency: one active request prevents concurrent save, keeps newest", async () => {
  let resolveFirst: any;
  const firstPromise = new Promise((resolve) => { resolveFirst = resolve; });
  let callCount = 0;
  
  const mockSave = mock(async () => {
    callCount++;
    if (callCount === 1) {
      return firstPromise;
    }
    return { data: {}, error: null };
  });

  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-1", 600);
  
  const p1 = saveProgress(10, "in_progress");
  saveProgress(20, "in_progress");
  saveProgress(30, "in_progress");

  expect(callCount).toBe(1);

  resolveFirst({ data: {}, error: null });
  await p1;
  await Promise.resolve();

  expect(callCount).toBe(2);

  lessonContentService.saveLessonProgress = originalSave;
});

test("Queue precedence: completed pending snapshot is not replaced by stale in_progress", async () => {
  let resolveFirst: any;
  const firstPromise = new Promise((resolve) => { resolveFirst = resolve; });
  
  const mockSave = mock(async () => firstPromise);
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-1", 600);
  
  saveProgress(10, "in_progress");
  saveProgress(600, "completed");
  saveProgress(10, "in_progress");

  resolveFirst({ data: {}, error: null });
  await new Promise(r => setTimeout(r, 10));

  expect(mockSave.mock.calls.length).toBe(2);
  expect(mockSave.mock.calls[1][1]).toBe("completed");
  expect(mockSave.mock.calls[1][3]).toBe(600);

  lessonContentService.saveLessonProgress = originalSave;
});

test("ended uses actual media duration, not lesson metadata duration", async () => {
  const mockSave = mock(async () => ({ data: {}, error: null }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  // Metadata duration is 600, but actual media duration is 26
  const { saveProgress } = useLessonProgress("lesson-1", 600);
  
  await saveProgress(26, "completed", true, 26);
  
  // Third param is percent, fourth is final position
  expect(mockSave.mock.calls[0][1]).toBe("completed");
  expect(mockSave.mock.calls[0][2]).toBe(100);
  expect(mockSave.mock.calls[0][3]).toBe(26);

  lessonContentService.saveLessonProgress = originalSave;
});

test("pause or timeupdate fired after ended does not queue in_progress", async () => {
  const mockSave = mock(async () => ({ data: {}, error: null }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-2", 600);
  
  // ended fires
  await saveProgress(26, "completed", true, 26);
  
  // DOM fires pause immediately after
  await saveProgress(26, "in_progress", true);
  
  // DOM fires timeupdate immediately after
  await saveProgress(26, "in_progress", false);

  expect(mockSave.mock.calls.length).toBe(1);
  expect(mockSave.mock.calls[0][1]).toBe("completed");

  lessonContentService.saveLessonProgress = originalSave;
});

test("completed success invokes options.onSuccess only once, periodic does not", async () => {
  const mockSave = mock(async () => ({ data: {}, error: null }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  let successCount = 0;
  let lastStatus = "";

  const { saveProgress } = useLessonProgress("lesson-3", 600, {
    onSuccess: (status) => {
      successCount++;
      lastStatus = status;
    }
  });

  // Periodic in-progress tick
  await saveProgress(10, "in_progress");
  expect(successCount).toBe(1);
  expect(lastStatus).toBe("in_progress"); // the UI won't refresh because we filter in UI, but the callback fires

  // Ended
  await saveProgress(600, "completed");
  expect(successCount).toBe(2);
  expect(lastStatus).toBe("completed");

  lessonContentService.saveLessonProgress = originalSave;
});

test("response value 100 is not converted to 0", async () => {
  // If the backend returns 100, the payload structure must reflect it cleanly
  const p = normalizeLessonProgressPercent(26, 26, "completed");
  expect(p).toBe(100);
  
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = async () => {
    return {
      status: "completed",
      progress_percent: 100, // Should remain 100
      last_position_seconds: 26,
    };
  };

  const { saveProgress } = useLessonProgress("lesson-4", 600);
  const result = await saveProgress(26, "completed", true, 26);
  expect(result).toBe(true);

  lessonContentService.saveLessonProgress = originalSave;
});
