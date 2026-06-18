'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import SurpriseBagCard from '@/components/SurpriseBagCard';
import BagDetailModal from '@/components/BagDetailModal';
import { Search, Info, Leaf, Wifi, WifiOff, MapPin } from 'lucide-react';

const SEED_MOCK_BAGS = [
  {
    id: 'mock_bag_1', merchant_id: 'merchant_1', merchant_name: "La Panadería de la Esquina",
    price_discount: 3.99, stock: 2, status: 'active',
    pickup_window: {
      start: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(20, 30, 0, 0)).toISOString(),
    },
  },
  {
    id: 'mock_bag_2', merchant_id: 'merchant_2', merchant_name: 'Eco Frutas Orgánicas',
    price_discount: 4.50, stock: 5, status: 'active',
    pickup_window: {
      start: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
    },
  },
  {
    id: 'mock_bag_3', merchant_id: 'merchant_3', merchant_name: 'Kobe Sushi Express',
    price_discount: 6.90, stock: 1, status: 'active',
    pickup_window: {
      start: new Date(new Date().setHours(21, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(22, 30, 0, 0)).toISOString(),
    },
  },
];

export default function Home() {
  const [bags, setBags] = useState<any[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showConfigHint, setShowConfigHint] = useState(false);
  const [locationName, setLocationName] = useState('Detecting location…');
  const [selectedBag, setSelectedBag] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) setErrorMessage(err);
    }
  }, []);

  // Geolocation
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision || '';
            const countryCode = data.countryCode || '';
            setLocationName(city ? `${city}, ${countryCode}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch {
            setLocationName('London, UK');
          }
        },
        () => setLocationName('London, UK')
      );
    } else {
      setLocationName('London, UK');
    }
  }, []);

  // Firestore real-time subscription
  useEffect(() => {
    if (db) {
      setIsFirebaseConnected(true);

      let unsubscribeBags: (() => void) | undefined;

      // Await merchants FIRST, then subscribe to bags — avoids the race condition
      getDocs(collection(db, 'merchants'))
        .then((snap) => {
          const merchantMap: Record<string, { image_url?: string; rating?: number }> = {};
          snap.forEach((d) => {
            const data = d.data();
            merchantMap[d.id] = { image_url: data.image_url, rating: data.rating };
          });

          const colRef = collection(db, 'surprise_bags');
          unsubscribeBags = onSnapshot(
            colRef,
            (snapshot) => {
              const list: any[] = [];
              snapshot.forEach((doc) => {
                const bag = { id: doc.id, ...doc.data() } as any;
                const merchant = merchantMap[bag.merchant_id];
                if (merchant) {
                  bag.merchant_image_url = merchant.image_url || '';
                  bag.merchant_rating = merchant.rating || 4.5;
                }
                list.push(bag);
              });
              setBags(list);
              setLoading(false);
            },
            (error) => {
              console.error('Firestore onSnapshot error:', error);
              fallbackToLocal();
            }
          );
        })
        .catch(() => fallbackToLocal());

      return () => unsubscribeBags?.();
    } else {
      fallbackToLocal();
    }

    function fallbackToLocal() {
      setIsFirebaseConnected(false);
      const loadLocal = () => {
        const stored = localStorage.getItem('resq_surprise_bags');
        if (!stored) {
          localStorage.setItem('resq_surprise_bags', JSON.stringify(SEED_MOCK_BAGS));
          return SEED_MOCK_BAGS;
        }
        try { return JSON.parse(stored); } catch { return SEED_MOCK_BAGS; }
      };
      setBags(loadLocal());
      setLoading(false);

      const onStorage = (e: StorageEvent) => {
        if (e.key === 'resq_surprise_bags') setBags(loadLocal());
      };
      const onCustom = () => setBags(loadLocal());
      window.addEventListener('storage', onStorage);
      window.addEventListener('resq-db-updated', onCustom);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('resq-db-updated', onCustom);
      };
    }
  }, []);

  const filteredBags = bags.filter((bag) => {
    const matchesSearch = bag.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'urgent') return matchesSearch && bag.stock > 0 && bag.stock <= 3;
    if (selectedFilter === 'available') return matchesSearch && bag.stock > 0;
    return matchesSearch;
  });

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-stone-700">{locationName}</span>
          </div>
          {isFirebaseConnected ? (
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700 border border-green-200">
              <Wifi className="h-3 w-3" /> Real-time Cloud
            </div>
          ) : (
            <button
              onClick={() => setShowConfigHint(!showConfigHint)}
              className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <WifiOff className="h-3 w-3" /> Demo Mode
            </button>
          )}
        </div>

        {showConfigHint && !isFirebaseConnected && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 text-xs text-amber-900 leading-relaxed shadow-sm">
            <div className="flex gap-2 items-start">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">How to Connect Your Real Database?</p>
                <p className="mb-2 text-amber-800">
                  Configure your Firebase environment variables in <code className="bg-white px-1 rounded border border-amber-200 font-mono">.env.local</code>.
                </p>
                <button onClick={() => setShowConfigHint(false)} className="text-[10px] font-bold underline text-amber-700">Understood, hide</button>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold shadow-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-800">×</button>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white shadow-md">
          <div className="relative z-10 flex flex-col gap-1.5 max-w-[80%]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <Leaf className="h-4 w-4" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl tracking-tight mt-1 leading-tight">
              Rescue delicious food today
            </h1>
            <p className="text-green-50 text-xs font-light leading-relaxed">
              Buy surplus food from local stores at 1/3 of its original price.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-emerald-500/30 blur-2xl" />
          <div className="absolute right-4 top-4 opacity-15">
            <Leaf className="h-24 w-24 stroke-[1]" />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute top-3.5 left-4 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search merchants…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-stone-100 bg-white py-3 pr-4 pl-11 text-sm text-stone-850 shadow-sm placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>

          <div className="flex gap-1.5 rounded-2xl bg-stone-100/80 p-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'urgent', label: '⚡ Urgent (≤3)' },
              { key: 'available', label: 'Available' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`flex-1 rounded-xl py-2 text-center text-xs font-semibold transition-all ${
                  selectedFilter === key
                    ? key === 'urgent'
                      ? 'bg-white text-red-600 shadow-xs'
                      : key === 'available'
                      ? 'bg-white text-green-700 shadow-xs'
                      : 'bg-white text-stone-850 shadow-xs'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bag list */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heading font-extrabold text-base text-stone-800">Surprise Bags Near You</h2>
            <span className="text-xs font-medium text-stone-500">{filteredBags.length} results</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex flex-col gap-3 rounded-3xl border border-stone-100 bg-white p-4">
                  <div className="h-44 w-full rounded-2xl bg-stone-100" />
                  <div className="h-4 w-3/4 rounded bg-stone-100" />
                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                  <div className="mt-2 h-8 w-full rounded-xl bg-stone-100" />
                </div>
              ))}
            </div>
          ) : filteredBags.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredBags.map((bag) => (
                <SurpriseBagCard key={bag.id} bag={bag} onClick={setSelectedBag} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 rounded-3xl bg-white border border-stone-100 text-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                <Leaf className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-stone-800 text-sm">No surprise bags available</h3>
              <p className="text-stone-400 text-xs max-w-xs leading-relaxed">
                We couldn't find any bags matching your search. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bag Detail Modal */}
      <BagDetailModal bag={selectedBag} onClose={() => setSelectedBag(null)} />
    </>
  );
}
