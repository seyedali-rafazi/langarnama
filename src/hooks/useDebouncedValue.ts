import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
