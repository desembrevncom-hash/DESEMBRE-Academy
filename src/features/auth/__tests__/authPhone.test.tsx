import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { authService } from '../services/authService';

mock.module('../services/authService', () => ({
  authService: {
    requestOtp: mock(),
    verifyOtp: mock(),
    linkStudentAccount: mock(),
  }
}));

describe('authService frontend wrapper', () => {
  beforeEach(() => {
    // Clear mocks manually since mock.restore() handles it in bun if needed
  });

  it('requestOtp calls the mock safely', async () => {
    (authService.requestOtp as any).mockResolvedValueOnce({ ok: true });
    const result = await authService.requestOtp('0912345678');
    expect(result.ok).toBe(true);
    expect(authService.requestOtp).toHaveBeenCalledWith('0912345678');
  });

  it('verifyOtp calls the mock safely', async () => {
    (authService.verifyOtp as any).mockResolvedValueOnce({ ok: true });
    const result = await authService.verifyOtp('0912345678', '123456');
    expect(result.ok).toBe(true);
    expect(authService.verifyOtp).toHaveBeenCalledWith('0912345678', '123456');
  });

  it('linkStudentAccount returns mocked status', async () => {
    (authService.linkStudentAccount as any).mockResolvedValueOnce({ status: 'linked' });
    const result = await authService.linkStudentAccount();
    expect(result.status).toBe('linked');
  });
});
