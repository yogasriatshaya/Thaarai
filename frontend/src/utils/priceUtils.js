// Price utility helpers for multi-currency support

export function getProductPrice(product, country) {
  if (!product) return 0;
  if (country === 'US') {
    const usdPrice = product.priceUSD !== undefined && product.priceUSD !== null && product.priceUSD !== '' ? Number(product.priceUSD) : null;
    // If USD price exists and is > 0, use it. Otherwise return 0 to indicate missing price
    return usdPrice && usdPrice > 0 ? usdPrice : 0;
  }
  const inrPrice = product.price !== undefined && product.price !== null && product.price !== '' ? Number(product.price) : null;
  return inrPrice && inrPrice > 0 ? inrPrice : 0;
}

export function getProductOriginalPrice(product, country) {
  if (!product) return 0;
  if (country === 'US') {
    const usdPrice = product.originalPriceUSD !== undefined && product.originalPriceUSD !== null && product.originalPriceUSD !== '' ? Number(product.originalPriceUSD) : null;
    return usdPrice && usdPrice > 0 ? usdPrice : 0;
  }
  const inrPrice = product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice !== '' ? Number(product.originalPrice) : null;
  return inrPrice && inrPrice > 0 ? inrPrice : 0;
}

export function getOfferPrice(product, country) {
  if (!product) return 0;
  // Coerce string values (FormData serializes numbers as strings)
  if (country === 'US') {
    const offerPrice = product.offerPriceUSDUSA !== undefined && product.offerPriceUSDUSA !== null && product.offerPriceUSDUSA !== '' ? Number(product.offerPriceUSDUSA) : null;
    // If valid offer price, use it. Otherwise fallback to regular price
    return offerPrice && offerPrice > 0 ? offerPrice : getProductPrice(product, country);
  }
  const offerPrice = product.offerPriceIndia !== undefined && product.offerPriceIndia !== null && product.offerPriceIndia !== '' ? Number(product.offerPriceIndia) : null;
  return offerPrice && offerPrice > 0 ? offerPrice : getProductPrice(product, country);
}

export function getOfferActive(product, country) {
  if (!product) return false;
  // Coerce string booleans ("true"/"false") from FormData serialization
  const toBool = (val) => val === true || val === 'true';
  if (country === 'US') {
    const active = toBool(product.offerActiveUSA);
    if (!active) return false;
    // Check if offer price is valid (not 0 or empty)
    const offerPrice = product.offerPriceUSDUSA !== undefined && product.offerPriceUSDUSA !== null && product.offerPriceUSDUSA !== '' ? Number(product.offerPriceUSDUSA) : null;
    if (!offerPrice || offerPrice === 0) return false;
    // Also check end time hasn't passed
    if (product.offerEndTimeUSA) {
      return new Date(product.offerEndTimeUSA).getTime() > Date.now();
    }
    return true;
  }
  const active = toBool(product.offerActiveIndia);
  if (!active) return false;
  // Check if offer price is valid (not 0 or empty)
  const offerPrice = product.offerPriceIndia !== undefined && product.offerPriceIndia !== null && product.offerPriceIndia !== '' ? Number(product.offerPriceIndia) : null;
  if (!offerPrice || offerPrice === 0) return false;
  if (product.offerEndTimeIndia) {
    return new Date(product.offerEndTimeIndia).getTime() > Date.now();
  }
  return true;
}

export function formatPrice(amount, currency = 'INR') {
  if (amount === undefined || amount === null) return currency === 'USD' ? '$0' : '₹0';
  if (currency === 'USD') {
    return amount.toLocaleString('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
  return amount.toLocaleString('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  });
}

export function getCurrencySymbol(currency) {
  return currency === 'USD' ? '$' : '₹';
}

export function getLocaleForCurrency(currency) {
  return currency === 'USD' ? 'en-US' : 'en-IN';
}
