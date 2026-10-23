import React from 'react';
import { 
  DollarSign, 
  Receipt, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Utensils, 
  Car, 
  Hotel, 
  Ticket, 
  ShoppingBag, 
  MoreHorizontal,
  Info
} from 'lucide-react';
import { ExpenseRecord, TripSettings, CATEGORIES, CategoryType } from '../types';

interface DashboardProps {
  records: ExpenseRecord[];
  settings: TripSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ records, settings }) => {
  // 1. 總花費
  const totalExpense = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // 2. 總筆數
  const totalCount = records.length;

  // 3. 人數 (防止除以 0)
  const peopleCount = Math.max(1, settings.totalPeople || 1);

  // 4. 計算規則：每人平均金額 = 總花費 / 總人數，必須採用「無條件進位（Math.ceil）」至整數位
  const perPersonAmount = Math.ceil(totalExpense / peopleCount);

  // 計算無條件進位後的累積總分攤 vs 實際總花費之微小餘額（公費零錢保留）
  const roundedSum = perPersonAmount * peopleCount;
  const reserveDifference = roundedSum - totalExpense;

  // 分類統計
  const categoryStats = (Object.keys(CATEGORIES) as CategoryType[]).map((catKey) => {
    const sum = records
      .filter((r) => r.category === catKey)
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const count = records.filter((r) => r.category === catKey).length;
    const percentage = totalExpense > 0 ? (sum / totalExpense) * 100 : 0;
    return {
      category: catKey,
      sum,
      count,
      percentage,
      ...CATEGORIES[catKey],
    };
  });

  // 付款人統計
  const payerMap = records.reduce((acc, r) => {
    const payerName = r.payer || '公費預支';
    acc[payerName] = (acc[payerName] || 0) + (Number(r.amount) || 0);
    return acc;
  }, {} as Record<string, number>);

  const payerStats = Object.entries(payerMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* 核心統計看板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 卡片 1: 目前累積總花費 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/15">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4" />
              <span>目前累積總花費</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-blue-100">
              TWD (NTD)
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-sm sm:text-base font-bold text-blue-200">NT$</span>
            <span className="text-3xl sm:text-4xl font-black tracking-tight font-mono">
              {totalExpense.toLocaleString()}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-blue-100/90">
            <span>累積打卡 {totalCount} 筆</span>
            <span className="text-[11px] text-blue-200/80">包含公費預支與代墊支出</span>
          </div>
        </div>

        {/* 卡片 3: 每人平均應分攤金額 (嚴格依照無條件進位 Math.ceil) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 text-white shadow-xl shadow-teal-500/15">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4" />
              <span>每人平均應分攤金額</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>無條件進位</span>
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-sm sm:text-base font-bold text-emerald-200">NT$</span>
            <span className="text-3xl sm:text-4xl font-black tracking-tight font-mono">
              {perPersonAmount.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-100/90 font-medium">/ 每人</span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 text-xs text-emerald-100/95 space-y-1">
            <div className="flex items-center justify-between">
              <span>
                NT$ {totalExpense.toLocaleString()} ÷ {peopleCount} 人
              </span>
              <span className="font-mono text-[11px] bg-emerald-700/60 px-1.5 py-0.5 rounded">
                = NT$ {perPersonAmount.toLocaleString()}
              </span>
            </div>
            {reserveDifference > 0 && (
              <div className="text-[11px] text-emerald-200/90 flex items-center space-x-1">
                <Info className="w-3 h-3 shrink-0" />
                <span>進位多出 NT$ {reserveDifference} 可留存為旅遊小公費</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 分類佔比進度條與付款人小結 */}
      {totalExpense > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              消費分類分佈與金額比例
            </h4>
            <div className="text-xs text-slate-400">
              共涵蓋 {categoryStats.filter(c => c.sum > 0).length} 種支出分類
            </div>
          </div>

          {/* 視覺長條圖 */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {categoryStats.map((cat) => {
              if (cat.percentage === 0) return null;
              return (
                <div
                  key={cat.category}
                  style={{ width: `${cat.percentage}%` }}
                  className={`h-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                  title={`${cat.category}: NT$ ${cat.sum.toLocaleString()} (${cat.percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* 分類標籤清單 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
            {categoryStats.map((cat) => (
              <div
                key={cat.category}
                className={`p-2.5 rounded-xl border ${cat.bgColor} ${cat.borderColor} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{cat.category}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {cat.percentage > 0 ? `${cat.percentage.toFixed(0)}%` : '0%'}
                  </span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900">
                  NT$ {cat.sum.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {cat.count} 筆紀錄
                </div>
              </div>
            ))}
          </div>

          {/* 各付款人代墊匯總 */}
          {payerStats.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">各付款人支出：</span>
              {payerStats.map(([payerName, amount]) => (
                <div
                  key={payerName}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                >
                  <span className="font-bold text-blue-700">{payerName}</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-mono font-bold text-slate-900">NT$ {amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
