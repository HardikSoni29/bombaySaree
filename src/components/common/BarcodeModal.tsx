import React, { useEffect, useRef } from 'react';
import { InventoryItem } from '../../types/database';
import { renderBarcode } from '../../lib/barcode';
import { formatINR } from '../../lib/utils';
import { X, Printer, Tag, ShieldCheck } from 'lucide-react';

interface BarcodeModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ item, onClose }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (item && svgRef.current) {
      renderBarcode(svgRef.current, item.barcode, {
        width: 2.2,
        height: 60,
        displayValue: true,
        fontSize: 15,
      });
    }
  }, [item]);

  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-ivory-300 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-burgundy-900 text-ivory-50 px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-lg font-semibold tracking-wide">Physical Saree Barcode Tag</h3>
          </div>
          <button
            onClick={onClose}
            className="text-ivory-300 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full border-2 border-dashed border-charcoal-300 rounded-lg p-5 bg-ivory-50 text-center relative print:border-solid print:border-black print:p-2">
            <div className="flex items-center justify-between border-b border-ivory-300 pb-2 mb-3">
              <span className="font-brand text-xs font-bold tracking-widest text-burgundy-900 uppercase">
                Bombay Saree Studio
              </span>
              <span className="text-[10px] text-charcoal-500 uppercase tracking-wider font-mono">
                {item.location?.code || 'BS-STORE'}
              </span>
            </div>

            <h4 className="font-serif text-base font-bold text-charcoal-900 mb-1 leading-snug line-clamp-2">
              {item.product?.name}
            </h4>

            <div className="text-xs text-charcoal-600 mb-2 font-mono flex items-center justify-center gap-2">
              <span>SKU: {item.product?.sku}</span>
              <span>•</span>
              <span className="text-burgundy-800 font-semibold">{item.product?.fabric}</span>
            </div>

            {/* Scannable Code 128 Barcode */}
            <div className="my-3 py-2 bg-white rounded border border-ivory-200 flex justify-center items-center overflow-x-auto">
              <svg ref={svgRef} className="max-w-full"></svg>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-ivory-300">
              <div className="text-left">
                <span className="text-[10px] uppercase text-charcoal-400 block font-semibold tracking-wider">
                  Ownership
                </span>
                <span className={`text-[11px] font-semibold ${
                  item.ownership_type === 'designer_consignment' ? 'text-burgundy-800' : 'text-emerald-700'
                }`}>
                  {item.ownership_type === 'designer_consignment'
                    ? `Consignment: ${item.designer?.brand_name || 'Designer'}`
                    : 'Bombay Saree Owned'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase text-charcoal-400 block font-semibold">
                  Studio Price
                </span>
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className="text-sm line-through text-charcoal-400">
                    {formatINR(item.product?.mrp)}
                  </span>
                  <span className="text-lg font-bold text-burgundy-950 font-serif">
                    {formatINR(item.product?.price)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[9px] text-charcoal-400 border-t border-dotted border-charcoal-200 flex items-center justify-between">
              <span>Piece ID: {item.id}</span>
              <span className="flex items-center gap-1 text-gold-700 font-medium">
                <ShieldCheck className="w-3 h-3" /> Silk Mark Certified
              </span>
            </div>
          </div>

          <p className="text-xs text-charcoal-500 mt-4 text-center no-print">
            Every physical saree receives its own unique Code 128 barcode label.
            Compatible with any USB or Bluetooth laser scanner.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="bg-ivory-100 px-5 py-3 border-t border-ivory-300 flex items-center justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-charcoal-700 hover:bg-ivory-200 transition font-medium"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-burgundy-800 hover:bg-burgundy-900 text-gold-300 text-sm font-semibold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print Barcode Label
          </button>
        </div>
      </div>
    </div>
  );
};
