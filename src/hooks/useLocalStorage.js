import { useState, useEffect } from 'react';

function resolveValidatedValue(value, initialValue, validate) {
  if (typeof validate !== 'function') return value;
  const next = validate(value);
  return next === undefined ? initialValue : next;
}

export function useLocalStorage(key, initialValue, options = {}) {
  const { validate } = options;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValue;
      return resolveValidatedValue(parsed, initialValue, validate);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToPersist = resolveValidatedValue(storedValue, initialValue, validate);
      window.localStorage.setItem(key, JSON.stringify(valueToPersist));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [initialValue, key, storedValue, validate]);

  return [storedValue, setStoredValue];
}
