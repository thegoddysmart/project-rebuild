export const SIMULATION_CONFIG = {
  APPSN: {
    successRate: 0.85,
    delays: { min: 2000, max: 8000 }, // 2-8 seconds
  },
  PAYSTACK: {
    successRate: 0.92,
    delays: { min: 500, max: 3000 }, // 0.5-3 seconds
  },
  USSD: {
    successRate: 0.65,
    expiryMs: 90000, // 90 seconds
  },
};
