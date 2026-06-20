"use client";

import React, { useState } from 'react';
import type { Order } from '@/lib/orders';
import { toDate, completeOrder } from '@/lib/orders';
import { Package, Calendar, DollarSign } from 'lucide-react';
import SwipeButton from './SwipeButton';

// ...existing code...

function formatDate(d: unknown) {
  const date = toDate(d);
  if (!date) return '-';
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadgeColor(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'reserved':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function OrdersList({ orders }: { orders: Order[] }) {
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

  const handleOrderComplete = async (orderId: string) => {
    try {
      await completeOrder(orderId);
      setCompletedOrders((prev) => new Set([...prev, orderId]));
    } catch (err) {
      console.error('Error completing order:', err);
      throw err;
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-600 font-medium">No hay órdenes todavía.</p>
        <p className="text-sm text-gray-500 mt-1">Comienza comprando bolsas sorpresa en el marketplace.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <article
          key={o.id}
          className="w-full bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all"
        >
          {/* Header: Order ID and Status - Responsive flex */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-all">
                Orden #{o.id.slice(0, 8)}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                {o.merchant_name ?? 'Comercio'}
              </p>
            </div>
            <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeColor(o.status)}`}>
              {o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Desconocido'}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Details Grid - Responsive columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="flex items-start gap-3 min-w-0">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Fecha</p>
                <p className="text-sm text-gray-700 font-medium whitespace-normal break-words">
                  {formatDate(o.created_at)}
                </p>
              </div>
            </div>

            {/* Quantity and Bag */}
            <div className="flex items-start gap-3 min-w-0">
              <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Artículo</p>
                <p className="text-sm text-gray-700 font-medium truncate">
                  {o.bag_name ?? 'Bolsa sorpresa'} x{o.quantity ?? 1}
                </p>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex items-start gap-3 min-w-0">
              <DollarSign className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total</p>
                <p className="text-sm sm:text-base font-bold text-green-600">
                  £{(o.total_price ?? 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Unit Price */}
            <div className="flex items-start gap-3 min-w-0">
              <DollarSign className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Precio unitario</p>
                <p className="text-sm font-semibold text-gray-700">
                  £{(o.unit_price ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Swipe to Complete - Only show if order is reserved */}
          {o.status?.toLowerCase() === 'reserved' && !completedOrders.has(o.id) && (
            <div className="pt-4 border-t border-gray-100">
              <SwipeButton
                orderId={o.id}
                onSwipeComplete={() => handleOrderComplete(o.id)}
              />
            </div>
          )}

          {/* Completion Status */}
          {completedOrders.has(o.id) && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center py-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-800">✓ Orden entregada</span>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

