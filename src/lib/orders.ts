import {
  runTransaction,
  doc,
  collection,
  serverTimestamp,
  updateDoc,
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
  pickupWindow: { start: unknown; end: unknown };
}

export interface OrderResult {
  orderId: string;
}

export interface Order {
  id: string;
  user_id: string;
  user_email?: string | null;
  user_name?: string | null;
  merchant_id?: string;
  merchant_name?: string;
  bag_id?: string;
  bag_name?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  status?: string;
  pickup_window?: unknown;
  created_at?: unknown;
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
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

import {
  collection as collectionRef,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';

/**
 * Obtener órdenes de un usuario por UID, ordenadas por `created_at` descendente.
 */
export async function getOrdersByUser(uid: string): Promise<Order[]> {
  if (!uid) return [];

  const q = query(
    collectionRef(db, 'orders'),
    where('user_id', '==', uid),
    orderBy('created_at', 'desc')
  );

  const snap = await getDocs(q);
  const results: Order[] = [];

  snap.forEach((doc) => {
    const data = doc.data();
    // cast via Record<string, unknown> then to Order to avoid `any`
    const obj = { id: doc.id, ...(data as Record<string, unknown>) } as unknown as Order;
    results.push(obj);
  });

  return results;
}

/**
 * Marca una orden como completada (retirada) en Firestore.
 * Actualiza el estado a 'completed' y añade un timestamp de finalización.
 */
export async function completeOrder(orderId: string): Promise<void> {
  if (!orderId) throw new Error('Order ID is required');

  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'completed',
      completed_at: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error completing order:', err);
    throw new Error(`Failed to complete order ${orderId}`);
  }
}

