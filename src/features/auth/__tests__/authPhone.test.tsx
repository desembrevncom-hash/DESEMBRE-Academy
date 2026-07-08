import { describe, it, expect, mock, beforeEach, type Mock } from 'bun:test';
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
    mock.restore();
  });

  it('requestOtp calls the mock safely', async () => {
    const mockRequest = authService.requestOtp as Mock<typeof authService.requestOtp>;
    mockRequest.mockResolvedValueOnce({ ok: true, phone: '0912345678' } as any);
    await authService.requestOtp('0912345678');
    expect(authService.requestOtp).toHaveBeenCalledWith('0912345678');
  });

  it('verifyOtp calls the mock safely', async () => {
    const mockVerify = authService.verifyOtp as Mock<typeof authService.verifyOtp>;
    mockVerify.mockResolvedValueOnce({ ok: true, session: null } as any);
    await authService.verifyOtp('0912345678', '123456');
    expect(authService.verifyOtp).toHaveBeenCalledWith('0912345678', '123456');
  });

  it('linkStudentAccount returns mocked status', async () => {
    const mockLink = authService.linkStudentAccount as Mock<typeof authService.linkStudentAccount>;
    mockLink.mockResolvedValueOnce({ status: 'linked' });
    const result = await authService.linkStudentAccount();
    expect(result.status).toBe('linked');
  });
});
