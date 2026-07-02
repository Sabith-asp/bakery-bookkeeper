export const TASK_CATEGORIES = [
  'Work', 'Personal', 'Learning', 'Meetings', 'Follow-up', 'Ideas', 'Admin',
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];
