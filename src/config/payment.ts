export function getPaymentConfig() {
  const getEnv = (key: string, fallback: string) => {
    try {
      const metaEnv = (import.meta as any)?.env;
      if (metaEnv && key in metaEnv && metaEnv[key]) return metaEnv[key];
    } catch (_) {}
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
    return fallback;
  };

  return {
    bankName: getEnv("VITE_BANK_NAME", "MB BANK (NH Quân Đội)"),
    accountNumber: getEnv("VITE_BANK_ACCOUNT_NUMBER", "0988776655"),
    accountName: getEnv("VITE_BANK_ACCOUNT_NAME", "CÔNG TY TNHH DESEMBRE VIỆT NAM"),
    supportZalo: getEnv("VITE_PAYMENT_SUPPORT_ZALO", "https://zalo.me"),
  };
}
