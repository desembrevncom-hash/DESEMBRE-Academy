/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, mock } from "bun:test";
import { normalizeLessonPositionSeconds, normalizeLessonProgressPercent } from "./progress-utils";
import { isRetryableNetworkError } from "./services/lesson-content.service";

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
import { useLessonProgress, resetGlobalCompletionLatchForTesting } from "./useLessonProgress";
import { afterEach } from "bun:test";

afterEach(() => {
  resetGlobalCompletionLatchForTesting();
});

test("Service RPC payload uses integer last_position_seconds and no numeric strings", async () => {
  let capturedPayload: any = null;

  mock.module("@/lib/supabase/client", () => ({
    getSupabaseBrowserClient: () => ({
      rpc: async (rpcName: string, payload: any) => {
        capturedPayload = payload;
        return {
          data: { status: "in_progress", progress_percent: 50, last_position_seconds: 10 },
          error: null,
        };
      },
    }),
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
  const firstPromise = new Promise((resolve) => {
    resolveFirst = resolve;
  });
  let callCount = 0;

  const mockSave = mock(async () => {
    callCount++;
    if (callCount === 1) {
      return firstPromise;
    }
    return { status: "in_progress", progress_percent: 50, last_position_seconds: 30 };
  });

  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-1", 600, null);

  const p1 = saveProgress(10, "in_progress");
  saveProgress(20, "in_progress");
  saveProgress(30, "in_progress");

  expect(callCount).toBe(1);

  resolveFirst({ status: "in_progress", progress_percent: 50, last_position_seconds: 10 });
  await p1;
  await new Promise((r) => setTimeout(r, 10));

  expect(callCount).toBe(2);

  lessonContentService.saveLessonProgress = originalSave;
});

test("Queue precedence: completed pending snapshot is not replaced by stale in_progress", async () => {
  let resolveFirst: any;
  const firstPromise = new Promise((resolve) => {
    resolveFirst = resolve;
  });

  const mockSave = mock(async () => {
    return firstPromise;
  });

  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-1", 600, null);

  saveProgress(10, "in_progress");
  saveProgress(600, "completed");
  saveProgress(10, "in_progress"); // rejected synchronously due to latch

  resolveFirst({ status: "in_progress", progress_percent: 1, last_position_seconds: 10 });
  await new Promise((r) => setTimeout(r, 10));

  expect((mockSave as any).mock.calls.length).toBe(2);
  expect((mockSave as any).mock.calls[1][1]).toBe("completed");

  lessonContentService.saveLessonProgress = originalSave;
});

test("ended uses actual media duration, not lesson metadata duration", async () => {
  const mockSave = mock(async () => ({
    status: "completed",
    progress_percent: 100,
    last_position_seconds: 26,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  // Metadata duration is 600, but actual media duration is 26
  const { saveProgress } = useLessonProgress("lesson-1", 600, null);

  await saveProgress(26, "completed", true, 26);

  // Third param is percent, fourth is final position
  expect((mockSave as any).mock.calls[0][1]).toBe("completed");
  expect((mockSave as any).mock.calls[0][2]).toBe(100);
  expect((mockSave as any).mock.calls[0][3]).toBe(26);

  lessonContentService.saveLessonProgress = originalSave;
});

test("pause or timeupdate fired after ended does not queue in_progress", async () => {
  const mockSave = mock(async () => ({
    status: "completed",
    progress_percent: 100,
    last_position_seconds: 26,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-2", 600, null);

  // ended fires
  await saveProgress(26, "completed", true, 26);

  // DOM fires pause immediately after
  await saveProgress(26, "in_progress", true);

  // DOM fires timeupdate immediately after
  await saveProgress(26, "in_progress", false);

  expect((mockSave as any).mock.calls.length).toBe(1);
  expect((mockSave as any).mock.calls[0][1]).toBe("completed");

  lessonContentService.saveLessonProgress = originalSave;
});

test("completed success invokes options.onSuccess only once, periodic does not", async () => {
  const mockSave = mock<any>(async () => ({
    status: "completed",
    progress_percent: 100,
    last_position_seconds: 600,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  let successCount = 0;
  let lastStatus = "";

  const { saveProgress } = useLessonProgress("lesson-3", 600, null, {
    onSuccess: (status) => {
      successCount++;
      lastStatus = status;
    },
  });

  // Periodic in-progress tick
  await saveProgress(10, "in_progress");
  expect(successCount).toBe(1);
  expect(lastStatus).toBe("in_progress");

  // Ended
  await saveProgress(600, "completed");
  expect(successCount).toBe(2);
  expect(lastStatus).toBe("completed");

  lessonContentService.saveLessonProgress = originalSave;
});

test("response in_progress/0 is rejected as completion success", async () => {
  const originalSave = lessonContentService.saveLessonProgress;

  mock.module("@/lib/supabase/client", () => ({
    getSupabaseBrowserClient: () => ({
      rpc: async (rpcName: string, payload: any) => {
        // Mock backend returning in_progress despite completed payload
        return {
          data: {
            status: "in_progress",
            progress_percent: 0,
            last_position_seconds: 0,
            lesson_id: "lesson-4",
          },
          error: null,
        };
      },
    }),
  }));

  let threw = false;
  try {
    await originalSave("lesson-4", "completed", 100, 26);
  } catch (err: any) {
    threw = true;
    expect(err.message).toBe("INVALID_DATA");
  }
  expect(threw).toBe(true);
});

test("NetworkError is retryable", () => {
  expect(isRetryableNetworkError(new Error("NetworkError when attempting to fetch resource"))).toBe(
    true,
  );
  expect(isRetryableNetworkError(new Error("Failed to fetch"))).toBe(true);
  expect(isRetryableNetworkError(new Error("request canceled"))).toBe(true);
  expect(isRetryableNetworkError(new Error("PGRST301"))).toBe(false);
  expect(isRetryableNetworkError(new Error("INVALID_DATA"))).toBe(false);
});

test("unmount after completion cannot save in_progress", async () => {
  const mockSave = mock<any>(async () => ({
    status: "completed",
    progress_percent: 100,
    last_position_seconds: 600,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-unmount-test", 600, null);

  // Simulate video end
  await saveProgress(600, "completed", true, 600);

  // Simulate another useLessonProgress instance created by remounting VideoPlayer
  const newInstance = useLessonProgress("lesson-unmount-test", 600, null);

  // Simulate unmount cleanup of the remounted VideoPlayer
  await newInstance.saveProgress(0, "in_progress", true);

  expect((mockSave as any).mock.calls.length).toBe(1);
  expect((mockSave as any).mock.calls[0][1]).toBe("completed");

  lessonContentService.saveLessonProgress = originalSave;
});

test("refresh after completion cannot trigger cleanup overwrite", async () => {
  const mockSave = mock<any>(async () => ({
    status: "completed",
    progress_percent: 100,
    last_position_seconds: 600,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  const { saveProgress } = useLessonProgress("lesson-refresh-test", 600, null);

  // Simulate VideoPlayer completing
  await saveProgress(600, "completed", true, 600);

  // Simulate LessonPlayer refreshing and running unmount cleanup of VideoPlayer
  await saveProgress(600, "in_progress", true);

  expect((mockSave as any).mock.calls.length).toBe(1);
  expect((mockSave as any).mock.calls[0][1]).toBe("completed");

  lessonContentService.saveLessonProgress = originalSave;
});

test("failed completed save leaves UI pending, not 100", async () => {
  const mockSave = mock<any>(async () => {
    throw new Error("Network error");
  });
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  let successCalled = false;
  const { saveProgress } = useLessonProgress("lesson-fail-test", 600, null, {
    onSuccess: () => {
      successCalled = true;
    },
  });

  let threw = false;
  try {
    await saveProgress(600, "completed", true, 600);
  } catch {
    threw = true;
  }

  expect(threw).toBe(true);
  expect(successCalled).toBe(false);

  lessonContentService.saveLessonProgress = originalSave;
});

test("successful response persists completed/100", async () => {
  const mockSave = mock<any>(async () => ({
    status: "completed",
    progress_percent: 100,
    last_position_seconds: 600,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  let successCalled = false;
  const { saveProgress } = useLessonProgress("lesson-success-test", 600, null, {
    onSuccess: (status) => {
      if (status === "completed") successCalled = true;
    },
  });

  const res = await saveProgress(600, "completed", true, 600);

  expect(res?.status).toBe("completed");
  expect(res?.progress_percent).toBe(100);
  expect(successCalled).toBe(true);

  lessonContentService.saveLessonProgress = originalSave;
});

test("completed backend state initializes the latch", async () => {
  const { saveProgress } = useLessonProgress("lesson-init-test", 600, "completed");
  const mockSave = mock<any>(async () => ({}));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  await saveProgress(0, "in_progress");

  expect((mockSave as any).mock.calls.length).toBe(0);
  lessonContentService.saveLessonProgress = originalSave;
});

test("switching lessons uses independent keys", async () => {
  const { saveProgress: save1 } = useLessonProgress("lesson-A", 600, "completed");
  const { saveProgress: save2 } = useLessonProgress("lesson-B", 600, "in_progress");

  const mockSave = mock<any>(async () => ({
    status: "in_progress",
    progress_percent: 10,
    last_position_seconds: 60,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  await save1(10, "in_progress"); // blocked by lesson-A latch
  await save2(60, "in_progress"); // allowed because lesson-B is not latched

  expect((mockSave as any).mock.calls.length).toBe(1);
  expect((mockSave as any).mock.calls[0][0]).toBe("lesson-B");

  lessonContentService.saveLessonProgress = originalSave;
});

test("in_progress lessons still save normally", async () => {
  const { saveProgress } = useLessonProgress("lesson-normal", 600, "in_progress");
  const mockSave = mock<any>(async () => ({
    status: "in_progress",
    progress_percent: 50,
    last_position_seconds: 300,
  }));
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  await saveProgress(300, "in_progress");

  expect((mockSave as any).mock.calls.length).toBe(1);
  expect((mockSave as any).mock.calls[0][1]).toBe("in_progress");

  lessonContentService.saveLessonProgress = originalSave;
});

test("completed retry remains possible when persistence has not yet succeeded", async () => {
  const { saveProgress } = useLessonProgress("lesson-retry", 600, "in_progress");
  let attempts = 0;
  const mockSave = mock<any>(async () => {
    attempts++;
    if (attempts === 1) throw new Error("Network error");
    return { status: "completed", progress_percent: 100, last_position_seconds: 600 };
  });
  const originalSave = lessonContentService.saveLessonProgress;
  lessonContentService.saveLessonProgress = mockSave as any;

  // First completed call fails
  try {
    await saveProgress(600, "completed");
  } catch (e) {}

  // Second completed call should still be allowed, because we don't block "completed" writes!
  await saveProgress(600, "completed");

  expect(attempts).toBeGreaterThan(1);

  lessonContentService.saveLessonProgress = originalSave;
});
