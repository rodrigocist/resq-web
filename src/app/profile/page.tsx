"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileLayout from '@/components/ProfileLayout';
import OrdersList from '@/components/OrdersList';
import PersonalInfoForm from '@/components/PersonalInfoForm';
import OrdersSkeletonLoader from '@/components/OrdersSkeletonLoader';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { getOrdersByUser, type Order } from '@/lib/orders';

function ProfilePageContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeTab } = useProfile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      if (!user) {
        setOrders([]);
        setIsLoadingOrders(false);
        return;
      }

      try {
        setIsLoadingOrders(true);
        const data = await getOrdersByUser(user.uid);
        if (mounted) {
          setOrders(data);
        }
      } catch (err) {
        console.error('Error loading orders:', err);
        if (mounted) {
          setOrders([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingOrders(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  if (authLoading) {
    return (
      <ProfileLayout>
        <div className="w-full space-y-4">
          <div className="h-8 w-40 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse"></div>
          <div className="h-4 w-60 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse"></div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="w-full">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mi Cuenta</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Gestiona tu información y revisa tu historial de órdenes.
          </p>
        </header>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <section aria-labelledby="orders-title" className="mt-8">
            <h2 id="orders-title" className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Mis Órdenes
            </h2>

            {isLoadingOrders ? (
              <OrdersSkeletonLoader />
            ) : (
              <OrdersList orders={orders} />
            )}
          </section>
        )}

        {activeTab === 'personal' && (
          <section aria-labelledby="personal-title" className="mt-8">
            <h2 id="personal-title" className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Datos Personales
            </h2>
            <PersonalInfoForm />
          </section>
        )}

        {activeTab === 'security' && (
          <section aria-labelledby="security-title" className="mt-8">
            <h2 id="security-title" className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Seguridad
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Esta sección está en desarrollo. Por ahora, puedes cambiar tu contraseña en "Datos Personales".
              </p>
            </div>
          </section>
        )}
      </div>
    </ProfileLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <ProfilePageContent />
    </ProfileProvider>
  );
}

