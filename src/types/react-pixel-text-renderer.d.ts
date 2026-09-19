declare module 'react-pixel-text-renderer' {
  import { ReactNode } from 'react';

  interface TextRendererProps {
    bgColor?: string;
    color?: [number, number, number] | string;
    text: string;
    scale?: number;
    charSpaces?: number;
    animate?: boolean;
  }

  const TextRenderer: React.FC<TextRendererProps>;
  export default TextRenderer;
}
