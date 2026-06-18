'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Clock, ArrowLeft, Leaf, AlertCircle, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { placeOrder } from '@/lib/orders';
import type { CartItem } from '@/lib/orders';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, removeItem, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated (after auth loads)
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  async function handleConfirm() {
    if (!user || !cartItems.length) return;
    setError('');
    setLoading(true);

    try {
      const items: CartItem[] = cartItems.map((item) => ({
        bagId: item.bagId,
        bagName: item.bagName,
        merchantId: item.merchantId,
        merchantName: item.merchantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        pickupWindow: item.pickupWindow,
      }));

      const { orderId } = await placeOrder(user, items);
      clearCart();
      router.push(`/order-confirmed/${orderId}`);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        <p className="text-stone-400 text-sm">Loading…</p>
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
        <h1 className="font-heading font-extrabold text-xl text-stone-900">Checkout</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <ShoppingBag className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="font-bold text-stone-800 text-base">Your cart is empty</h2>
            <p className="text-stone-400 text-xs mt-1">Add some surprise bags to get started</p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 text-sm transition-all"
          >
            Browse Bags
          </Link>
        </div>
      ) : (
        <>
          {/* Order items */}
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-sm text-stone-700 px-1">Your Rescue Bag</h2>
            {cartItems.map((item) => {
              const start = toDate(item.pickupWindow?.start);
              const end = toDate(item.pickupWindow?.end);
              const pickupStr = start && end
                ? `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                : 'Check pickup time';

              return (
                <div key={item.bagId} className="rounded-2xl bg-white border border-stone-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-stone-800 text-sm">{item.bagName}</p>
                      <p className="text-stone-400 text-xs mt-0.5">{item.merchantName}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-500">
                        <Clock className="h-3.5 w-3.5 text-green-600" />
                        <span>{pickupStr}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-extrabold text-green-700 text-base">
                        £{(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <span className="text-stone-400 text-xs">×{item.quantity}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.bagId)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-white border border-stone-100 p-4 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-sm text-stone-700">Order Summary</h3>
            <div className="flex justify-between text-sm text-stone-600">
              <span>Subtotal</span>
              <span>£{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-600">
              <span>Service fee</span>
              <span className="text-green-600 font-semibold">Free</span>
            </div>
            <div className="border-t border-stone-100 pt-3 flex justify-between font-extrabold text-stone-900">
              <span>Total</span>
              <span className="text-green-700">£{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Pickup reminder */}
          <div className="flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 p-4">
            <Leaf className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 leading-relaxed">
              <strong>Remember:</strong> Collect your bag during the pickup window. Bring this order confirmation with you.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 text-sm transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Confirming reservation…
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Confirm Reservation
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
