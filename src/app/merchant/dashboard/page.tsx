'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp, query, where } from "firebase/firestore";
import { PlusCircle, Trash2, Store, Calendar, PoundSterling, Plus, Minus, ArrowLeft, Leaf, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, role, merchantDoc, loading: authLoading } = useAuth();
  
  const [bags, setBags] = useState<any[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

  // Form states
  const [priceOriginal, setPriceOriginal] = useState("9.99");
  const [priceDiscount, setPriceDiscount] = useState("3.99");
  const [stock, setStock] = useState("5");
  
  // Default pickup window: today 18:00 to 20:00
  const getTodayISOString = (hours: number) => {
    const d = new Date();
    d.setHours(hours, 0, 0, 0);
    // Format to yyyy-MM-ddThh:mm for datetime-local input
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [startTime, setStartTime] = useState(getTodayISOString(18));
  const [endTime, setEndTime] = useState(getTodayISOString(20));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect if not authenticated as merchant
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?error=Please sign in to continue");
      } else if (role !== "merchant") {
        router.push("/?error=Access denied. Merchant account required.");
      }
    }
  }, [user, role, authLoading, router]);

  // Fetch bags for this merchant
  useEffect(() => {
    if (!merchantDoc || !db) return;

    try {
      const q = query(
        collection(db, "surprise_bags"),
        where("merchant_id", "==", merchantDoc.id)
      );
      
      const unsubscribeBags = onSnapshot(q, (snapshot) => {
        const bagsList: any[] = [];
        snapshot.forEach((docSnap) => {
          bagsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort in client by created_at (since composite index might be needed otherwise)
        bagsList.sort((a, b) => {
          const tA = a.created_at?.toMillis() || 0;
          const tB = b.created_at?.toMillis() || 0;
          return tB - tA; // descending
        });
        setBags(bagsList);
      }, (error) => {
        console.error("Firestore error:", error);
      });

      return () => unsubscribeBags();
    } catch (e) {
      console.error("Firestore query error:", e);
    }
  }, [merchantDoc]);

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        <p className="text-stone-400 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  if (role !== "merchant") {
    return null; // The useEffect will redirect them
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!merchantDoc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Store className="h-8 w-8" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-stone-800">Perfil comercial no configurado</h2>
        <p className="text-stone-500 text-sm max-w-sm">
          Tu cuenta tiene rol de comerciante, pero no se ha vinculado ningún perfil de tienda. Por favor, contacta a soporte para configurarlo.
        </p>
        <button
          onClick={handleSignOut}
          className="mt-4 rounded-full bg-stone-100 hover:bg-stone-200 px-6 py-2.5 text-sm font-bold text-stone-700 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantDoc || !priceDiscount || !stock || !startTime || !endTime) return;

    setIsSubmitting(true);
    setSuccessMsg("");

    const parsedPrice = parseFloat(priceDiscount);
    const parsedOriginal = parseFloat(priceOriginal);
    const parsedStock = parseInt(stock);

    const bagData = {
      merchant_id: merchantDoc.id,
      merchant_name: merchantDoc.name,
      price_original: parsedOriginal,
      price_discount: parsedPrice,
      stock: parsedStock,
      status: parsedStock > 0 ? "active" : "sold_out",
      pickup_window: {
        start: Timestamp.fromDate(new Date(startTime)),
        end: Timestamp.fromDate(new Date(endTime)),
      },
      created_at: Timestamp.now(),
    };

    if (db) {
      try {
        await addDoc(collection(db, "surprise_bags"), bagData);
        setSuccessMsg("Bag published successfully!");
      } catch (e) {
        console.error("Error saving bag to Firestore:", e);
        alert("Error writing to Firestore. Make sure you have the right permissions.");
      }
    }

    setIsSubmitting(false);
    // Reset stock to default, keep pricing
    setStock("5");

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleUpdateStock = async (bagId: string, amount: number) => {
    if (db) {
      try {
        const bagRef = doc(db, "surprise_bags", bagId);
        const currentBag = bags.find(b => b.id === bagId);
        if (currentBag) {
          const newStock = Math.max(0, currentBag.stock + amount);
          await updateDoc(bagRef, { 
            stock: newStock,
            status: newStock === 0 ? "sold_out" : "active"
          });
        }
      } catch (e) {
        console.error("Error updating stock in Firestore:", e);
      }
    }
  };

  const handleDeleteBag = async (bagId: string) => {
    if (db) {
      try {
        if (confirm("Are you sure you want to delete this bag?")) {
          await deleteDoc(doc(db, "surprise_bags", bagId));
        }
      } catch (e) {
        console.error("Error deleting document from Firestore:", e);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-heading font-extrabold text-xl text-stone-850">
            Dashboard
          </h1>
        </div>
        <button
          onClick={handleSignOut}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Merchant Profile Summary */}
      <div className="rounded-3xl bg-green-600 text-white p-5 shadow-sm flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight">{merchantDoc.name}</h2>
          <p className="text-green-100 text-xs mt-0.5">Manage your surplus food</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl bg-white border border-stone-100 p-5 shadow-sm">
        <h2 className="font-heading font-extrabold text-base text-stone-850 mb-4 flex items-center gap-1.5">
          <PlusCircle className="h-5 w-5 text-green-600" /> Publish Surprise Bag
        </h2>

        {successMsg && (
          <div className="mb-4 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-xs font-semibold text-green-700 animate-pulse">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Price Inputs - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <PoundSterling className="h-3.5 w-3.5" /> Original Price (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={priceOriginal}
                onChange={(e) => setPriceOriginal(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 px-4 text-sm text-stone-850 focus:outline-hidden focus:ring-1 focus:ring-green-500/30 focus:border-green-500"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <PoundSterling className="h-3.5 w-3.5 text-green-600" /> Discounted Price (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={priceDiscount}
                onChange={(e) => setPriceDiscount(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 px-4 text-sm text-green-700 font-bold focus:outline-hidden focus:ring-1 focus:ring-green-500/30 focus:border-green-500"
                required
              />
            </div>
          </div>

          {/* Savings preview */}
          {priceOriginal && priceDiscount && parseFloat(priceOriginal) > parseFloat(priceDiscount) && (
            <div className="rounded-xl bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-700 font-semibold flex items-center justify-between">
              <span>Customer saves</span>
              <span className="text-green-600 font-extrabold">
                £{(parseFloat(priceOriginal) - parseFloat(priceDiscount)).toFixed(2)}
                {' '}({Math.round((1 - parseFloat(priceDiscount) / parseFloat(priceOriginal)) * 100)}% off)
              </span>
            </div>
          )}

          {/* Stock Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500">Quantity (Available Bags)</label>
            <input
              type="number"
              min="1"
              max="99"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 px-4 text-sm text-stone-850 focus:outline-hidden focus:ring-1 focus:ring-green-500/30 focus:border-green-500"
              required
            />
          </div>

          {/* Dates Input */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Pickup Start
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 px-3 text-xs text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-green-500/30 focus:border-green-500"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Pickup End
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 px-3 text-xs text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-green-500/30 focus:border-green-500"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 text-sm transition-all shadow-sm hover:scale-102 mt-2 disabled:opacity-60"
          >
            {isSubmitting ? "Publishing..." : "Publish Surprise Bag"}
          </button>
        </form>
      </div>

      {/* Active Listings List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-extrabold text-base text-stone-850">
            Your Active Bags
          </h3>
          <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
            {bags.length} items
          </span>
        </div>

        {bags.length > 0 ? (
          <div className="flex flex-col gap-3 pb-6">
            {bags.map((bag) => {
              const parseDate = (timestamp: any) => {
                if (!timestamp) return null;
                if (timestamp.toDate) return timestamp.toDate();
                if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
                return new Date(timestamp);
              };

              const start = parseDate(bag.pickup_window?.start || bag.start);
              const end = parseDate(bag.pickup_window?.end || bag.end);

              const timeStr = start && end
                ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "No pickup window";

              return (
                <div 
                  key={bag.id}
                  className="rounded-2xl border border-stone-100 bg-white p-4 shadow-xs flex items-center justify-between"
                >
                  <div className="flex flex-col gap-1 max-w-[55%]">
                    <span className="text-xs text-stone-400 font-semibold">{timeStr}</span>
                    <span className="font-bold text-sm text-stone-800">£{Number(bag.price_discount || 0).toFixed(2)} Bag</span>
                    <span className={`text-[10px] font-bold ${bag.stock <= 0 ? "text-red-500" : "text-green-600"}`}>
                      {bag.stock <= 0 ? 'Sold Out' : `Stock: ${bag.stock} units`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Stock Control Buttons */}
                    <div className="flex items-center border border-stone-100 rounded-full bg-stone-50 p-1">
                      <button
                        onClick={() => handleUpdateStock(bag.id, -1)}
                        disabled={bag.stock <= 0}
                        className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95 disabled:opacity-50 border border-stone-100"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-stone-850">{bag.stock}</span>
                      <button
                        onClick={() => handleUpdateStock(bag.id, 1)}
                        className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95 border border-stone-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteBag(bag.id)}
                      className="h-9 w-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors active:scale-95"
                      title="Delete bag"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-200 p-8 text-center bg-stone-50/30 flex flex-col items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Leaf className="h-5 w-5" />
            </div>
            <h4 className="text-stone-700 font-bold text-xs">No active surprise bags</h4>
            <p className="text-stone-400 text-[10px] max-w-[200px] leading-relaxed">
              Fill out the form above to publish your first surplus food bag.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
