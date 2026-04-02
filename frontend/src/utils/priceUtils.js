// Price utility helpers for multi-currency support

export function getProductPrice(product, country) {
  if (!product) return 0;
  if (country === 'US') return product.priceUSD || 0;
  return product.price || 0;
}

export function getProductOriginalPrice(product, country) {
  if (!product) return 0;
  if (country === 'US') return product.originalPriceUSD || 0;
  return product.originalPrice || 0;
}

export function getOfferPrice(product, country) {
  if (!product) return 0;
  if (country === 'US') return product.offerPriceUSDUSA || 0;
  return product.offerPriceIndia || 0;
}

export function getOfferActive(product, country) {
  if (!product) return false;
  if (country === 'US') return product.offerActiveUSA || false;
  return product.offerActiveIndia || false;
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
