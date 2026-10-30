import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Product, Shop, Offer } from '../types';
import { useLocationStore } from '../store/location';
import { CompareView } from '../components/compare/CompareView';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProductId = searchParams.get('productId');

  const { userCoords } = useLocationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-1');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, o] = await Promise.all([
          api.getProducts(),
          api.getShops(),
          api.getOffers(),
        ]);
        setProducts(p);
        setShops(s);
        setOffers(o);
        if (urlProductId && p.some((item) => item.id === urlProductId)) {
          setSelectedProductId(urlProductId);
        } else if (p.length > 0) {
          setSelectedProductId(p[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [urlProductId]);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setSearchParams({ productId: id });
  };

  if (loading || products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#4E6057]">
        <p>Loading comparison engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <CompareView
        products={products}
        selectedProductId={selectedProductId}
        onSelectProduct={handleSelectProduct}
        userCoords={userCoords}
        offers={offers}
        shops={shops}
      />
    </div>
  );
};
