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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto perspective-1000">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-gold-500/40 overflow-hidden flex flex-col my-8 max-h-[92vh] card-3d">
        {/* Modal Header: 30% Royal Burgundy */}
        <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 px-6 py-5 text-white flex items-center justify-between border-b border-gold-500/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gold-500/25 text-gold-300 border border-gold-400/40 shadow-md">
              <Barcode className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold block">
                Physical Studio Authentication
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
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-ivory-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 60% Ivory Canvas */}
        <div className="p-6 overflow-y-auto space-y-6 bg-[#FAF8F5]">
          {/* Instructions */}
          <p className="text-xs text-charcoal-600 font-light leading-relaxed">
            Every physical drape in our Kala Ghoda studio vault carries an individual Code 128 barcode tag. Scan with your device camera or enter the barcode below to inspect weave ancestry, pure gold zari verification, and single-loom physical provenance.
          </p>

          {/* 3D Holographic Camera Scanner Viewfinder */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-charcoal-950 border-2 border-gold-500 aspect-video flex items-center justify-center shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Holographic 3D Laser Reticle */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse" />
              <div className="absolute top-3 left-3 bg-charcoal-900/90 text-gold-300 text-[10px] font-mono px-3 py-1 rounded-full border border-gold-500/50 shadow-md">
                Align physical barcode inside reticle
              </div>
              <button
                onClick={stopCamera}
                className="absolute bottom-3 right-3 px-3.5 py-1.5 bg-white/95 text-charcoal-900 rounded-xl text-xs font-semibold hover:bg-white transition shadow-md"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={startCamera}
                className="btn-3d-burgundy flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-serif text-xs font-bold w-full border border-gold-500/30"
              >
                <Camera className="w-4 h-4 text-gold-400" />
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
                placeholder="Enter Barcode Tag (e.g., BS-KAN-001)..."
                className="w-full bg-white border border-ivory-300 rounded-2xl py-3 pl-10 pr-4 text-xs font-mono font-bold text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 shadow-sm"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3.5" />
            </div>
            {/* 10% Gold Accent 3D Button */}
            <button
              type="submit"
              className="btn-3d-gold px-7 py-3 rounded-2xl font-serif font-bold text-xs tracking-wider"
            >
              Verify
            </button>
          </form>

          {/* Quick Demo Barcode Pills */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-500 block mb-2 font-semibold">
              Sample Vault Barcodes:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleBarcodes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSimulateScan(item.barcode)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-ivory-300 hover:border-gold-500 text-[11px] font-mono font-bold text-charcoal-800 hover:text-burgundy-900 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3 text-gold-600" />
                  <span>{item.barcode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Verification Error */}
          {verificationError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          {/* 3D Verified Piece Provenance Certificate Card */}
          {verifiedItem && verifiedItem.product && (
            <div className="bg-white rounded-3xl border-2 border-gold-500/60 p-6 shadow-luxury space-y-4 animate-fadeIn card-3d">
              {/* Seal Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-ivory-200">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Certified Single-Loom Studio Piece</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-serif font-bold bg-gold-500/20 text-gold-900 border border-gold-400/40 uppercase tracking-wider shadow-sm">
                  Silk Mark Genuine
                </span>
              </div>

              {/* Product Info with 3D Depth */}
              <div className="flex gap-4 items-start">
                <img
                  src={getProductImage(verifiedItem.product)}
                  alt={verifiedItem.product.name}
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (t.src !== FALLBACK_SAREE_IMAGE) t.src = FALLBACK_SAREE_IMAGE;
                  }}
                  className="w-20 h-24 object-cover rounded-2xl shadow-md border border-ivory-200 flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold-700 font-bold block">
                    {verifiedItem.product.fabric} • {verifiedItem.product.occasion}
                  </span>
                  <h4 className="font-serif text-base font-bold text-burgundy-950 mt-0.5 leading-snug">
                    {verifiedItem.product.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-serif text-xl font-bold text-burgundy-950">
                      {formatINR(verifiedItem.product.price)}
                    </span>
                    <span className="text-xs text-charcoal-400 line-through">
                      {formatINR(verifiedItem.product.mrp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scannable Barcode SVG */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-ivory-200 flex flex-col items-center justify-center shadow-inner">
                <svg ref={svgRef} className="max-w-full" />
                <span className="text-[10px] text-charcoal-500 font-mono mt-1 font-semibold">
                  Code 128 Studio Physical Tag • Piece ID: {verifiedItem.id}
                </span>
              </div>

              {/* Loom Details & Location */}
              <div className="grid grid-cols-2 gap-3 text-[11px] font-sans">
                <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-200">
                  <span className="text-charcoal-400 text-[10px] block font-mono">Vault Location</span>
                  <span className="font-serif font-bold text-charcoal-900 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-burgundy-800" />
                    <span>{verifiedItem.location?.name || 'Kala Ghoda Studio Vault'}</span>
                  </span>
                </div>
                <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-200">
                  <span className="text-charcoal-400 text-[10px] block font-mono">Provenance Archive</span>
                  <span className="font-serif font-bold text-charcoal-900 block mt-0.5 truncate">
                    Bombay Saree Heritage Loom
                  </span>
                </div>
              </div>

              {/* Added Feedback */}
              {addedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Added this exact physical piece to your shopping bag!</span>
                </div>
              )}

              {/* Action 3D Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleAddVerifiedToCart}
                  className="btn-3d-gold flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-serif font-bold text-xs tracking-wider"
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
                    className="btn-3d-burgundy p-3.5 rounded-2xl font-semibold transition"
                    title="View Full Drape Specifications"
                  >
                    <Eye className="w-4 h-4 text-gold-300" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-ivory-100 px-6 py-3.5 border-t border-ivory-300 flex items-center justify-between text-[11px] text-charcoal-500">
          <div className="flex items-center gap-1.5 text-gold-800 font-serif font-semibold">
            <ShieldCheck className="w-4 h-4 text-gold-600" />
            <span>Govt. Silk Mark Certified Single Piece Inventory</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-charcoal-600 hover:text-charcoal-900 font-serif font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
