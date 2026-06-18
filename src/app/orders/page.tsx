'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Clock, CheckCircle2, Leaf, ShoppingBag, Store } from 'lucide-react';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

const STATUS_STYLES: Record<string, string> = {
  reserved: 'bg-green-50 text-green-700 border-green-200',
  sold_out: 'bg-stone-100 text-stone-500 border-stone-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_LABELS: Record<string, string> = {
  reserved: 'Reserved ✓',
  sold_out: 'Collected',
  expired: 'Expired',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setOrders(list);
      setLoading(false);
    }, (err) => {
      console.error('Orders fetch error:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        <p className="text-stone-400 text-sm">Loading your orders…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-heading font-extrabold text-xl text-stone-900">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <ShoppingBag className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <h2 className="font-bold text-stone-800 text-base">No orders yet</h2>
            <p className="text-stone-400 text-xs mt-1 max-w-[200px]">
              Start rescuing food and your orders will appear here
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 text-sm transition-all"
          >
            Browse Bags
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const start = toDate(order.pickup_window?.start);
            const end = toDate(order.pickup_window?.end);
            const pickupStr = start && end
              ? `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
              : '';
            const dateStr = start
              ? start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : '';
            const createdAt = toDate(order.created_at);
            const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.reserved;
            const statusLabel = STATUS_LABELS[order.status] ?? order.status;

            return (
              <Link
                key={order.id}
                href={`/order-confirmed/${order.id}`}
                className="rounded-2xl bg-white border border-stone-100 p-4 shadow-sm hover:shadow-md transition-all flex gap-4 items-start"
              >
                {/* Icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  {order.status === 'reserved' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Leaf className="h-5 w-5" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-stone-800 text-sm leading-tight truncate">{order.bag_name}</p>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-400">
                    <Store className="h-3 w-3" />
                    <span>{order.merchant_name}</span>
                  </div>

                  {pickupStr && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-400">
                      <Clock className="h-3 w-3" />
                      <span>{pickupStr} {dateStr && `· ${dateStr}`}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="shrink-0 text-right">
                  <p className="font-extrabold text-green-700 text-base">£{order.total_price?.toFixed(2)}</p>
                  {createdAt && (
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
