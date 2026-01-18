export type Crop = { x: number; y: number; w: number; h: number };

export type ShadowSettings = {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
};

export type StrokeSettings = {
  enabled: boolean;
  color: string;
  width: number;
};

export type TextCurveSettings = {
  enabled: boolean;
  radius: number; // radius of the circle
  spacing: number; // letter spacing
};

export type BaseLayer = {
  id: string;
  type: 'image' | 'text' | 'rect' | 'circle' | 'clock';
  x: number; y: number;
  scaleX: number; scaleY: number; rotation: number; opacity: number;
  locked: boolean; hidden: boolean;
  brightness: number; contrast: number; saturate: number; grayscale: number;
  name?: string;
  width?: number; height?: number;
  shadow?: ShadowSettings;
  stroke?: StrokeSettings;
};

export type ImageLayer = BaseLayer & { type: 'image'; image?: HTMLImageElement; src?: string; crop?: Crop };
export type TextLayer = BaseLayer & { 
  type: 'text' | 'clock'; 
  text?: string; 
  fontSize?: number; 
  fontWeight?: string; 
  color?: string;
  curve?: TextCurveSettings;
};
export type RectLayer = BaseLayer & { type: 'rect'; width: number; height: number; fill: string; stroke?: StrokeSettings };
export type CircleLayer = BaseLayer & { type: 'circle'; width: number; height: number; fill: string; stroke?: StrokeSettings };
export type Layer = ImageLayer | TextLayer | RectLayer | CircleLayer;

export type Asset = { id: string; name: string; image: HTMLImageElement; width: number; height: number; url: string; src: string };