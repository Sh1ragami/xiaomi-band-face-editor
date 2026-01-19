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
  type: 'image' | 'text' | 'rect' | 'circle' | 'clock' | 'triangle' | 'line' | 'arrow' | 'star' | 'diamond' | 'polygon';
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
  fontFamily?: string;
  color?: string;
  curve?: TextCurveSettings;
};
export type RectLayer = BaseLayer & { type: 'rect'; width: number; height: number; fill: string; cornerRadius?: number; stroke?: StrokeSettings };
export type CircleLayer = BaseLayer & { type: 'circle'; width: number; height: number; fill: string; stroke?: StrokeSettings };
export type TriangleLayer = BaseLayer & { type: 'triangle'; width: number; height: number; fill: string; stroke?: StrokeSettings };
export type LineLayer = BaseLayer & { type: 'line'; width: number; height: number; fill: string; rounded?: boolean; stroke?: StrokeSettings };
export type PolygonLayer = BaseLayer & { type: 'polygon'; width: number; height: number; fill: string; sides: number; stroke?: StrokeSettings };
export type ArrowLayer = BaseLayer & { type: 'arrow'; width: number; height: number; fill: string; headRatio?: number; shaftRatio?: number; stroke?: StrokeSettings };
export type StarLayer = BaseLayer & { type: 'star'; width: number; height: number; fill: string; points?: number; innerRatio?: number; stroke?: StrokeSettings };
export type DiamondLayer = BaseLayer & { type: 'diamond'; width: number; height: number; fill: string; cornerRadius?: number; stroke?: StrokeSettings };
export type Layer = ImageLayer | TextLayer | RectLayer | CircleLayer | TriangleLayer | LineLayer | ArrowLayer | StarLayer | DiamondLayer | PolygonLayer;

export type Asset = { id: string; name: string; image: HTMLImageElement; width: number; height: number; url: string; src: string };
