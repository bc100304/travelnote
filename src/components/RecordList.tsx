import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ExternalLink, 
  Trash2, 
  Clock, 
  User, 
  FileText, 
  CloudCheck, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Tag,
  ArrowUpDown,
  Utensils, 
  Car, 
  Hotel, 
  Ticket, 
  ShoppingBag, 
  MoreHorizontal
} from 'lucide-react';
import { ExpenseRecord, CategoryType, CATEGORIES } from '../types';

interface RecordListProps {
  records: ExpenseRecord[];
  onDeleteRecord: (id: string) => void;
  onRetrySyncRecord: (id: string) => void;
  totalPeople: number;
}

export const RecordList: React.FC<RecordListProps> = ({
  records,
  onDeleteRecord,
  onRetrySyncRecord,
  totalPeople,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // 搜尋與篩選邏輯
  const filteredRecords = records.filter((r) => {
    // 分類篩選
    if (selectedCategory !== '全部' && r.category !== selectedCategory) {
      return false;
    }
    // 關鍵字搜尋 (項目名稱、打卡地點、付款人、備註)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchItem = r.itemName.toLowerCase().includes(q);
      const matchLocation = r.location.toLowerCase().includes(q);
      const matchPayer = r.payer.toLowerCase().includes(q);
      const matchNotes = (r.notes || '').toLowerCase().includes(q);
      if (!matchItem && !matchLocation && !matchPayer && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  // 排序處理 (預設依打卡時間倒序排列)
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.time).getTime() - new Date(a.time).getTime() || b.createdAt - a.createdAt;
    }
    if (sortBy === 'oldest') {
      return new Date(a.time).getTime() - new Date(b.time).getTime() || a.createdAt - b.createdAt;
    }
    if (sortBy === 'amount_desc') {
      return b.amount - a.amount;
    }
    if (sortBy === 'amount_asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    await onRetrySyncRecord(id);
    setRetryingId(null);
  };

  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case '餐飲': return <Utensils className="w-4 h-4" />;
      case '交通': return <Car className="w-4 h-4" />;
      case '住宿': return <Hotel className="w-4 h-4" />;
      case '門票': return <Ticket className="w-4 h-4" />;
      case '購物': return <ShoppingBag className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 頂部標題、搜尋與篩選控制區 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              打卡記帳歷史明細
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono">
              {filteredRecords.length} 筆
            </span>
          </div>

          {/* 排序選擇器 */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
              排序：
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">打卡時間（最新優先）</option>
              <option value="oldest">打卡時間（最舊優先）</option>
              <option value="amount_desc">金額（高到低）</option>
              <option value="amount_asc">金額（低到高）</option>
            </select>
          </div>
        </div>

        {/* 搜尋列與分類快選 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* 關鍵字搜尋 */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋項目名稱、地點、付款人或備註..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 分類篩選標籤 */}
          <div className="md:col-span-7 flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['全部', ...Object.keys(CATEGORIES)].map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 紀錄卡片清單 (倒序顯示) */}
      {sortedRecords.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">查無打卡記帳紀錄</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== '全部'
              ? '找不到符合條件的打卡資料，請嘗試清除關鍵字或篩選條件。'
              : '目前尚未有任何消費打卡，請在上方填寫送出第一筆旅遊公費記帳！'}
          </p>
          {(searchTerm || selectedCategory !== '全部') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('全部');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              重設所有篩選條件
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRecords.map((record) => {
            const meta = CATEGORIES[record.category] || CATEGORIES['其他'];
            const perPersonShare = Math.ceil(record.amount / Math.max(1, totalPeople));

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-blue-400/80 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* 左側：分類圖示、品名、地點、付款人、備註 */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    
                    {/* 分類圓形徽章 */}
                    <div className={`p-2.5 rounded-2xl ${meta.bgColor} ${meta.textColor} border ${meta.borderColor} shrink-0 mt-0.5`}>
                      {getCategoryIcon(record.category)}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      
                      {/* 上方小標籤欄：分類、時間、付款人 */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${meta.bgColor} ${meta.textColor}`}>
                          {record.category}
                        </span>
                        
                        <span className="flex items-center text-slate-400 font-mono text-[11px] space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{record.time}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center space-x-1">
                          <User className="w-2.5 h-2.5 text-blue-500" />
                          <span>{record.payer}</span>
                        </span>

                        {/* 同步狀態 Badge */}
                        {record.syncStatus === 'synced' && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>已同步試算表</span>
                          </span>
                        )}

                        {record.syncStatus === 'failed' && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>同步失敗</span>
                          </span>
                        )}

                        {record.syncStatus === 'local_only' && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                            <span>本機紀錄</span>
                          </span>
                        )}
                      </div>

                      {/* 消費項目標題 */}
                      <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {record.itemName}
                      </div>

                      {/* 地點資訊與 Google Maps 超連結 */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        {record.location && record.location !== '無打卡地點' ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-medium text-slate-700">{record.location}</span>
                            {record.mapUrl && (
                              <a
                                href={record.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-0.5 ml-1 text-blue-600 hover:text-blue-800 hover:underline font-bold text-[11px]"
                                title="在 Google Maps 開啟此打卡地點"
                              >
                                <span>(開啟地圖)</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">未記錄地點</span>
                        )}

                        {/* 備註說明 */}
                        {record.notes && (
                          <div className="flex items-center space-x-1 text-slate-500 italic text-[11px] bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>{record.notes}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* 右側：金額、均攤提示、操作按鈕 */}
                  <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                        <span className="text-xs font-bold text-slate-400 mr-1">NT$</span>
                        {record.amount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        均攤約 NT$ {perPersonShare.toLocaleString()} / 人
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* 若尚未同步或失敗，顯示手動重試按鈕 */}
                      {record.syncStatus !== 'synced' && (
                        <button
                          onClick={() => handleRetry(record.id)}
                          disabled={retryingId === record.id}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="重新同步至 Google 試算表"
                        >
                          <RefreshCw className={`w-4 h-4 ${retryingId === record.id ? 'animate-spin text-blue-600' : ''}`} />
                        </button>
                      )}

                      {/* 刪除按鈕 */}
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要刪除「${record.itemName}」(NT$ ${record.amount}) 這筆打卡紀錄嗎？`)) {
                            onDeleteRecord(record.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="刪除此筆打卡"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
