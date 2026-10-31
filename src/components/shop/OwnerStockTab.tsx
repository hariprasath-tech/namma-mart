import React, { useState } from 'react';
import { Shop, Product, Offer, Supplier } from '../../types';
import { formatCurrency } from '../../lib/format';
import { classifyExpiryState } from '../../lib/classifiers';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Search,
  Plus,
  Minus,
  Barcode,
  Share2,
  Download,
  Upload,
  AlertTriangle,
  History,
  Check,
  X,
  Calendar,
  MessageCircle,
  Trash2,
} from 'lucide-react';

interface OwnerStockTabProps {
  shop: Shop;
  offers: Offer[];
  products: Product[];
  suppliers: Supplier[];
  onUpdateStock: (offerId: string, currentStock: number, delta: number) => void;
  onUpdatePrice: (offerId: string, newPrice: number) => void;
  onOpenAddModal: () => void;
  onDeleteOffer?: (offerId: string) => void;
}

export const OwnerStockTab: React.FC<OwnerStockTabProps> = ({
  shop,
  offers,
  products,
  suppliers,
  onUpdateStock,
  onUpdatePrice,
  onOpenAddModal,
  onDeleteOffer,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Filter items for this shop
  const shopOffers = offers.filter((o) => o.shopId === shop.id);

  // Generate enriched stock item rows
  const stockRows = shopOffers
    .map((off) => {
      const prod = products.find((p) => p.id === off.productId);
      if (!prod) return null;

      // Simulated realistic cost price and margins
      const costPrice = Math.round(off.price * 0.82);
      const marginPct = Math.round(((off.price - costPrice) / off.price) * 100);
      const reorderLevel = 5;

      // Simulated expiry date for perishable food staples
      let expiryDate: string | undefined = undefined;
      if (prod.category === 'Grocery') {
        expiryDate = '2026-11-05'; // Expiring in 6 days
      } else if (prod.category === 'Pharmacy') {
        expiryDate = '2027-06-30';
      }

      const expiryState = classifyExpiryState(expiryDate);
      const isLowStock = off.stock <= reorderLevel;
      const isOutOfStock = off.stock === 0;

      return {
        offer: off,
        product: prod,
        costPrice,
        marginPct,
        reorderLevel,
        expiryDate,
        expiryState,
        isLowStock,
        isOutOfStock,
      };
    })
    .filter(Boolean) as any[];

  // Filter by query and category
  const filteredRows = stockRows.filter(({ product }) => {
    const matchesCat = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesQ =
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesQ;
  });

  // Items needing reorder (stock <= 5)
  const lowStockItems = stockRows.filter((r) => r.isLowStock);

  // Share reorder list via WhatsApp
  const handleWhatsAppReorder = () => {
    const lines = lowStockItems.map(
      (it) => `• ${it.product.name} (Qty needed: ${15 - it.offer.stock} ${it.product.unit})`
    );
    const message = encodeURIComponent(
      `*LocalKart Reorder List for ${shop.name}*\nDate: ${new Date().toLocaleDateString('en-IN')}\n\n${lines.join('\n')}\n\nPlease confirm dispatch time.`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Product,Category,Stock,Unit,CostPrice,SellPrice,MarginPct,ReorderLevel\n';
    const rows = stockRows
      .map(
        (r) =>
          `"${r.product.name}","${r.product.category}",${r.offer.stock},"${r.product.unit}",${r.costPrice},${r.offer.price},${r.marginPct}%,${r.reorderLevel}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localkart_${shop.shortName}_inventory.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Action Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DDE5D9] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#4E6057] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs font-semibold text-[#14201B]"
          >
            <option value="All">All Categories</option>
            <option value="Grocery">Grocery</option>
            <option value="Electronics">Electronics</option>
            <option value="Stationery">Stationery</option>
            <option value="Hardware">Hardware</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Fashion">Fashion</option>
            <option value="Home needs">Home needs</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBarcodeModal(true)}
            className="flex items-center gap-1.5"
          >
            <Barcode className="w-4 h-4 text-[#0E3B2C]" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReorderModal(true)}
            className="flex items-center gap-1.5 border-[#1F6B4A] text-[#0E3B2C]"
          >
            <Share2 className="w-4 h-4 text-[#1F6B4A]" />
            <span>Reorder List ({lowStockItems.length})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button variant="palm" size="sm" onClick={onOpenAddModal}>
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-2xl border border-[#DDE5D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#EEF3EA] border-b border-[#DDE5D9] text-[#0E3B2C] font-bold">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Margin</th>
                <th className="py-3 px-4">Expiry Status</th>
                <th className="py-3 px-4 text-center">In-Stock Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5D9]">
              {filteredRows.map((row) => (
                <tr
                  key={row.offer.id}
                  className={`hover:bg-[#F7F9F4] transition-colors ${
                    row.isOutOfStock
                      ? 'bg-[#FFF3F2]'
                      : row.isLowStock
                      ? 'bg-[#FFFBF2]'
                      : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.product.image}
                        alt={row.product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#DDE5D9] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#14201B]">
                            {row.product.name}
                          </span>
                          {row.isOutOfStock && (
                            <Badge variant="chilli" size="sm">
                              Out of Stock
                            </Badge>
                          )}
                          {!row.isOutOfStock && row.isLowStock && (
                            <Badge variant="marigold" size="sm">
                              Low ({row.offer.stock})
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-[#4E6057]">
                          {row.product.category} · {row.product.unit}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-[#4E6057]">
                    {formatCurrency(row.costPrice)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[#0E3B2C]">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={row.offer.price}
                        onChange={(e) =>
                          onUpdatePrice(row.offer.id, Number(e.target.value))
                        }
                        className="w-16 px-1.5 py-1 bg-[#F7F9F4] border border-[#BDCBB8] rounded-md font-bold text-[#14201B] text-center focus:outline-[#0E3B2C]"
                      />
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-[#1F6B4A]">
                    {row.marginPct}%
                  </td>

                  <td className="py-3.5 px-4">
                    {row.expiryDate ? (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-full ${
                          row.expiryState === 'expired'
                            ? 'bg-[#D63A2F]/15 text-[#D63A2F]'
                            : row.expiryState === 'expiring_soon'
                            ? 'bg-[#FFB400]/20 text-[#14201B]'
                            : 'bg-[#EEF3EA] text-[#0E3B2C]'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {row.expiryDate}
                        {row.expiryState === 'expiring_soon' && ' (in 6d)'}
                      </span>
                    ) : (
                      <span className="text-[#4E6057]">Non-perishable</span>
                    )}
                  </td>

                  {/* Fast stock controls (+ / - buttons at least 44px for elderly/busy merchants) */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-[#F7F9F4] p-1 rounded-xl border border-[#BDCBB8]">
                      <button
                        onClick={() =>
                          onUpdateStock(row.offer.id, row.offer.stock, -1)
                        }
                        className="w-9 h-9 rounded-lg bg-white border border-[#DDE5D9] hover:bg-[#EEF3EA] flex items-center justify-center font-bold text-base active:scale-95 transition-transform"
                        aria-label="Decrease stock"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-10 text-center font-display font-extrabold text-base text-[#0E3B2C]">
                        {row.offer.stock}
                      </span>

                      <button
                        onClick={() =>
                          onUpdateStock(row.offer.id, row.offer.stock, 1)
                        }
                        className="w-9 h-9 rounded-lg bg-white border border-[#DDE5D9] hover:bg-[#EEF3EA] flex items-center justify-center font-bold text-base active:scale-95 transition-transform"
                        aria-label="Increase stock"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder List Modal */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5D9] bg-[#F7F9F4]">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#0E3B2C]" />
                <h3 className="font-display font-bold text-lg text-[#14201B]">
                  Supplier Purchase Reorder List
                </h3>
              </div>
              <button
                onClick={() => setShowReorderModal(false)}
                className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#4E6057]">
                Items below safety stock level ({lowStockItems.length} items). Share prefilled list with your suppliers via WhatsApp in one tap.
              </p>

              <div className="bg-[#F7F9F4] rounded-xl p-3 border border-[#DDE5D9] max-h-56 overflow-y-auto space-y-2 text-xs">
                {lowStockItems.map((it) => (
                  <div key={it.offer.id} className="flex justify-between py-1 border-b border-[#DDE5D9] last:border-none">
                    <span className="font-bold text-[#14201B]">{it.product.name}</span>
                    <span className="text-[#D63A2F] font-semibold">
                      Current: {it.offer.stock} → Order: {15 - it.offer.stock} {it.product.unit}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant="marigold"
                size="md"
                fullWidth
                onClick={handleWhatsAppReorder}
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Share Purchase Order on WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal (BarcodeDetector API simulation) */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5D9] bg-[#F7F9F4]">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-[#0E3B2C]" />
                <h3 className="font-display font-bold text-lg text-[#14201B]">
                  Barcode Scanner (Camera / SKU)
                </h3>
              </div>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="w-full h-44 bg-[#14201B] rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden">
                <Barcode className="w-16 h-16 text-[#FFB400] opacity-80 animate-pulse" />
                <span className="text-xs text-white/70 mt-2 font-mono">
                  Pointing camera at barcode / EAN-13...
                </span>
                {/* Red laser line */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#D63A2F] shadow-[0_0_8px_#D63A2F] animate-bounce"></div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block">
                  Or Enter SKU / Barcode Manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 8901030382910"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
                  />
                  <Button
                    variant="palm"
                    size="sm"
                    onClick={() => {
                      setSearch('Rice');
                      setShowBarcodeModal(false);
                    }}
                  >
                    Lookup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
