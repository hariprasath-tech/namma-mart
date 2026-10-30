import React, { useState } from 'react';
import { Shop, Expense, Order } from '../../types';
import { formatCurrency, formatDate } from '../../lib/format';
import {
  calculateProfitAndLoss,
  calculateDayClosingDifference,
  DayClosingResult,
} from '../../lib/classifiers';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  DollarSign,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Download,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  QrCode,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface OwnerMoneyTabProps {
  shop: Shop;
  expenses: Expense[];
  orders: Order[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export const OwnerMoneyTab: React.FC<OwnerMoneyTabProps> = ({
  shop,
  expenses,
  orders,
  onAddExpense,
}) => {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);

  // Add expense form state (< 10 seconds flow)
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('stock purchase');
  const [mode, setMode] = useState<Expense['mode']>('upi');
  const [note, setNote] = useState('');

  // Day closing state
  const [countedCash, setCountedCash] = useState('4200');
  const [dayClosedResult, setDayClosedResult] = useState<DayClosingResult | null>(null);

  // Financial calculations
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0) + 14200;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const costOfGoods = Math.round(totalSales * 0.72);
  const pnl = calculateProfitAndLoss(totalSales, costOfGoods, totalExpenses);

  const cashSales = Math.round(totalSales * 0.35);
  const upiSales = totalSales - cashSales;

  // Chart data for Daily Sales vs Expenses vs Profit
  const chartData = [
    { day: 'Mon', Sales: 8200, Expenses: 1400, Profit: 6800 },
    { day: 'Tue', Sales: 9400, Expenses: 2200, Profit: 7200 },
    { day: 'Wed', Sales: 7800, Expenses: 1100, Profit: 6700 },
    { day: 'Thu', Sales: 10500, Expenses: 3100, Profit: 7400 },
    { day: 'Fri', Sales: 12100, Expenses: 1800, Profit: 10300 },
    { day: 'Sat', Sales: 15400, Expenses: 2500, Profit: 12900 },
    { day: 'Today', Sales: totalSales, Expenses: totalExpenses, Profit: pnl.netProfit },
  ];

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onAddExpense({
      shopId: shop.id,
      amount: Number(amount),
      category,
      mode,
      date: new Date().toISOString().split('T')[0],
      note: note.trim() || undefined,
    });

    setAmount('');
    setNote('');
    setShowAddExpenseModal(false);
  };

  const handleCloseDay = () => {
    const res = calculateDayClosingDifference(cashSales, Number(countedCash));
    setDayClosedResult(res);
  };

  const handleExportMonthCSV = () => {
    const headers = 'Date,Category,Amount,PaymentMode,Note\n';
    const rows = expenses
      .map((e) => `"${e.date}","${e.category}",${e.amount},"${e.mode}","${e.note || ''}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localkart_${shop.shortName}_expenses.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Pulse & Action Banner */}
      <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-[#14201B]">
            Money, Spend & Profit Ledger
          </h2>
          <p className="text-xs text-[#4E6057]">
            Track every rupee in cash and UPI. Record operational expenses in under 10 seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMonthCSV}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCloseDayModal(true)}
            className="flex items-center gap-1.5 border-[#1F6B4A] text-[#0E3B2C]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#1F6B4A]" />
            <span>Close the Day</span>
          </Button>

          <Button
            variant="marigold"
            size="sm"
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense (10s)</span>
          </Button>
        </div>
      </div>

      {/* P&L Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs text-[#4E6057] uppercase font-bold tracking-wider">
            Total Revenue
          </span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#0E3B2C] block mt-1">
            {formatCurrency(totalSales)}
          </span>
          <span className="text-[11px] text-[#1F6B4A] font-semibold">
            {orders.length + 12} transactions recorded
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs text-[#4E6057] uppercase font-bold tracking-wider">
            Total Expenses
          </span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#D63A2F] block mt-1">
            {formatCurrency(totalExpenses)}
          </span>
          <span className="text-[11px] text-[#4E6057]">
            {expenses.length} operating receipts
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs text-[#4E6057] uppercase font-bold tracking-wider">
            Net Estimated Profit
          </span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#14201B] block mt-1">
            {formatCurrency(pnl.netProfit)}
          </span>
          <span className="text-[11px] text-[#1F6B4A] font-bold">
            Gross Margin: {pnl.marginPct}%
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs text-[#4E6057] uppercase font-bold tracking-wider">
            Cash in Hand vs UPI
          </span>
          <div className="mt-1 text-xs space-y-1">
            <div className="flex justify-between font-bold text-[#14201B]">
              <span>Cash:</span>
              <span>{formatCurrency(cashSales)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#0E3B2C]">
              <span>UPI:</span>
              <span>{formatCurrency(upiSales)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales vs Expenses vs Profit Chart */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-[#14201B]">
            Sales vs Expenses vs Net Profit (This Week)
          </h3>
          <Badge variant="subtle" size="sm">
            Daily Breakdown
          </Badge>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF3EA" />
              <XAxis dataKey="day" stroke="#4E6057" fontSize={12} />
              <YAxis stroke="#4E6057" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DDE5D9' }}
              />
              <Legend />
              <Bar dataKey="Sales" fill="#0E3B2C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#D63A2F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#FFB400" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-[#14201B]">
            Recent Operating Expenses ({expenses.length})
          </h3>
        </div>

        <div className="divide-y divide-[#DDE5D9] text-xs sm:text-sm">
          {expenses.map((exp) => (
            <div key={exp.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#14201B] capitalize">
                    {exp.category}
                  </span>
                  <Badge variant="subtle" size="sm" className="uppercase text-[10px]">
                    {exp.mode}
                  </Badge>
                </div>
                <span className="text-xs text-[#4E6057]">
                  {formatDate(exp.date)} {exp.note && `· ${exp.note}`}
                </span>
              </div>

              <span className="font-display font-bold text-base text-[#D63A2F]">
                - {formatCurrency(exp.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Modal (Under 10 Seconds Flow) */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5D9] bg-[#F7F9F4]">
              <h3 className="font-display font-bold text-lg text-[#14201B]">
                Add Expense (Under 10s)
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="e.g. 850"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-lg font-display font-bold text-[#14201B] focus:outline-[#0E3B2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs font-semibold focus:outline-[#0E3B2C]"
                  >
                    <option value="stock purchase">Stock Purchase</option>
                    <option value="electricity">Electricity / EB</option>
                    <option value="rent">Shop Rent</option>
                    <option value="salary">Staff Salary</option>
                    <option value="transport">Transport / Auto</option>
                    <option value="packaging">Packaging Bags</option>
                    <option value="repairs">Maintenance</option>
                    <option value="other">Other Expense</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                    Paid Via
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs font-semibold focus:outline-[#0E3B2C]"
                  >
                    <option value="upi">UPI / GPay</option>
                    <option value="cash">Cash Register</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Note / Vendor (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. EB Bill Mahalingapuram substation"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
                />
              </div>

              <Button type="submit" variant="palm" size="md" fullWidth>
                Save Expense
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Close the Day Modal */}
      {showCloseDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5D9] bg-[#F7F9F4]">
              <h3 className="font-display font-bold text-lg text-[#14201B]">
                Close the Day – Cash Tally
              </h3>
              <button
                onClick={() => setShowCloseDayModal(false)}
                className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#EEF3EA] p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4E6057]">Expected Cash in Drawer:</span>
                  <span className="font-bold text-sm text-[#0E3B2C]">
                    {formatCurrency(cashSales)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4E6057]">Total UPI Received:</span>
                  <span className="font-bold text-sm text-[#14201B]">
                    {formatCurrency(upiSales)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Counted Physical Cash in Hand (₹)
                </label>
                <input
                  type="number"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-lg font-display font-bold text-[#14201B] focus:outline-[#0E3B2C]"
                />
              </div>

              <Button
                variant="palm"
                size="md"
                fullWidth
                onClick={handleCloseDay}
              >
                Tally Cash Drawer
              </Button>

              {dayClosedResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1 ${
                    dayClosedResult.status === 'balanced'
                      ? 'bg-[#EEF3EA] border-[#1F6B4A] text-[#0E3B2C]'
                      : dayClosedResult.status === 'short'
                      ? 'bg-[#FFF3F2] border-[#D63A2F] text-[#D63A2F]'
                      : 'bg-[#FFFBF2] border-[#FFB400] text-[#14201B]'
                  }`}
                >
                  <p className="font-bold text-sm">
                    {dayClosedResult.status === 'balanced'
                      ? '✓ Perfect Cash Balance'
                      : dayClosedResult.status === 'short'
                      ? `⚠️ Cash Shortage: ${formatCurrency(Math.abs(dayClosedResult.difference))}`
                      : `Cash Excess: +${formatCurrency(dayClosedResult.difference)}`}
                  </p>
                  <p>
                    Expected: {formatCurrency(dayClosedResult.expectedCash)} · Counted: {formatCurrency(dayClosedResult.countedCash)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
