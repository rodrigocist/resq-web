"use client";

import React from 'react';
import { Settings, Lock, User } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

type ActiveTab = 'orders' | 'personal' | 'security';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useProfile();

  const tabs = [
    { id: 'orders' as const, label: 'Mis Órdenes', icon: User, href: '/profile' },
    { id: 'personal' as const, label: 'Datos Personales', icon: Settings, href: '#' },
    { id: 'security' as const, label: 'Seguridad', icon: Lock, href: '#' },
  ];

  return (
      <div className="min-h-screen bg-gray-50 w-full block">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 w-full">

          {/* Cambiamos Flex por Grid en escritorio (md:grid) para controlar los anchos de forma estricta */}
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-8 w-full items-start">

            {/* Menú de Navegación (Izquierda) */}
            <aside className="w-full sticky top-4 z-10 md:top-8">
              <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible whitespace-nowrap md:whitespace-normal">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 md:flex-none text-center md:text-left px-4 py-2.5 rounded-lg transition-all flex items-center justify-center md:justify-start gap-3 text-sm font-medium ${
                              isActive
                                  ? 'bg-green-50 text-green-700 md:border-l-4 md:border-l-green-600 rounded-l-none md:rounded-l-lg'
                                  : 'text-gray-600 hover:bg-gray-50 md:border-l-4 md:border-l-transparent'
                          }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                  );
                })}
              </nav>
            </aside>

            {/* Contenedor de Contenido Principal (Derecha) */}
            {/* Al usar 1fr en el grid, este bloque ocupará obligatoriamente todo el espacio restante disponible */}
            <main className="w-full min-w-0 bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 md:p-8">
              {children}
            </main>

          </div>
        </div>
      </div>
  );
}