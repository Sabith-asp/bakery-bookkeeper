export interface User {
  id: string;
  username: string;
  token: string;
  role: string;
  organizationId: string | null;
  organizationName: string;
  enabledModules: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  hasModule: (module: string) => boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

export interface NotificationSettings {
  orgId: string;
  dailyReminderEnabled: boolean;
  reminderHour: number;
  weeklySummaryEnabled: boolean;
  budgetAlertsEnabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  enabledModules: string[];
}

export interface OrgUser {
  id: string;
  username: string;
  role: string;
}

export interface Division {
  id: string;
  name: string;
  createdAt: string;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  paymentMethod?: string;
  divisionId?: string;
  divisionName?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  paymentMethod?: string;
  divisionId?: string;
  divisionName?: string;
}

export interface Wage {
  id: string;
  employeeId: string;
  employeeName?: string;
  description?: string;
  amount: number;
  date: string;
  createdAt: string;
  paymentMethod?: string;
  divisionId?: string;
  divisionName?: string;
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

export interface TrendDataPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  wage: number;
}

export interface Debt {
  id: string;
  organizationId: string;
  personName: string;
  amount: number;
  type: "Payable" | "Receivable";
  date: string;
  dueDate?: string;
  notes?: string;
  isSettled: boolean;
  createdAt: string;
  paidAmount: number;
  outstandingAmount: number;
  payments?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface DebtFormData {
  personName: string;
  amount: number;
  type: "Payable" | "Receivable";
  date: string;
  dueDate?: string;
  notes?: string;
}

export interface DebtPaymentFormData {
  amount: number;
  date: string;
  notes?: string;
}

export interface EmployeeWageSummary {
  employeeId: string;
  employeeName: string;
  recordCount: number;
  totalAmount: number;
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
  paymentMethod?: string;
  divisionId?: string;
}

export interface ExpenseFormData {
  amount: number;
  description: string;
  category: string;
  date: string;
  paymentMethod?: string;
  divisionId?: string;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  amount?: number;
  paymentMethod?: string;
}

export interface WageFormData {
  employeeId: string;
  description?: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  divisionId?: string;
}

export interface ProductCategory {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockAlert?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  organizationId: string;
  productId: string;
  productName?: string;
  productUnit?: string;
  type: "Purchase" | "Sale";
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplierOrCustomer?: string;
  paymentMethod?: string;
  divisionId?: string;
  divisionName?: string;
  note?: string;
  date: string;
  createdAt: string;
}

export interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  todaySalesAmount: number;
  todaySalesCount: number;
}

export interface ProductFormData {
  categoryId?: string;
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  lowStockAlert?: number;
}

export interface StockTransactionFormData {
  productId: string;
  type: "Purchase" | "Sale";
  quantity: number;
  unitPrice: number;
  supplierOrCustomer?: string;
  paymentMethod?: string;
  divisionId?: string;
  note?: string;
  date: string;
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'InProgress' | 'Completed';
export type TaskVisibility = 'Personal' | 'Organisation';
export type TaskActivityType =
  | 'Created' | 'StatusChanged' | 'Completed' | 'DateMoved'
  | 'CarryForward' | 'CommentAdded' | 'Updated' | 'VisibilityChanged'
  | 'PriorityChanged';

export interface Task {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByUsername: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  visibility: TaskVisibility;
  originalTargetDate: string;
  currentTargetDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  activityLog?: TaskActivity[];
}

export interface TaskActivity {
  id: string;
  taskId: string;
  performedByUserId: string;
  performedByUsername: string;
  activityType: TaskActivityType;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  createdAt: string;
}

export interface DailyNote {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByUsername: string;
  noteDate: string;
  content: string;
  visibility: TaskVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  visibility: TaskVisibility;
  currentTargetDate: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
}

export interface TaskSummary {
  todayCount: number;
  overdueCount: number;
}

// ── Prayer Module ────────────────────────────────────────────────────────────

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerStatus =
  | 'Upcoming'
  | 'ReminderSent'
  | 'Pending'
  | 'CompletedOnTime'
  | 'CompletedLate'
  | 'Missed'
  | 'Excused'
  | 'QadaCompleted'
  | 'Skipped';

export interface PrayerRecord {
  id: string;
  organizationId: string;
  userId: string;
  username: string;
  prayerName: PrayerName;
  prayerDate: string;
  prayerTime: string;    // "HH:MM:SS"
  prayerEndTime: string;
  actualCompletionTime?: string;
  status: PrayerStatus;
  congregationType?: string;
  updatedByUsername?: string;
  notes?: string;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface PrayerStreak {
  id: string;
  organizationId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate?: string;
  totalPrayersCompleted: number;
  totalPrayersOnTime: number;
  lastUpdatedAt: string;
}

export interface PrayerOrgSettings {
  id: string;
  organizationId: string;
  latitude: number;
  longitude: number;
  timezone: string;
  calculationMethod: string;
  asrMethod: string;
  fajrAngle: number;
  ishaAngle: number;
}

export interface PrayerUserSettings {
  id: string;
  organizationId: string;
  userId: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  cityName?: string;
}

export interface PrayerDashboardResponse {
  todayDate: string;
  todayDay: string;
  completedCount: number;
  pendingCount: number;
  missedCount: number;
  excusedCount: number;
  totalPrayers: number;
  completionPercentage: number;
  currentPrayer?: PrayerName;
  nextPrayer?: PrayerName;
  nextPrayerTime?: string;
  minutesToNextPrayer?: number;
  streak?: PrayerStreak;
  prayers: PrayerRecord[];
  orgSettings?: PrayerOrgSettings;
}

export interface PrayerHistoryDay {
  date: string;
  completedCount: number;
  totalCount: number;
  prayers: PrayerRecord[];
}

export interface PrayerReminderConfig {
  id: string;
  organizationId: string;
  userId: string;
  prayerName: string;
  reminderType: string;
  minutesOffset: number;
  isEnabled: boolean;
}

export interface PrayerAdminSummary {
  date: string;
  totalUsers: number;
  totalPossiblePrayers: number;
  totalCompleted: number;
  totalMissed: number;
  totalPending: number;
  orgCompletionRate: number;
  userStats: PrayerUserStat[];
  prayerStats: PrayerNameStat[];
}

export interface PrayerUserStat {
  userId: string;
  username: string;
  completedToday: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalPrayersCompleted: number;
}

export interface PrayerNameStat {
  prayerName: string;
  completedCount: number;
  missedCount: number;
  pendingCount: number;
  completionRate: number;
}
