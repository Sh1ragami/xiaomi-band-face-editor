export type Crop = { x: number; y: number; w: number; h: number };

export type BaseLayer = {
  id: string;
  type: 'image' | 'text' | 'rect' | 'circle' | 'clock';
  x: number; y: number;
  scaleX: number; scaleY: number; rotation: number; opacity: number;
  locked: boolean; hidden: boolean;
  brightness: number; contrast: number; saturate: number; grayscale: number;
  name?: string;
  width?: number; height?: number;
};

export type ImageLayer = BaseLayer & { type: 'image'; image?: HTMLImageElement; src?: string; crop?: Crop };
export type TextLayer = BaseLayer & { type: 'text' | 'clock'; text?: string; fontSize?: number; fontWeight?: string; color?: string };
export type RectLayer = BaseLayer & { type: 'rect'; width: number; height: number; fill: string };
export type CircleLayer = BaseLayer & { type: 'circle'; width: number; height: number; fill: string };
export type Layer = ImageLayer | TextLayer | RectLayer | CircleLayer;

export type Asset = { id: string; name: string; image: HTMLImageElement; width: number; height: number; url: string; src: string };

