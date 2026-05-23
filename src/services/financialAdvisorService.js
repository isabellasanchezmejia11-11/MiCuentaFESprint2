import { authFetch } from './authService';

function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export async function getFinancialAdvice({ month, year } = {}) {
  const resolved = getCurrentMonthYear();
  const params = new URLSearchParams({
    month: String(month || resolved.month),
    year: String(year || resolved.year),
  });

  return authFetch(`/ai/financial-advice?${params.toString()}`, {
    method: 'GET',
  });
}
