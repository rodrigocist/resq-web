import {
  runTransaction,
  doc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

export interface CartItem {
  bagId: string;
  bagName: string;
  merchantId: string;
  merchantName: string;
  quantity: number;
  unitPrice: number;
  pickupWindow: { start: any; end: any };
}

export interface OrderResult {
  orderId: string;
}

export async function placeOrder(
  user: User,
  cartItems: CartItem[]
): Promise<OrderResult> {
  if (!cartItems.length) throw new Error('Cart is empty');

  const orderRef = doc(collection(db, 'orders'));

  await runTransaction(db, async (tx) => {
    // For each item, validate + decrement stock
    for (const item of cartItems) {
      const bagRef = doc(db, 'surprise_bags', item.bagId);
      const bagSnap = await tx.get(bagRef);

      if (!bagSnap.exists()) {
        throw new Error(`Bag "${item.bagName}" no longer exists.`);
      }

      const bagData = bagSnap.data();
      const currentStock: number = bagData.stock ?? 0;

      if (currentStock < item.quantity) {
        throw new Error(
          `Not enough stock for "${item.bagName}". Only ${currentStock} left.`
        );
      }

      const newStock = currentStock - item.quantity;
      tx.update(bagRef, {
        stock: newStock,
        status: newStock === 0 ? 'sold_out' : 'active',
      });
    }

    // Collapse single-item cart into the order (MVP: one bag per order)
    const item = cartItems[0];
    const totalPrice = cartItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );

    tx.set(orderRef, {
      user_id: user.uid,
      user_email: user.email,
      user_name: user.displayName ?? user.email,
      merchant_id: item.merchantId,
      merchant_name: item.merchantName,
      bag_id: item.bagId,
      bag_name: item.bagName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: totalPrice,
      status: 'reserved',
      pickup_window: item.pickupWindow,
      created_at: serverTimestamp(),
    });
  });

  return { orderId: orderRef.id };
}

/** Helper: convert Firestore Timestamp or ISO string to Date */
export function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}
