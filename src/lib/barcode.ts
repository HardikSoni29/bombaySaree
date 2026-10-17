import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

// Render Code 128 Barcode onto an SVG or Canvas element
export function renderBarcode(
  element: SVGSVGElement | HTMLCanvasElement | null,
  text: string,
  options: {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    lineColor?: string;
    background?: string;
  } = {}
) {
  if (!element || !text) return;

  try {
    JsBarcode(element, text, {
      format: 'CODE128',
      width: options.width || 2,
      height: options.height || 50,
      displayValue: options.displayValue !== undefined ? options.displayValue : true,
      fontSize: options.fontSize || 14,
      font: 'Courier New',
      textMargin: 4,
      lineColor: options.lineColor || '#171717',
      background: options.background || 'transparent',
    });
  } catch (err) {
    console.error('Barcode generation error:', err);
  }
}

// Global Barcode Scanner Listener Hook for USB/Bluetooth HID Keyboard Scanners
// Scanners type rapid keystrokes within 20-50ms followed by Enter key
export function useBarcodeScanner(onScan: (barcode: string) => void, enabled = true) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in regular text input/textarea unless it's the barcode scanner input
      const target = e.target as HTMLElement;
      const isTargetInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isExplicitScannerInput = target.getAttribute('data-barcode-scanner') === 'true';

      if (isTargetInput && !isExplicitScannerInput) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (bufferRef.current.trim().length >= 4) {
          const scanned = bufferRef.current.trim();
          bufferRef.current = '';
          e.preventDefault();
          onScan(scanned);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // Check if keystroke timing matches a hardware scanner (usually < 50ms)
      // or if accumulating in buffer
      if (timeDiff > 200 && bufferRef.current.length > 0) {
        bufferRef.current = ''; // Reset buffer if typed too slowly manually
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, enabled]);
}
