import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabNavigation, TabType } from './components/TabNavigation';
import { SettingsView } from './components/SettingsView';
import { ExpenseForm } from './components/ExpenseForm';
import { Dashboard } from './components/Dashboard';
import { RecordList } from './components/RecordList';
import { SettingsModal } from './components/SettingsModal';
import { GasTutorialModal } from './components/GasTutorialModal';
import { BackupModal } from './components/BackupModal';
import { ShareModal } from './components/ShareModal';
import { ExpenseRecord, TripSettings } from './types';
import { SAMPLE_RECORDS } from './utils/sampleData';
import { syncRecordToGas, fetchFromGas, deleteRecordFromGas } from './utils/gasScript';
import { generateStandaloneHtml } from './utils/standaloneHtmlGenerator';
import { parseSettingsFromUrl } from './utils/shareHelper';
import { ArrowRight, Receipt, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'travel_trip_settings_v1';
const RECORDS_STORAGE_KEY = 'travel_expense_records_v1';

export default function App() {
  // 分頁切換狀態：'summary' (總消費與明細) | 'checkin' (打卡與記錄) | 'settings' (資料設定)
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  // 旅遊設定狀態
  const [settings, setSettings] = useState<TripSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved settings', e);
    }
    return {
      tripName: '2026 東京春櫻漫遊 5 日遊',
      startDate: '2026-03-25',
      endDate: '2026-03-30',
      totalPeople: 4,
      gasApiUrl: '',
      defaultPayer: '公費預支',
      payersList: ['公費預支', '小明代墊', '小華代墊', '阿哲代墊'],
    };
  });

  // 打卡記帳明細列表
  const [records, setRecords] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved records', e);
    }
    return SAMPLE_RECORDS;
  });

  // 同步狀態
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Modals 控制開關
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 提示訊息 Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 從 Google Apps Script 中央資料庫同步全體資料與設定
  const handleSyncFromGas = async (overrideUrl?: string, silent = false) => {
    const targetUrl = (overrideUrl || settings.gasApiUrl || '').trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      if (!silent) {
        showToast('請先於「資料設定」輸入有效的 Google Apps Script 網址', 'error');
        setActiveTab('settings');
      }
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetchFromGas(targetUrl);
      if (res.success && res.records) {
        setRecords(res.records);
        if (res.settings) {
          setSettings((prev) => ({
            ...prev,
            tripName: res.settings?.tripName || prev.tripName,
            totalPeople: res.settings?.totalPeople || prev.totalPeople,
            defaultPayer: res.settings?.defaultPayer || prev.defaultPayer,
          }));
        }
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLastSyncTime(timeStr);
        if (!silent) {
          showToast(`☁️ 已同步 Google Sheet 最新資料 (${res.records.length} 筆)！`, 'success');
        }
      } else {
        if (!silent) {
          showToast(res.message || '讀取 Google Sheet 失敗', 'error');
        }
      }
    } catch (err: any) {
      if (!silent) showToast(`同步失敗: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // 首次載入時檢查網址是否有旅伴分享的行程與 GAS 參數，並自動向 GAS 拉取中央資料
  useEffect(() => {
    let effectiveGasUrl = settings.gasApiUrl;
    const urlSettings = parseSettingsFromUrl();
    if (urlSettings) {
      setSettings((prev) => ({
        ...prev,
        ...urlSettings,
        payersList: urlSettings.payersList && urlSettings.payersList.length > 0 ? urlSettings.payersList : prev.payersList,
      }));
      if (urlSettings.gasApiUrl) {
        effectiveGasUrl = urlSettings.gasApiUrl;
      }
      showToast(
        `🎉 已載入「${urlSettings.tripName || '旅遊公費'}」行程參數！`,
        'success'
      );
    }

    // 若有設定 GAS 網址，頁面一開啟時自動發送 API 請求從 Google Sheet 載入所有歷程資料
    if (effectiveGasUrl && effectiveGasUrl.trim().startsWith('http')) {
      handleSyncFromGas(effectiveGasUrl, true);
    }
  }, []);

  // 持久化儲存設定
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
  }, [settings]);

  // 持久化儲存打卡明細
  useEffect(() => {
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records to localStorage', e);
    }
  }, [records]);

  // 新增打卡記帳處理 (即時前端新增 + 異步背景發送 GAS)
  const handleAddRecord = async (newRecordData: Omit<ExpenseRecord, 'id' | 'createdAt' | 'syncStatus'>) => {
    const recordId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const hasGasConfigured = Boolean(settings.gasApiUrl && settings.gasApiUrl.trim().startsWith('http'));

    const initialRecord: ExpenseRecord = {
      ...newRecordData,
      id: recordId,
      createdAt: Date.now(),
      syncStatus: hasGasConfigured ? 'pending' : 'local_only',
    };

    // 1. 立即更新前端清單與頂部看板
    setRecords((prev) => [initialRecord, ...prev]);
    showToast(`✅ 已新增打卡「${initialRecord.itemName}」NT$ ${initialRecord.amount.toLocaleString()}`);

    // 2. 若有設定 GAS Web App API URL，發送非同步 POST 請求寫入 Google Sheet
    if (hasGasConfigured) {
      try {
        const result = await syncRecordToGas(initialRecord, settings.gasApiUrl);
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  syncStatus: result.success ? 'synced' : 'failed',
                  syncError: result.success ? undefined : result.message,
                }
              : r
          )
        );
        if (result.success) {
          showToast(`☁️ 已成功同步寫入 Google 試算表！`, 'success');
          // 短暫延遲後從 Google Sheet 重新整理，確保全欄位與順序完全與雲端同步
          setTimeout(() => {
            handleSyncFromGas(settings.gasApiUrl, true);
          }, 1200);
        } else {
          showToast(`⚠️ 寫入 Google 試算表失敗：${result.message}`, 'error');
        }
      } catch (err: any) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, syncStatus: 'failed', syncError: err?.message || '網路異常' }
              : r
          )
        );
      }
    }
  };

  // 手動重試同步至 Google Apps Script
  const handleRetrySyncRecord = async (id: string) => {
    if (!settings.gasApiUrl || !settings.gasApiUrl.trim().startsWith('http')) {
      showToast('請先設定有效的 Google Apps Script API 網址', 'error');
      setActiveTab('settings');
      return;
    }

    const recordToSync = records.find((r) => r.id === id);
    if (!recordToSync) return;

    const result = await syncRecordToGas(recordToSync, settings.gasApiUrl);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              syncStatus: result.success ? 'synced' : 'failed',
              syncError: result.success ? undefined : result.message,
            }
          : r
      )
    );

    if (result.success) {
      showToast('☁️ 重新同步成功！已寫入 Google 試算表', 'success');
    } else {
      showToast(`⚠️ 同步失敗：${result.message}`, 'error');
    }
  };

  // 刪除打卡紀錄 (支援向 Google Sheet 發送刪除請求)
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('確定要刪除這筆打卡記帳嗎？')) return;

    // 1. 本地樂觀移除
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('已刪除打卡紀錄', 'info');

    // 2. 若有設定 GAS，向雲端發送刪除指令
    if (settings.gasApiUrl && settings.gasApiUrl.trim().startsWith('http')) {
      try {
        await deleteRecordFromGas(id, settings.gasApiUrl);
        showToast('☁️ 已從 Google 試算表同步刪除！', 'success');
        // 重新同步拉取最新資料
        setTimeout(() => {
          handleSyncFromGas(settings.gasApiUrl, true);
        }, 1200);
      } catch (err: any) {
        console.warn('GAS Delete error', err);
      }
    }
  };

  // 下載免伺服器雙擊直接執行的單一 HTML 檔案
  const handleDownloadStandalone = () => {
    const htmlContent = generateStandaloneHtml({
      tripName: settings.tripName,
      totalPeople: settings.totalPeople,
      gasApiUrl: settings.gasApiUrl,
    });
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.tripName || '旅遊公費記帳簿'}_獨立單檔版.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 已成功下載獨立單一 HTML 檔案，可直接雙擊在任何瀏覽器離線開啟！', 'success');
  };

  const latestRecord = records[0];

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 頂部導航列 (提供旅遊名稱、日期、人數等基本資料，並提供同步/重新整理按鈕) */}
      <Header
        settings={settings}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onSync={() => handleSyncFromGas()}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onDownloadStandalone={handleDownloadStandalone}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* 核心內容區 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-3.5 sm:py-7 space-y-4 sm:space-y-6">
        
        {/* 三大功能切換選單 (功能1：資料設定 / 功能2：打卡與記錄 / 功能3：總消費與明細) */}
        <section aria-label="功能分頁切換">
          <TabNavigation
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            settings={settings}
            records={records}
          />
        </section>

        {/* 依點選之功能分別帶出內容 */}
        
        {/* ==================== 功能 1：資料設定 ==================== */}
        {activeTab === 'settings' && (
          <section aria-label="功能1：資料設定" className="animate-in fade-in duration-200">
            <SettingsView
              settings={settings}
              onSave={(newSettings) => {
                setSettings(newSettings);
                showToast('資料設定已儲存更新！');
              }}
              onOpenGasTutorial={() => setIsGasModalOpen(true)}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
              onDownloadStandalone={handleDownloadStandalone}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
          </section>
        )}

        {/* ==================== 功能 2：打卡與記錄 ==================== */}
        {activeTab === 'checkin' && (
          <section aria-label="功能2：打卡與記錄" className="space-y-6 animate-in fade-in duration-200">
            {/* 打卡表單 */}
            <ExpenseForm
              settings={settings}
              onAddRecord={handleAddRecord}
            />

            {/* 最新打卡摘要與快速跳轉至功能 3 */}
            {latestRecord && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium">剛剛記錄的打卡項目</div>
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {latestRecord.itemName} • <span className="font-mono text-blue-600">NT$ {latestRecord.amount.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-normal ml-1.5">({latestRecord.payer})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('summary')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <span>前往「總消費與明細」</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* ==================== 功能 3：總消費與明細 ==================== */}
        {activeTab === 'summary' && (
          <section aria-label="功能3：總消費與明細" className="space-y-6 animate-in fade-in duration-200">
            
            {/* 1. 即時統計看板 (總花費、總筆數、Math.ceil 無條件進位每人均攤) */}
            <Dashboard records={records} settings={settings} />

            {/* 2. 歷史紀錄明細列表 (依時間倒序、搜尋、分類篩選、Google Maps 連結、刪除) */}
            <RecordList
              records={records}
              onDeleteRecord={handleDeleteRecord}
              onRetrySyncRecord={handleRetrySyncRecord}
              totalPeople={settings.totalPeople}
            />
          </section>
        )}

      </main>

      {/* 頁尾 */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>✈️ 旅遊公費記帳簿 • 三大功能模組化設計 (資料設定 / 打卡記帳 / 總消費與明細)</span>
          <div className="flex items-center space-x-3 text-slate-500">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-indigo-600 font-bold hover:underline transition-colors"
            >
              分享記帳簿網址
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="hover:text-blue-600 transition-colors"
            >
              資料設定
            </button>
            <span>•</span>
            <button
              onClick={() => setIsGasModalOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              GAS 後端教學
            </button>
            <span>•</span>
            <button
              onClick={handleDownloadStandalone}
              className="hover:text-blue-600 transition-colors"
            >
              下載單檔 index.html
            </button>
            <span>•</span>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              資料匯出
            </button>
          </div>
        </div>
      </footer>

      {/* 浮動 Toast 通知 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce-short">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center space-x-2 border ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-blue-600 text-white border-blue-700'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 分享此記帳簿網址 Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        settings={settings}
      />

      {/* 設定 Modal (亦可從 Header 觸發) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          showToast('旅遊設定已更新！');
        }}
        onOpenGasTutorial={() => setIsGasModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* GAS 教學與程式碼 Modal */}
      <GasTutorialModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        gasUrl={settings.gasApiUrl}
        onSaveGasUrl={(url) => {
          setSettings((prev) => ({ ...prev, gasApiUrl: url }));
          showToast('GAS API 網址已儲存！');
        }}
      />

      {/* 備份與資料管理 Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        records={records}
        settings={settings}
        onImportRecords={(newRecords) => {
          setRecords(newRecords);
          showToast('已成功載入外部記帳資料！');
        }}
        onLoadSampleData={() => {
          setRecords(SAMPLE_RECORDS);
          showToast('已載入 2026 東京春櫻自由行示範資料！');
        }}
        onClearAllRecords={() => {
          setRecords([]);
          showToast('已清空所有打卡紀錄', 'info');
        }}
      />

    </div>
  );
}
