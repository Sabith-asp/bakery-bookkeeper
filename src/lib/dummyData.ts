import type { Income, Expense, Wage } from "@/types";

export const dummyIncomes: Income[] = [
  { id: "1", amount: 4500, description: "Oven repair - Hotel Grand", date: "2026-02-21", createdAt: "2026-02-21" },
  { id: "2", amount: 2200, description: "Mixer servicing - Cake Palace", date: "2026-02-21", createdAt: "2026-02-21" },
  { id: "3", amount: 8000, description: "Full kitchen maintenance - Star Bakery", date: "2026-02-20", createdAt: "2026-02-20" },
  { id: "4", amount: 1500, description: "Dough sheeter belt replacement", date: "2026-02-20", createdAt: "2026-02-20" },
  { id: "5", amount: 3500, description: "Proofer thermostat fix", date: "2026-02-19", createdAt: "2026-02-19" },
  { id: "6", amount: 12000, description: "Annual maintenance contract - Royal Bakes", date: "2026-02-18", createdAt: "2026-02-18" },
  { id: "7", amount: 6000, description: "Deck oven burner repair", date: "2026-02-17", createdAt: "2026-02-17" },
];

export const dummyExpenses: Expense[] = [
  { id: "1", amount: 1200, description: "Thermostat spare parts", category: "Parts", date: "2026-02-21", createdAt: "2026-02-21" },
  { id: "2", amount: 500, description: "Auto rickshaw to client site", category: "Transport", date: "2026-02-21", createdAt: "2026-02-21" },
  { id: "3", amount: 3500, description: "Compressor motor unit", category: "Parts", date: "2026-02-20", createdAt: "2026-02-20" },
  { id: "4", amount: 800, description: "Multimeter & tools", category: "Tools", date: "2026-02-19", createdAt: "2026-02-19" },
  { id: "5", amount: 2200, description: "Electricity bill - workshop", category: "Utilities", date: "2026-02-18", createdAt: "2026-02-18" },
  { id: "6", amount: 350, description: "Printing service invoices", category: "Office", date: "2026-02-17", createdAt: "2026-02-17" },
];

export const dummyWages: Wage[] = [
  { id: "1", employeeId: "1", employeeName: "Rahul Kumar", description: "Daily wage", amount: 800, date: "2026-02-21", createdAt: "2026-02-21" },
  { id: "2", employeeId: "2", employeeName: "Suresh Patel", description: "Service helper", amount: 750, date: "2026-02-21", createdAt: "2026-02-21" },
  { id: "3", employeeId: "3", employeeName: "Amit Singh", description: "Maintenance support", amount: 900, date: "2026-02-20", createdAt: "2026-02-20" },
  { id: "4", employeeId: "1", employeeName: "Rahul Kumar", description: "Daily wage", amount: 800, date: "2026-02-19", createdAt: "2026-02-19" },
  { id: "5", employeeId: "4", employeeName: "Deepak Sharma", description: "Field assistant", amount: 700, date: "2026-02-18", createdAt: "2026-02-18" },
];

export function filterByDate<T extends { date: string }>(items: T[], startDate?: string, endDate?: string): T[] {
  return items.filter((item) => {
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    return true;
  });
}
