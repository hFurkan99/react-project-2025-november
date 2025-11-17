const SHIFT_COLORS: Record<string, string> = {
  Morning: "#98d6f1ff",
  Night: "#374151",
};

export const STAFF_COLORS = [
  "#FF6B6B",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#84CC16",
  "#EF4444",
  "#A855F7",
  "#22D3EE",
  "#F43F5E",
  "#6366F1",
  "#06B6D4",
  "#D946EF",
  "#10B981",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
] as const;

export const COLOR_CLASSES = [
  "color-1",
  "color-2",
  "color-3",
  "color-4",
  "color-5",
  "color-6",
  "color-7",
  "color-8",
  "color-9",
  "color-10",
  "color-11",
  "color-12",
  "color-13",
  "color-14",
  "color-15",
  "color-16",
  "color-17",
  "color-18",
  "color-19",
  "color-20",
] as const;

const hashString = (str: string): number => {
  return str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

const getColorIndex = (id: string): number => {
  const hash = hashString(id);
  return hash % STAFF_COLORS.length;
};

export const getStaffColor = (staffId: string): string => {
  const index = getColorIndex(staffId);
  return STAFF_COLORS[index];
};

export const getShiftColor = (shiftName: string): string => {
  return SHIFT_COLORS[shiftName] || "#6B7280";
};

export const getStaffColorClass = (staffId: string): string => {
  const index = getColorIndex(staffId);
  return COLOR_CLASSES[index];
};

export const getDiagonalGradient = (
  shiftName: string,
  staffId: string
): string => {
  const shiftColor = getShiftColor(shiftName);
  const staffColor = getStaffColor(staffId);
  return `linear-gradient(135deg, ${shiftColor} 0%, ${shiftColor} 48%, ${staffColor} 52%, ${staffColor} 100%)`;
};
