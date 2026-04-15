import React from 'react';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { wishlist, products } = useShop();
  
  const wishlistedProducts = products.filter(p => wishlist.includes(p._id));

  return (
    <div className="bg-white min-h-screen pb-32 text-black font-sans">
      <div className="max-w-7xl mx-auto px-6 pt-16 lg:pt-24 mb-16">
        <div className="flex flex-col items-center text-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 mb-1">Saved Items</span>
            <h1 className="font-serif text-4xl md:text-5xl font-black italic tracking-tight text-black">My Wishlist</h1>
            <div className="h-px w-20 bg-black my-4 opacity-10" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
              {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'Item' : 'Items'} Saved
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {wishlistedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-16 animate-fade-in">
            {wishlistedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center max-w-sm mx-auto space-y-8 animate-fade-in">
            <div className="w-20 h-20 border border-black flex items-center justify-center mx-auto shadow-lg">
              <svg width="32" height="32" fill="none" stroke="black" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <div className="space-y-4">
              <h2 className="font-serif text-3xl font-black italic text-black tracking-tight">Your wishlist is empty</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Save your favorite pieces here to revisit them later.</p>
            </div>
            <Link to="/collection" className="inline-block px-12 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-gray-800 transition-all shadow-xl">
              Explore Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
