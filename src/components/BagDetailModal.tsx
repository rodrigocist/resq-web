'use client';

import { useState, useEffect } from 'react';
import {
  X, Clock, Star, ShoppingBag, Minus, Plus, Leaf, Tag, Sparkles,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Bag {
  id: string;
  merchant_id: string;
  merchant_name: string;
  price_discount: number;
  stock: number;
  status: string;
  pickup_window?: { start?: any; end?: any };
  start?: any;
  end?: any;
  merchant_rating?: number;
  merchant_image_url?: string;
  image_url?: string;
  rating?: number;
}

interface BagDetailModalProps {
  bag: Bag | null;
  onClose: () => void;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

function fmt(date: Date | null) {
  if (!date) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const DESCRIPTIONS: Record<string, string> = {
  'bakery': 'A delightful mix of freshly baked goods — breads, pastries, and sweet treats that would otherwise go to waste. Each bag is a surprise!',
  'eco': 'A seasonal selection of organic fruits and vegetables sourced locally. Fresh, nutritious, and rescued with love.',
  'sushi': 'Premium sushi rolls, nigiri, and sides prepared earlier today. Perfect for a quality dinner at a fraction of the price.',
  'pizza': 'Authentic wood-fired pizza slices and sides. Crispy, delicious, and ready to enjoy tonight.',
  'supermarket': 'A curated mix of pantry staples, chilled items, and snacks nearing their best-before date. Great value.',
  'default': 'A handpicked selection of surplus food from this merchant — quality guaranteed, waste reduced.',
};

function getDescription(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('pan') || n.includes('bakery') || n.includes('pastel')) return DESCRIPTIONS.bakery;
  if (n.includes('fruta') || n.includes('eco') || n.includes('organic')) return DESCRIPTIONS.eco;
  if (n.includes('sushi') || n.includes('asian') || n.includes('wok')) return DESCRIPTIONS.sushi;
  if (n.includes('pizza') || n.includes('italian')) return DESCRIPTIONS.pizza;
  if (n.includes('market') || n.includes('super')) return DESCRIPTIONS.supermarket;
  return DESCRIPTIONS.default;
}

export default function BagDetailModal({ bag, onClose }: BagDetailModalProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bag) {
      setQuantity(1);
      setAdded(false);
      // Trigger slide-up animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [bag]);

  if (!bag) return null;

  const imageUrl = bag.merchant_image_url || bag.image_url ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
  const rating = bag.merchant_rating || bag.rating || 4.6;
  const originalPrice = (bag.price_discount * 3).toFixed(2);
  const savings = (parseFloat(originalPrice) - bag.price_discount).toFixed(2);
  const pickupStart = toDate(bag.pickup_window?.start || bag.start);
  const pickupEnd = toDate(bag.pickup_window?.end || bag.end);
  const pickupStr = pickupStart && pickupEnd
    ? `${fmt(pickupStart)} – ${fmt(pickupEnd)}`
    : 'Check with merchant';
  const isLowStock = bag.stock > 0 && bag.stock <= 3;
  const isOutOfStock = bag.stock <= 0;
  const description = getDescription(bag.merchant_name);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  function handleAddToCart() {
    if (!bag) return;
    if (!user) {
      handleClose();
      router.push('/login');
      return;
    }
    addItem({
      bagId: bag.id,
      bagName: `${bag.merchant_name} Surprise Bag`,
      merchantId: bag.merchant_id,
      merchantName: bag.merchant_name,
      unitPrice: bag.price_discount,
      maxStock: bag.stock,
      pickupWindow: {
        start: bag.pickup_window?.start || bag.start || null,
        end: bag.pickup_window?.end || bag.end || null,
      },
      imageUrl,
    }, quantity);
    setAdded(true);
    setTimeout(() => {
      handleClose();
      router.push('/checkout');
    }, 800);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Image header */}
        <div className="relative h-52 w-full overflow-hidden rounded-t-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={bag.merchant_name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Stock badge */}
          {isOutOfStock ? (
            <span className="absolute top-3 left-3 rounded-full bg-stone-800 px-3 py-1 text-[10px] font-bold text-white">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="absolute top-3 left-3 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold text-white pulse-urgent flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Only {bag.stock} left!
            </span>
          ) : null}

          {/* Price overlay */}
          <div className="absolute bottom-3 left-4">
            <div className="flex items-baseline gap-1">
              <span className="text-white font-bold text-sm">£</span>
              <span className="text-white font-extrabold text-3xl">{bag.price_discount.toFixed(2)}</span>
            </div>
            <span className="text-white/70 text-xs line-through">Value £{originalPrice}</span>
          </div>

          <div className="absolute bottom-3 right-4 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold text-white">
            Save £{savings}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 p-5">
          {/* Merchant info */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-stone-900">{bag.merchant_name}</h2>
              <p className="text-stone-500 text-xs mt-0.5">Surprise Bag</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 border border-amber-100">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-700">{rating}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-stone-500 text-xs leading-relaxed">{description}</p>

          {/* Pickup window */}
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Clock className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-700">Pickup window</p>
              <p className="text-xs text-stone-500 mt-0.5">{pickupStr}</p>
            </div>
          </div>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">Quantity</span>
              <div className="flex items-center border border-stone-200 rounded-full bg-stone-50 p-1 gap-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-stone-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(bag.stock, q + 1))}
                  disabled={quantity >= bag.stock}
                  className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Total */}
          {!isOutOfStock && (
            <div className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-3 border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 text-xs">
                <Tag className="h-3.5 w-3.5" />
                <span>Total</span>
              </div>
              <span className="font-extrabold text-green-700 text-base">
                £{(bag.price_discount * quantity).toFixed(2)}
              </span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || added}
            className={`w-full rounded-full py-3.5 font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
              added
                ? 'bg-green-100 text-green-700'
                : isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md active:scale-98'
            }`}
          >
            {added ? (
              <>
                <Leaf className="h-4 w-4" />
                Added! Going to checkout…
              </>
            ) : isOutOfStock ? (
              'Not Available'
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Add to Rescue Bag
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
