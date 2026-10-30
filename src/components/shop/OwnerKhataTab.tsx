import React, { useState } from 'react';
import { Shop, KhataEntry } from '../../types';
import { formatCurrency, formatDate } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Wallet,
  PlusCircle,
  MessageCircle,
  Phone,
  CheckCircle2,
  Calendar,
  X,
  Clock,
} from 'lucide-react';

interface OwnerKhataTabProps {
  shop: Shop;
  khataEntries: KhataEntry[];
  onAddKhataEntry: (entry: Omit<KhataEntry, 'id'>) => void;
}

export const OwnerKhataTab: React.FC<OwnerKhataTabProps> = ({
  shop,
  khataEntries,
  onAddKhataEntry,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+91 9');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'credit' | 'payment'>('credit');
  const [note, setNote] = useState('');

  // Group balances per customer
  const customerMap = khataEntries.reduce((acc, entry) => {
    if (!acc[entry.customerName]) {
      acc[entry.customerName] = {
        name: entry.customerName,
        phone: entry.phone || '+91 98420 12345',
        balance: 0,
        entries: [],
        lastDate: entry.date,
      };
    }
    const delta = entry.type === 'credit' ? entry.amount : -entry.amount;
    acc[entry.customerName].balance += delta;
    acc[entry.customerName].entries.push(entry);
    return acc;
  }, {} as Record<string, { name: string; phone: string; balance: number; entries: KhataEntry[]; lastDate: string }>);

  const customerList = Object.values(customerMap);
  const totalMoneyToCollect = customerList.reduce(
    (sum, c) => sum + Math.max(0, c.balance),
    0
  );

  const handleSendReminder = (customer: (typeof customerList)[0]) => {
    const text = encodeURIComponent(
      `Vanakkam ${customer.name}, friendly reminder from ${shop.name}: Your pending account balance is ${formatCurrency(customer.balance)}. You can settle via UPI or when you next visit. Thank you!`
    );
    window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;

    onAddKhataEntry({
      shopId: shop.id,
      customerName: customerName.trim(),
      phone: phone.trim() || undefined,
      type,
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      note: note.trim() || undefined,
    });

    setCustomerName('');
    setAmount('');
    setNote('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 shadow-md border border-[#1F6B4A] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-[#FFB400] tracking-wider block">
            Money to Collect (Khata Ledger)
          </span>
          <span className="font-display font-extrabold text-3xl sm:text-4xl text-white block mt-1">
            {formatCurrency(totalMoneyToCollect)}
          </span>
          <p className="text-xs text-white/80 mt-1">
            {customerList.length} active customer credit accounts in Pollachi town
          </p>
        </div>

        <Button
          variant="marigold"
          size="md"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Credit / Payment</span>
        </Button>
      </div>

      {/* Customer Accounts Ledger */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg text-[#14201B]">
          Customer Credit Accounts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customerList.map((customer) => {
            const hasOverdue = customer.balance > 0;

            return (
              <div
                key={customer.name}
                className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#BDCBB8] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-[#14201B]">
                        {customer.name}
                      </h4>
                      <span className="text-xs text-[#4E6057] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-bold text-xl text-[#0E3B2C] block">
                        {formatCurrency(customer.balance)}
                      </span>
                      <span className="text-[11px] text-[#4E6057]">
                        {customer.balance > 0 ? 'Due to collect' : 'Settled'}
                      </span>
                    </div>
                  </div>

                  {/* Overdue Ageing Tag */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-[#4E6057]">Last Transaction:</span>
                    <span className="font-semibold text-[#14201B]">
                      {formatDate(customer.lastDate)}
                    </span>
                    {hasOverdue && (
                      <Badge variant="subtle" size="sm" className="bg-[#FFB400]/20 text-[#14201B] font-bold">
                        Aging: 8–30 days
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDE5D9] flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder(customer)}
                    className="flex-1 flex items-center justify-center gap-1.5 border-[#1F6B4A] text-[#0E3B2C]"
                  >
                    <MessageCircle className="w-4 h-4 text-[#1F6B4A]" />
                    <span>WhatsApp Reminder</span>
                  </Button>

                  <Button
                    variant="palm"
                    size="sm"
                    onClick={() => {
                      setCustomerName(customer.name);
                      setType('payment');
                      setShowAddModal(true);
                    }}
                  >
                    Receive Payment
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Khata Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5D9] bg-[#F7F9F4]">
              <h3 className="font-display font-bold text-lg text-[#14201B]">
                Record Khata Credit or Payment
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('credit')}
                  className={`p-3 rounded-xl border-2 font-bold text-sm text-center ${
                    type === 'credit'
                      ? 'border-[#D63A2F] bg-[#FFF3F2] text-[#D63A2F]'
                      : 'border-[#DDE5D9] text-[#4E6057]'
                  }`}
                >
                  Give Credit (பற்று)
                </button>
                <button
                  type="button"
                  onClick={() => setType('payment')}
                  className={`p-3 rounded-xl border-2 font-bold text-sm text-center ${
                    type === 'payment'
                      ? 'border-[#1F6B4A] bg-[#EEF3EA] text-[#0E3B2C]'
                      : 'border-[#DDE5D9] text-[#4E6057]'
                  }`}
                >
                  Receive Cash (வரவு)
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senthil Kumar (Ther Nilayam)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Phone Number (for WhatsApp reminders)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-lg font-display font-bold text-[#14201B] focus:outline-[#0E3B2C]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Note / Item description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 bags Ponni Rice"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
                />
              </div>

              <Button type="submit" variant="palm" size="md" fullWidth>
                Save Khata Record
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
