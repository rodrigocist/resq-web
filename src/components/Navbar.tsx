'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Leaf, Store, User, ArrowRight, ShoppingBag, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { signOut } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const { totalItems } = useCart();

  const isMerchant = role === 'merchant';
  const isLoginPage = pathname === '/login';

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-100 bg-white/80 backdrop-blur-md px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={isMerchant ? '/merchant/dashboard' : '/'} className="flex items-center gap-1.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500 text-white transition-transform group-hover:scale-105">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-stone-850">
            Res<span className="text-green-600">Q</span>
          </span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {!loading && !isLoginPage && (
            <>
              {user ? (
                <>
                  {/* Cart icon — only for customers */}
                  {!isMerchant && (
                    <Link
                      href="/checkout"
                      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200/60"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Merchant navigation */}
                  {isMerchant && (
                    pathname === '/merchant/dashboard' ? (
                      <Link
                        href="/"
                        className="flex items-center gap-1.5 rounded-full bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200/60 transition-colors"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Customer view</span>
                      </Link>
                    ) : (
                      <Link
                        href="/merchant/dashboard"
                        className="flex items-center gap-1.5 rounded-full bg-green-50 hover:bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200/60 transition-colors"
                      >
                        <Store className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Dashboard</span>
                      </Link>
                    )
                  )}

                  {/* Profile link + sign out */}
                  <Link
                    href="/profile"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                    title="Mi cuenta"
                    aria-label="Mi cuenta"
                  >
                    <User className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-full bg-green-600 hover:bg-green-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
