import React, { useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Trash2, 
  Sparkles, 
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ExpenseRecord, TripSettings } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExpenseRecord[];
  settings: TripSettings;
  onImportRecords: (newRecords: ExpenseRecord[]) => void;
  onLoadSampleData: () => void;
  onClearAllRecords: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  records,
  settings,
  onImportRecords,
  onLoadSampleData,
  onClearAllRecords,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 匯出 CSV (包含 UTF-8 BOM \uFEFF，確保 Microsoft Excel 開啟不會亂碼)
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('目前尚無資料可匯出');
      return;
    }

    const headers = ['旅遊團名', '打卡時間', '消費項目', '金額 (NTD)', '付款人', '分類', '打卡地點', '地圖連結', '備註'];
    const rows = records.map((r) => [
      `"${(r.tripName || '').replace(/"/g, '""')}"`,
      `"${(r.time || '').replace(/"/g, '""')}"`,
      `"${(r.itemName || '').replace(/"/g, '""')}"`,
      r.amount,
      `"${(r.payer || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.mapUrl || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${settings.tripName || '旅遊公費'}_記帳明細_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 匯出 JSON 備份檔
  const handleExportJSON = () => {
    const backupData = {
      settings,
      records,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${settings.tripName || '旅遊公費'}_完整備份_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 匯入 JSON 備份檔
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportRecords(parsed);
          alert(`成功匯入 ${parsed.length} 筆打卡資料！`);
          onClose();
        } else if (parsed && Array.isArray(parsed.records)) {
          onImportRecords(parsed.records);
          alert(`成功匯入 ${parsed.records.length} 筆備份資料！`);
          onClose();
        } else {
          alert('匯入失敗：檔案格式不相符');
        }
      } catch (err) {
        alert('解析 JSON 檔案失敗，請確認檔案格式是否正確');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        
        {/* 標題與關閉 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">資料管理與備份</h3>
              <p className="text-xs text-slate-400">匯出試算表、備份或體驗範例資料</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          
          {/* 匯出 CSV */}
          <button
            onClick={handleExportCSV}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                  匯出 Excel CSV 報表
                </div>
                <div className="text-[11px] text-slate-400">
                  UTF-8 BOM 相容，可直接以 Excel 開啟不亂碼
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </button>

          {/* 匯出 JSON 備份 */}
          <button
            onClick={handleExportJSON}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-800">
                  匯出 JSON 備份檔案
                </div>
                <div className="text-[11px] text-slate-400">
                  完整備份行程設定、旅伴人數與所有打卡記錄
                </div>
              </div>
            </div>
          </button>

          {/* 匯入 JSON 備份 */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-800">
                    匯入 JSON 備份檔案
                  </div>
                  <div className="text-[11px] text-slate-400">
                    載入先前備份的記帳檔案還原記錄
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* 一鍵載入示範資料 */}
          <button
            onClick={() => {
              if (records.length > 0) {
                if (!window.confirm('載入示範資料將會覆蓋現有打卡記錄，確定要載入嗎？')) return;
              }
              onLoadSampleData();
              onClose();
            }}
            className="w-full p-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-100/60 transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-900">
                  載入「2026 東京自由行」示範資料
                </div>
                <div className="text-[11px] text-amber-700/80">
                  自動填入 6 筆各類別真實情境記帳與打卡座標
                </div>
              </div>
            </div>
          </button>

          {/* 清空所有資料 */}
          <button
            onClick={() => {
              if (window.confirm('⚠️ 警告：確定要清空所有打卡紀錄嗎？此操作無法復原！')) {
                onClearAllRecords();
                onClose();
              }
            }}
            className="w-full p-3 rounded-2xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50 text-rose-700 transition-all flex items-center space-x-3 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-800">
                清空所有打卡紀錄
              </div>
              <div className="text-[11px] text-rose-600/80">
                重置清單為空白狀態
              </div>
            </div>
          </button>

        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
          >
            關閉視窗
          </button>
        </div>

      </div>
    </div>
  );
};
