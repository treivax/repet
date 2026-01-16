/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useRef, useCallback } from 'react';
import {
  LONG_PRESS_DELAY_MS,
  LONG_PRESS_MOVE_THRESHOLD_PX
} from '../core/models/noteConstants';

interface Position {
  x: number;
  y: number;
}

interface UseLongPressOptions {
  /** Callback appelé lors d'un long-press réussi */
  onLongPress: () => void;

  /** Durée minimale en ms (défaut: LONG_PRESS_DELAY_MS) */
  delay?: number;

  /** Seuil de mouvement en px (défaut: LONG_PRESS_MOVE_THRESHOLD_PX) */
  moveThreshold?: number;
}

/**
 * Hook pour détecter un long-press avec annulation sur mouvement
 * Compatible touch et mouse events
 */
export function useLongPress({
  onLongPress,
  delay = LONG_PRESS_DELAY_MS,
  moveThreshold = LONG_PRESS_MOVE_THRESHOLD_PX
}: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const startPosRef = useRef<Position | null>(null);
  const isLongPressRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
    isLongPressRef.current = false;
  }, []);

  const start = useCallback(
    (x: number, y: number) => {
      cancel();
      startPosRef.current = { x, y };
      isLongPressRef.current = false;

      timerRef.current = window.setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, delay);
    },
    [cancel, onLongPress, delay]
  );

  const move = useCallback(
    (x: number, y: number) => {
      if (!startPosRef.current) return;

      const dx = Math.abs(x - startPosRef.current.x);
      const dy = Math.abs(y - startPosRef.current.y);

      // Si mouvement > threshold, annuler le long-press
      if (dx > moveThreshold || dy > moveThreshold) {
        cancel();
      }
    },
    [cancel, moveThreshold]
  );

  const end = useCallback(() => {
    cancel();
  }, [cancel]);

  // Handlers touch
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        start(touch.clientX, touch.clientY);
      }
    },
    [start]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        move(touch.clientX, touch.clientY);
      }
    },
    [move]
  );

  const onTouchEnd = useCallback(() => {
    end();
  }, [end]);

  // Handlers mouse (fallback desktop)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      start(e.clientX, e.clientY);
    },
    [start]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      move(e.clientX, e.clientY);
    },
    [move]
  );

  const onMouseUp = useCallback(() => {
    end();
  }, [end]);

  const onMouseLeave = useCallback(() => {
    end();
  }, [end]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: end,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave
  };
}
