/**
 * Pure classification and financial calculation utilities for LocalKart v2
 */

export type ExpiryState = 'ok' | 'expiring_soon' | 'expired';

export function classifyExpiryState(expiryDateStr?: string, now = new Date()): ExpiryState {
  if (!expiryDateStr) return 'ok';
  const expiry = new Date(expiryDateStr);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'expired';
  if (diffDays <= 7) return 'expiring_soon';
  return 'ok';
}

export type CrowdLevel = 'quiet' | 'moderate' | 'busy';

export function classifyCrowdLevel(peopleCount: number): CrowdLevel {
  if (peopleCount < 25) return 'quiet';
  if (peopleCount <= 55) return 'moderate';
  return 'busy';
}

export interface DayClosingResult {
  expectedCash: number;
  countedCash: number;
  difference: number;
  status: 'balanced' | 'short' | 'excess';
}

export function calculateDayClosingDifference(
  expectedCash: number,
  countedCash: number
): DayClosingResult {
  const difference = countedCash - expectedCash;
  let status: 'balanced' | 'short' | 'excess' = 'balanced';
  if (difference < 0) status = 'short';
  else if (difference > 0) status = 'excess';

  return {
    expectedCash,
    countedCash,
    difference,
    status,
  };
}

export interface ProfitAndLossResult {
  sales: number;
  costOfGoods: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  marginPct: number;
}

export function calculateProfitAndLoss(
  sales: number,
  costOfGoods: number,
  expenses: number
): ProfitAndLossResult {
  const grossProfit = sales - costOfGoods;
  const netProfit = grossProfit - expenses;
  const marginPct = sales > 0 ? Math.round((netProfit / sales) * 100) : 0;

  return {
    sales,
    costOfGoods,
    expenses,
    grossProfit,
    netProfit,
    marginPct,
  };
}

export function calculateGroupOrderFee(
  baseFee: number,
  joined: number,
  target = 5,
  minFee = 10
): number {
  if (joined <= 1) return baseFee;
  // Progressively reduce fee as more neighbours join
  const discountFactor = Math.min(1, (joined - 1) / (target - 1));
  const fee = Math.round(baseFee - discountFactor * (baseFee - minFee));
  return Math.max(minFee, fee);
}
