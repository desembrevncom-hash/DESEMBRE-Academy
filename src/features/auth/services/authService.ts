const delay = <T>(v: T, ms = 400): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

export const authService = {
  requestOtp: (phone: string) => delay({ ok: true, phone }),
  verifyOtp: (code: string) => delay({ ok: code === "123456" }),
};
