'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Clock, Store, ClipboardList, ArrowLeft, Leaf } from 'lucide-react';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

export default function OrderConfirmedPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getDoc(doc(db, 'orders', orderId)).then((snap) => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        <p className="text-stone-400 text-sm">Loading confirmation…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <Leaf className="h-7 w-7 text-red-400" />
        </div>
        <h1 className="font-bold text-stone-800">Order not found</h1>
        <Link href="/" className="text-green-600 text-sm font-semibold underline">Back to home</Link>
      </div>
    );
  }

  const start = toDate(order.pickup_window?.start);
  const end = toDate(order.pickup_window?.end);
  const pickupStr = start && end
    ? `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : 'Check with merchant';
  const dateStr = start
    ? start.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="flex flex-col gap-5 p-4 pb-8">
      {/* Back */}
      <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
        <ArrowLeft className="h-4 w-4" />
      </Link>

      {/* Success banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white text-center shadow-md">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 border border-white/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl tracking-tight">Reservation Confirmed!</h1>
            <p className="text-green-100 text-sm mt-1 font-light">Show this at collection</p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white border border-stone-100 p-6 shadow-sm">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Collection QR Code</p>
        <div className="p-3 rounded-2xl border-2 border-green-100 bg-green-50">
          <QRCodeSVG
            value={`resq://order/${orderId}`}
            size={180}
            bgColor="#f0fdf4"
            fgColor="#15803d"
            level="M"
          />
        </div>
        <div className="text-center">
          <p className="text-[10px] text-stone-400 font-medium">Order ID</p>
          <code className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-lg">
            {orderId?.slice(0, 16)}…
          </code>
        </div>
      </div>

      {/* Order details */}
      <div className="rounded-3xl bg-white border border-stone-100 p-5 shadow-sm flex flex-col gap-4">
        <h2 className="font-bold text-sm text-stone-700">Order Details</h2>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
            <Store className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <p className="text-xs text-stone-400">Merchant</p>
            <p className="font-semibold text-stone-800 text-sm">{order.merchant_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
            <Clock className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <p className="text-xs text-stone-400">Pickup window</p>
            <p className="font-semibold text-stone-800 text-sm">{pickupStr}</p>
            {dateStr && <p className="text-xs text-stone-400">{dateStr}</p>}
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-stone-400">{order.bag_name}</p>
            <p className="text-xs text-stone-400">×{order.quantity}</p>
          </div>
          <p className="font-extrabold text-green-700 text-lg">£{order.total_price?.toFixed(2)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/orders"
          className="flex items-center justify-center gap-2 w-full rounded-full border border-green-200 text-green-700 font-bold py-3 text-sm hover:bg-green-50 transition-all"
        >
          <ClipboardList className="h-4 w-4" />
          View My Orders
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full rounded-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-sm transition-all shadow-sm"
        >
          <Leaf className="h-4 w-4" />
          Rescue More Food
        </Link>
      </div>
    </div>
  );
}
