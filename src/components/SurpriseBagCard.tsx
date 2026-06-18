'use client';

import { Clock, Star, Sparkles, ChevronRight } from 'lucide-react';

interface SurpriseBagCardProps {
  bag: {
    id: string;
    merchant_id: string;
    merchant_name: string;
    price_discount: number;
    stock: number;
    status: string;
    pickup_window?: { start?: any; end?: any };
    merchant_image_url?: string;
    merchant_rating?: number;
    price_original?: number;
  };
  onClick?: (bag: any) => void;
}

const getMerchantMetadata = (name: string) => {
  const n = name.toLowerCase();
  let imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
  let rating = 4.6;
  let category = 'Coffee Shop';

  if (n.includes('pan') || n.includes('bakery') || n.includes('pasteler')) {
    imageUrl = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600';
    rating = 4.8; category = 'Bakery & Sweets';
  } else if (n.includes('fruta') || n.includes('verdura') || n.includes('organic') || n.includes('eco')) {
    imageUrl = 'https://images.unsplash.com/photo-1610397613050-3ee99347e8f3?auto=format&fit=crop&q=80&w=600';
    rating = 4.7; category = 'Eco / Veggies';
  } else if (n.includes('sushi') || n.includes('asiatic') || n.includes('wok')) {
    imageUrl = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600';
    rating = 4.9; category = 'Asian Food';
  } else if (n.includes('pizz') || n.includes('italian')) {
    imageUrl = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600';
    rating = 4.5; category = 'Pizza / Italian';
  } else if (n.includes('market') || n.includes('super')) {
    imageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
    rating = 4.4; category = 'Supermarket';
  } else if (n.includes('home') || n.includes('made')) {
    imageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
    rating = 4.4; category = 'Homemade Food';
  }

  return { imageUrl, rating, category };
};

function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

export default function SurpriseBagCard({ bag, onClick }: SurpriseBagCardProps) {
  const meta = getMerchantMetadata(bag.merchant_name);
  // Prefer real merchant data (enriched in page.tsx), fallback to name-based
  const imageUrl = bag.merchant_image_url || meta.imageUrl;
  const rating = bag.merchant_rating || meta.rating;
  const category = meta.category;

  const startTime = parseDate(bag.pickup_window?.start);
  const endTime = parseDate(bag.pickup_window?.end);
  const formattedWindow = startTime && endTime
    ? `${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })} – ${endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    : 'Check pickup time';

  const originalPrice = bag.price_original ?? parseFloat((bag.price_discount * 3).toFixed(2));
  const savings = (originalPrice - bag.price_discount).toFixed(2);
  const savingsPct = Math.round((1 - bag.price_discount / originalPrice) * 100);
  const isLowStock = bag.stock > 0 && bag.stock <= 3;
  const isOutOfStock = bag.stock <= 0;

  return (
    <div
      onClick={() => !isOutOfStock && onClick?.(bag)}
      className={`overflow-hidden rounded-3xl border transition-all duration-200 ${isOutOfStock
          ? 'border-stone-100 bg-white opacity-60'
          : 'border-stone-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-98'
        }`}
    >
      {/* Image */}
      <div className="relative h-44 w-full bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={bag.merchant_name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
          {category}
        </span>

        {isOutOfStock ? (
          <span className="absolute top-3 right-3 rounded-full bg-stone-800 px-3 py-1 text-xs font-bold text-white">Sold Out</span>
        ) : isLowStock ? (
          <span className="absolute top-3 right-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white pulse-urgent flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Only {bag.stock} left!
          </span>
        ) : (
          <span className="absolute top-3 right-3 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
            {bag.stock} available
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-base text-stone-900 leading-tight">{bag.merchant_name}</h3>
            <p className="text-stone-400 text-xs mt-0.5">Saved Surprise Bag</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-stone-600">{rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600 border border-stone-100">
          <Clock className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span>{formattedWindow}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-stone-400 line-through text-xs">£{originalPrice.toFixed(2)}</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-green-700">£</span>
              <span className="text-2xl font-extrabold text-green-700 leading-none">{bag.price_discount.toFixed(2)}</span>
            </div>
            <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-md">
              Save £{savings} ({savingsPct}% off)
            </span>
          </div>

          {!isOutOfStock && (
            <div className="flex items-center gap-1 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white">
              <span>View</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
