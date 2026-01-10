/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { useUIStore } from '../../state/uiStore';

/**
 * Composant Toast - Affiche les notifications
 */
export function Toast() {
  const errors = useUIStore((state) => state.errors);
  const removeError = useUIStore((state) => state.removeError);

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {errors.map((error) => (
        <div
          key={error.id}
          className="min-w-[300px] rounded-lg bg-white p-4 shadow-lg border-l-4 border-red-500"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-900">{error.message}</p>
            </div>
            <button
              onClick={() => removeError(error.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
