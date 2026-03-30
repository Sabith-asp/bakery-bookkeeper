export interface User {
  id: string;
  username: string;
  token: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
}

export interface Wage {
  id: string;
  employeeId: string;
  employeeName?: string;
  description?: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  totalWage: number;
  balance: number;
}

export interface IncomeFormData {
  amount: number;
  description: string;
  date: string;
}

export interface ExpenseFormData {
  amount: number;
  description: string;
  category: string;
  date: string;
}

export interface WageFormData {
  employeeId: string;
  description?: string;
  amount: number;
  date: string;
}
