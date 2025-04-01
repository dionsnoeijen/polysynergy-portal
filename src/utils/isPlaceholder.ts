export function isPlaceholder(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\{[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)?\}$/.test(value)
  );
}