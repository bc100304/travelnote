import React from 'react';
import { Settings, MapPin, BarChart3, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';
import { TripSettings, ExpenseRecord } from '../types';

export type TabType = 'settings' | 'checkin' | 'summary';

interface TabNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  settings: TripSettings;
  records: ExpenseRecord[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onChangeTab,
  settings,
  records,
}) => {
  const totalExpense = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalCount = records.length;
  const hasGas = Boolean(settings.gasApiUrl && settings.gasApiUrl.trim().startsWith('http'));

  const tabs: {
    id: TabType;
    label: string;
    subLabel: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
  }[] = [
    {
      id: 'summary',
      label: '總消費與明細',
      subLabel: `NT$ ${totalExpense.toLocaleString()} (${totalCount} 筆)`,
      icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: (
        <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
          {totalCount} 筆
        </span>
      ),
    },
    {
      id: 'checkin',
      label: '打卡與記錄',
      subLabel: 'GPS 定位打卡 • 即時記帳',
      icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: (
        <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
          +記帳
        </span>
      ),
    },
    {
      id: 'settings',
      label: '資料設定',
      subLabel: `${settings.totalPeople} 位夥伴 • ${hasGas ? 'GAS 已連線' : '本機模式'}`,
      icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: hasGas ? (
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="GAS 已連線" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-amber-500" title="本機模式" />
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-1.5 sm:p-2 border border-slate-200/90 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isMobileHidden = tab.id === 'settings';
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative py-3 px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 ${
                isMobileHidden ? 'hidden sm:flex' : 'flex'
              } flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <div className="flex items-center justify-center sm:justify-start space-x-2 min-w-0">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.icon}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs sm:text-sm font-black truncate leading-tight">
                    {tab.label}
                  </div>
                  <div
                    className={`hidden sm:block text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {tab.subLabel}
                  </div>
                </div>
              </div>

              {/* 右側小徽章 (僅桌面顯示) */}
              <div className="hidden sm:flex items-center shrink-0">
                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                ) : (
                  tab.badge
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
