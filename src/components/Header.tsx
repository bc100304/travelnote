import React from 'react';
import { 
  Settings, 
  FileCode2, 
  Download, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Plane, 
  Calendar, 
  Users,
  Share2,
  RefreshCw
} from 'lucide-react';
import { TripSettings } from '../types';

interface HeaderProps {
  settings: TripSettings;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  onSync: () => void;
  onOpenSettings: () => void;
  onOpenGasModal: () => void;
  onOpenBackupModal: () => void;
  onDownloadStandalone: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isSyncing = false,
  lastSyncTime,
  onSync,
  onOpenSettings,
  onOpenGasModal,
  onOpenBackupModal,
  onDownloadStandalone,
  onOpenShareModal,
}) => {
  const hasGas = Boolean(settings.gasApiUrl && settings.gasApiUrl.trim().startsWith('http'));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* 旅遊團主要資訊 */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {settings.tripName || '未命名旅遊公費團'}
                </h1>
                <button
                  onClick={onOpenShareModal}
                  className="text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
                  title="分享此記帳簿網址給旅伴"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenSettings}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
                  title="編輯旅遊設定"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-0.5">
                {(settings.startDate || settings.endDate) && (
                  <span className="flex items-center space-x-1 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {settings.startDate || '未定'} ~ {settings.endDate || '未定'}
                    </span>
                  </span>
                )}
                <span className="flex items-center space-x-1 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{settings.totalPeople} 位夥伴</span>
                </span>
                
                {/* GAS 狀態標籤 */}
                <button
                  onClick={onOpenGasModal}
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                    hasGas
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="點擊查看 Google Apps Script 串接狀態與教學"
                >
                  {hasGas ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>GAS 雲端同步中</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>本機記帳 (點擊設定 GAS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 右側操作按鈕區 */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* 核心：同步 / 重新整理按鈕 (多手機即時拉取最新資料) */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer border ${
                isSyncing
                  ? 'bg-blue-50 text-blue-400 border-blue-200 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 active:scale-95'
              }`}
              title="從 Google Sheet 重新整理讀取最新打卡與金額"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '同步中...' : '同步/重新整理'}</span>
              {lastSyncTime && !isSyncing && (
                <span className="hidden md:inline text-[10px] font-normal opacity-80 pl-1 font-mono">
                  ({lastSyncTime})
                </span>
              )}
            </button>

            {/* 桌機專屬快捷按鈕 */}
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={onOpenShareModal}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="分享此記帳簿網址給旅伴"
              >
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>分享</span>
              </button>

              <button
                onClick={onOpenGasModal}
                className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <FileCode2 className="w-4 h-4" />
                <span>GAS 教學</span>
              </button>

              <button
                onClick={onDownloadStandalone}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="匯出成可離線在瀏覽器雙擊開啟執行的單一 HTML 檔案"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>下載單檔</span>
              </button>

              <button
                onClick={onOpenBackupModal}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="備份 / 匯出 CSV / 匯入資料"
              >
                <Database className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="設定旅遊資訊與人數"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
