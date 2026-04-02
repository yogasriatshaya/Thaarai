import React from 'react';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { wishlist, products } = useShop();
  
  const wishlistedProducts = products.filter(p => wishlist.includes(p._id));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span className="section-label">Your Gallery</span>
          <h1 className="section-title mb-0">Wishlist</h1>
        </div>
        <p className="text-gray-500 text-sm font-medium">
          {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'Item' : 'Items'} Saved
        </p>
      </div>

      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {wishlistedProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-300">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-serif text-gray-900">Your wishlist is empty</h2>
            <p className="text-gray-500 max-w-xs mx-auto">Save items you love to your personal gallery and come back to them anytime.</p>
          </div>
          <Link to="/collection" className="btn-primary inline-flex">
            Explore Collection
          </Link>
        </div>
      )}
    </div>
  );
}
