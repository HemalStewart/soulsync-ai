export const parseDelimitedList = (value?: string | null): string[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // best effort fall-through to manual parsing
  }

  return value
    .split(/[,|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};
