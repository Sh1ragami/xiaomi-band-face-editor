import { useState } from 'react';

export default function useHistory(max = 50) {
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState<number>(-1);

  const push = (state: string) => {
    const sliced = history.slice(0, index + 1);
    sliced.push(state);
    const limited = sliced.length > max ? sliced.slice(sliced.length - max) : sliced;
    setHistory(limited);
    setIndex(limited.length - 1);
  };

  const undo = (): string | null => {
    if (index > 0) {
      const nextIdx = index - 1;
      setIndex(nextIdx);
      return history[nextIdx];
    }
    return null;
  };

  const redo = (): string | null => {
    if (index < history.length - 1) {
      const nextIdx = index + 1;
      setIndex(nextIdx);
      return history[nextIdx];
    }
    return null;
  };

  return {
    history,
    index,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    push,
    undo,
    redo,
  } as const;
}

