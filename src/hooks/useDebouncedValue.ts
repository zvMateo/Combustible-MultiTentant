/**
 * Hook para debounce de valores
 *
 * Útil para optimizar búsquedas y filtros que disparan en cada keystroke
 * Principio: Single Responsibility - Solo maneja debounce
 */
import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedState<T>(
  initialValue: T,
  delay = 300
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebouncedValue(value, delay);

  return [value, debouncedValue, setValue];
}
