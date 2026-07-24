import type { ExpenseTemplate } from "@/types";

const KEY = "expense_templates";

export const getTemplates = (): ExpenseTemplate[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const saveTemplate = (t: Omit<ExpenseTemplate, "id">): ExpenseTemplate => {
  const templates = getTemplates();
  const newTemplate: ExpenseTemplate = { ...t, id: crypto.randomUUID() };
  localStorage.setItem(KEY, JSON.stringify([...templates, newTemplate]));
  return newTemplate;
};

export const deleteTemplate = (id: string): void => {
  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(templates));
};
