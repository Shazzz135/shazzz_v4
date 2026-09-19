declare module 'react-pixel-text-renderer' {
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
