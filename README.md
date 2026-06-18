# ResQ - Food Rescue Platform

ResQ is a progressive web application (PWA) designed to connect local businesses in Bury St Edmunds with residents to reduce food waste. Our mission is to provide an easy, fast, and sustainable way for shops to sell their surplus food at a discount, benefiting both the merchant and the community.

## 🚀 Features

- **Real-time Marketplace:** Customers can browse and reserve surplus "surprise bags" from local merchants.
- **Merchant Dashboard:** A streamlined interface for shop owners to publish surplus bags in seconds.
- **Role-based Access:** Secure system distinguishing between customers and verified merchants.
- **Mobile-First Design:** Built as a PWA, providing a native-app-like experience on any smartphone.

## 🛠 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Database/Backend:** Firebase (Firestore & Authentication)
- **Deployment:** Vercel

## 📦 Getting Started

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/rodrigocist/resq-web.git](https://github.com/rodrigocist/resq-web.git)
   cd resq-web

   npm install

   Fragmento de código
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
# ... add remaining keys

npm run dev