import React, { useState, useRef, useEffect } from 'react';
import { BombayDataStore } from '../../lib/storage';
import { InventoryItem, Product } from '../../types/database';
import { renderBarcode } from '../../lib/barcode';
import { formatINR, getProductImage, FALLBACK_SAREE_IMAGE } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import {
  X,
  Barcode,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  Eye,
  Printer,
  Sparkles,
  MapPin,
  Tag,
  Search,
} from 'lucide-react';

interface BarcodeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const BarcodeVerificationModal: React.FC<BarcodeVerificationModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { addToCart } = useCart();
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [verifiedItem, setVerifiedItem] = useState<InventoryItem | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const inventory = BombayDataStore.getInventoryItems();
  const sampleBarcodes = inventory.slice(0, 5);

  // Render barcode SVG when item verified
  useEffect(() => {
    if (verifiedItem && svgRef.current) {
      renderBarcode(svgRef.current, verifiedItem.barcode, {
        width: 2.2,
        height: 55,
        displayValue: true,
        fontSize: 14,
        lineColor: '#330812',
      });
    }
  }, [verifiedItem]);

  // Clean up camera stream on close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  const startCamera = async () => {
    setVerificationError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setVerificationError('Camera access not supported on this device/browser.');
      }
    } catch (err: any) {
      console.warn('Camera error or permission denied:', err);
      setVerificationError('Unable to access camera. Please enter barcode number manually.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleVerify = (barcodeToVerify: string) => {
    const cleanCode = barcodeToVerify.trim().toUpperCase();
    if (!cleanCode) return;

    const found = inventory.find(
      (item) => item.barcode.toUpperCase() === cleanCode
    );

    if (found) {
      setVerifiedItem(found);
      setVerificationError(null);
      stopCamera();
    } else {
      setVerifiedItem(null);
      setVerificationError(
        `Barcode "${cleanCode}" is not registered in Bombay Saree studio vault.`
      );
    }
  };

  const handleSimulateScan = (code: string) => {
    setBarcodeInput(code);
    handleVerify(code);
  };

  const handleAddVerifiedToCart = () => {
    if (!verifiedItem || !verifiedItem.product) return;
    const res = addToCart(verifiedItem.product);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-gold-500/30 overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Modal Header: 30% Royal Burgundy */}
        <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 px-6 py-5 text-white flex items-center justify-between border-b border-gold-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-400/30">
              <Barcode className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold-400 font-bold block">
                Omnichannel Authentication
              </span>
              <h3 className="font-serif text-xl font-bold text-ivory-50 leading-tight">
                Saree Barcode & Provenance Verifier
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-ivory-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 60% Ivory Canvas */}
        <div className="p-6 overflow-y-auto space-y-6 bg-[#FAF8F5]">
          {/* Instructions */}
          <p className="text-xs text-charcoal-600 font-light leading-relaxed">
            Every physical saree in our Kala Ghoda flagship studio carries an individual Code 128 barcode tag. Scan the tag using your camera or enter the barcode below to inspect weave ancestry, Govt. Silk Mark authenticity, and single-loom provenance.
          </p>

          {/* Camera Scanner Viewfinder */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-charcoal-950 border-2 border-gold-500 aspect-video flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Laser Reticle */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
              <div className="absolute top-3 left-3 bg-charcoal-900/80 text-gold-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-gold-500/40">
                Align physical barcode in center
              </div>
              <button
                onClick={stopCamera}
                className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 text-charcoal-900 rounded-lg text-xs font-semibold hover:bg-white transition"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={startCamera}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-burgundy-950 font-serif text-xs font-semibold border border-ivory-300 transition shadow-sm w-full"
              >
                <Camera className="w-4 h-4 text-burgundy-900" />
                <span>Open Device Camera Scanner</span>
              </button>
            </div>
          )}

          {/* Barcode Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(barcodeInput);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Enter Barcode (e.g., BS-KAN-001)..."
                className="w-full bg-white border border-ivory-300 rounded-xl py-3 pl-10 pr-4 text-xs font-mono font-medium text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 shadow-sm"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3.5" />
            </div>
            {/* 10% Gold Accent CTA */}
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-burgundy-950 font-serif font-bold text-xs tracking-wider shadow-md transition"
            >
              Verify
            </button>
          </form>

          {/* Quick Demo Barcode Pills */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-500 block mb-2 font-semibold">
              Tap to Test In-Store Barcodes:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleBarcodes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSimulateScan(item.barcode)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-ivory-300 hover:border-gold-500 text-[11px] font-mono text-charcoal-700 hover:text-burgundy-900 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3 text-gold-600" />
                  <span>{item.barcode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Verification Error */}
          {verificationError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          {/* Verified Piece Provenance Card */}
          {verifiedItem && verifiedItem.product && (
            <div className="bg-white rounded-2xl border-2 border-gold-500/50 p-5 shadow-luxury space-y-4 animate-fadeIn">
              {/* Seal Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-ivory-200">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Certified Studio Piece Verified</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-serif font-bold bg-gold-500/20 text-gold-800 border border-gold-400/40 uppercase tracking-wider">
                  Silk Mark Genuine
                </span>
              </div>

              {/* Product Info */}
              <div className="flex gap-4 items-start">
                <img
                  src={getProductImage(verifiedItem.product)}
                  alt={verifiedItem.product.name}
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (t.src !== FALLBACK_SAREE_IMAGE) t.src = FALLBACK_SAREE_IMAGE;
                  }}
                  className="w-20 h-24 object-cover rounded-xl shadow-sm border border-ivory-200 flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold-700 font-semibold block">
                    {verifiedItem.product.fabric} • {verifiedItem.product.occasion}
                  </span>
                  <h4 className="font-serif text-base font-bold text-burgundy-950 mt-0.5 leading-snug">
                    {verifiedItem.product.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-serif text-lg font-bold text-burgundy-950">
                      {formatINR(verifiedItem.product.price)}
                    </span>
                    <span className="text-xs text-charcoal-400 line-through">
                      {formatINR(verifiedItem.product.mrp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scannable Barcode SVG */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-ivory-200 flex flex-col items-center justify-center">
                <svg ref={svgRef} className="max-w-full" />
                <span className="text-[10px] text-charcoal-500 font-mono mt-1">
                  Code 128 Studio Physical Tag
                </span>
              </div>

              {/* Loom Details & Location */}
              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                <div className="p-2.5 bg-ivory-50 rounded-lg border border-ivory-200">
                  <span className="text-charcoal-400 text-[10px] block font-mono">Location Vault</span>
                  <span className="font-semibold text-charcoal-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-burgundy-800" />
                    <span>{verifiedItem.location?.name || 'Kala Ghoda Studio'}</span>
                  </span>
                </div>
                <div className="p-2.5 bg-ivory-50 rounded-lg border border-ivory-200">
                  <span className="text-charcoal-400 text-[10px] block font-mono">Provenance Type</span>
                  <span className="font-semibold text-charcoal-800 block mt-0.5 truncate">
                    {verifiedItem.ownership_type === 'designer_consignment'
                      ? verifiedItem.designer?.brand_name || 'Designer Atelier'
                      : 'Bombay Saree Vault'}
                  </span>
                </div>
              </div>

              {/* Added Feedback */}
              {addedSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Added this exact physical piece to your shopping bag!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddVerifiedToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-burgundy-950 font-serif font-bold text-xs tracking-wider shadow-md hover:shadow-lg transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add This Piece to Bag</span>
                </button>

                {onSelectProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      if (verifiedItem.product) {
                        onSelectProduct(verifiedItem.product);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-semibold transition"
                    title="View Full Drape Specifications"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-ivory-100 px-6 py-3.5 border-t border-ivory-300 flex items-center justify-between text-[11px] text-charcoal-500">
          <div className="flex items-center gap-1.5 text-gold-700 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Govt. Silk Mark Certified Single Piece Inventory</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-charcoal-600 hover:text-charcoal-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
