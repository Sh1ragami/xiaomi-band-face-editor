import { useCallback } from 'react';
import type { Layer, TextLayer } from '@/shared/types';

type MeasureFn = (text?: string, fontSize?: number, fontWeight?: string) => { width: number; height: number };

export default function useLayers(
  layers: Layer[],
  setLayers: (updater: (prev: Layer[]) => Layer[]) => void,
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
  measureTextBox: MeasureFn,
  recordHistory: () => void
) {

  const addLayer = useCallback((props: Partial<Layer>) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let width = props.width ?? 0;
    let height = props.height ?? 0;
    if ((props.type === 'text' || props.type === 'clock')) {
      const { width: w, height: h } = measureTextBox((props as TextLayer).text || '', (props as TextLayer).fontSize ?? 48, (props as TextLayer).fontWeight ?? '700');
      width = w; height = h;
    }
    const newLayer: Layer = {
      id,
      type: (props.type ?? 'image') as Layer['type'],
      x: props.x ?? 0,
      y: props.y ?? 0,
      scaleX: props.scaleX ?? 1,
      scaleY: props.scaleY ?? 1,
      rotation: props.rotation ?? 0,
      opacity: props.opacity ?? 1,
      locked: props.locked ?? false,
      hidden: props.hidden ?? false,
      brightness: props.brightness ?? 100,
      contrast: props.contrast ?? 100,
      saturate: props.saturate ?? 100,
      grayscale: props.grayscale ?? 0,
      name: props.name,
      width,
      height,
      ...(props as object),
    } as Layer;
    setLayers(prev => { const next = [...prev, newLayer]; setTimeout(recordHistory, 0); return next; });
    setSelectedId(id);
  }, [measureTextBox, recordHistory, setLayers, setSelectedId]);

  const updateLayer = useCallback((id: string, patch: Partial<Layer>, save = false) => {
    setLayers(prev => {
      const next = prev.map(l => {
        if (l.id !== id) return l;
        const merged = { ...l, ...patch } as Layer;
        if ((merged.type === 'text' || merged.type === 'clock') && ('text' in patch || 'fontSize' in patch || 'fontWeight' in patch)) {
          const mb = measureTextBox((merged as TextLayer).text || '', (merged as TextLayer).fontSize ?? 48, (merged as TextLayer).fontWeight ?? '700');
          merged.width = mb.width; merged.height = mb.height;
        }
        return merged;
      });
      if (save) setTimeout(recordHistory, 0);
      return next;
    });
  }, [measureTextBox, recordHistory]);

  const updateSelected = useCallback((patch: Partial<Layer>, save = false) => { if (selectedId) updateLayer(selectedId, patch, save); }, [selectedId, updateLayer]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setLayers(prev => { const next = prev.filter(l => l.id !== selectedId); setTimeout(recordHistory, 0); return next; });
    setSelectedId(null);
  }, [selectedId, recordHistory]);

  const reorder = useCallback((draggingId: string | null, targetId: string) => {
    if (!draggingId) return;
    setLayers(prev => {
      const view = prev.slice().reverse();
      const fromRev = view.findIndex(l => l.id === draggingId);
      const toRev = view.findIndex(l => l.id === targetId);
      if (fromRev === -1 || toRev === -1 || fromRev === toRev) return prev;
      const from = prev.length - 1 - fromRev;
      const to = prev.length - 1 - toRev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setTimeout(recordHistory, 0);
      return next;
    });
  }, [recordHistory]);

  return { addLayer, updateLayer, updateSelected, deleteSelected, reorder } as const;
}
