import React from 'react';

export default function Skeleton({ className }) {
  return (
    <div className={`skeleton rounded-sm ${className}`}></div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
