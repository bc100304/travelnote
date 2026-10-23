import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Calendar, 
  Link2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  Plus,
  Trash2,
  FileCode2,
  Database,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  QrCode,
  Smartphone
} from 'lucide-react';
import { TripSettings } from '../types';
import { testGasConnection } from '../utils/gasScript';
import { generateShareUrl, copyShareLink, getLineShareUrl } from '../utils/shareHelper';

interface SettingsViewProps {
  settings: TripSettings;
  onSave: (newSettings: TripSettings) => void;
  onOpenGasTutorial: () => void;
  onOpenBackupModal: () => void;
  onDownloadStandalone: () => void;
  onOpenShareModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSave,
  onOpenGasTutorial,
  onOpenBackupModal,
  onDownloadStandalone,
  onOpenShareModal,
}) => {
  const [formData, setFormData] = useState<TripSettings>({ ...settings });
  const [newPayerName, setNewPayerName] = useState('');
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const handleTestGas = async () => {
    if (!formData.gasApiUrl) {
      setTestResult({ success: false, message: '請先輸入 Google Apps Script API 網址' });
      return;
    }
    setIsTestingGas(true);
    setTestResult(null);
    const res = await testGasConnection(formData.gasApiUrl);
    setTestResult(res);
    setIsTestingGas(false);
  };

  const handleAddPayer = () => {
    const trimmed = newPayerName.trim();
    if (!trimmed) return;
    if (formData.payersList.includes(trimmed)) {
      alert('該付款人已存在於清單中');
      return;
    }
    setFormData({
      ...formData,
      payersList: [...formData.payersList, trimmed],
    });
    setNewPayerName('');
  };

  const handleRemovePayer = (payerToRemove: string) => {
    if (formData.payersList.length <= 1) {
      alert('至少需保留一位付款人');
      return;
    }
    const updated = formData.payersList.filter((p) => p !== payerToRemove);
    setFormData({
      ...formData,
      payersList: updated,
      defaultPayer: formData.defaultPayer === payerToRemove ? updated[0] : formData.defaultPayer,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
  };

  const handleCopyCurrentShareLink = async () => {
    const success = await copyShareLink(formData);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const currentShareUrl = generateShareUrl(formData);
  const currentLineUrl = getLineShareUrl(formData);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentShareUrl)}`;

  return (
    <div className="space-y-6">
      
      {/* 標題卡片 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                資料設定
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              設定旅遊團行程名稱、總人數、Google Sheet Web App API 網址與付款人名單
            </p>
          </div>
        </div>

        {/* 快捷操作按鈕 */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-indigo-600" />
            <span>分享此記帳簿網址</span>
          </button>
          <button
            type="button"
            onClick={onOpenGasTutorial}
            className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileCode2 className="w-4 h-4" />
            <span>GAS 程式碼與教學</span>
          </button>
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>匯出 / 備份管理</span>
          </button>
          <button
            type="button"
            onClick={onDownloadStandalone}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>下載單檔 index.html</span>
          </button>
        </div>
      </div>

      {/* 主設定表單 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 基本旅遊設定卡片 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b pb-3 border-slate-100">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>旅遊行程基本資料</span>
            </h3>

            {/* 旅遊團名稱 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                旅遊團名稱 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.tripName}
                onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
                placeholder="例如：2026 東京春櫻漫遊 5 日遊"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
              />
            </div>

            {/* 旅遊日期區間 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>出發日期</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>回程日期</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                />
              </div>
            </div>

            {/* 旅遊總人數 (用於均攤計算) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>旅遊總人數 (每人均攤基礎)</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  採無條件進位 (Math.ceil)
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, totalPeople: Math.max(1, formData.totalPeople - 1) })}
                  className="w-12 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  -
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalPeople}
                    onChange={(e) => setFormData({ ...formData, totalPeople: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full text-center py-2.5 rounded-2xl border border-slate-200 font-mono font-black text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">人</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, totalPeople: formData.totalPeople + 1 })}
                  className="w-12 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                每筆花費將依此人數採用無條件進位（Math.ceil）至整數，避免小數點分攤糾紛。
              </p>
            </div>

            {/* 付款人清單 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                常用付款人名單
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.payersList.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePayer(p)}
                      className="text-slate-400 hover:text-rose-500 font-bold ml-1 transition-colors cursor-pointer"
                      title="移除此付款人"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPayerName}
                  onChange={(e) => setNewPayerName(e.target.value)}
                  placeholder="輸入新付款人姓名（如：小美代墊）"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddPayer}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增</span>
                </button>
              </div>
            </div>

          </div>

          {/* Google Sheet Web App API 設定卡片 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Google Sheet 雲端寫入串接 (GAS)</span>
                </h3>
                <button
                  type="button"
                  onClick={onOpenGasTutorial}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>步驟教學</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Google Sheet Web App API URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.gasApiUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, gasApiUrl: e.target.value });
                      setTestResult(null);
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400">
                    設定值將自動儲存於瀏覽器 localStorage
                  </span>
                  <button
                    type="button"
                    onClick={handleTestGas}
                    disabled={isTestingGas || !formData.gasApiUrl}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isTestingGas ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span>連線測試中...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3 h-3 text-slate-500" />
                        <span>連線測試 (Ping)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-start space-x-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed">{testResult.message}</div>
                </div>
              )}

              {/* 說明提示塊 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>如何取得此 API 網址？</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-500">
                  <li>建立 Google 試算表，進入「擴充功能」→「Apps Script」。</li>
                  <li>貼上專屬 GAS 程式碼並點擊「儲存」。</li>
                  <li>右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」。</li>
                  <li>存取權務必設為「任何人 (Anyone)」，複製產生的網址貼回此處。</li>
                </ol>
              </div>

            </div>

            {/* 儲存設定按鈕 */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>設定已成功儲存！</span>
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                儲存資料設定
              </button>
            </div>

          </div>

        </div>

      </form>

      {/* ======================================================== */}
      {/* 旅遊行程基本資料設定完成後的「分享此記帳簿網址」功能區塊 */}
      {/* ======================================================== */}
      <div className={`rounded-3xl p-6 sm:p-7 border transition-all duration-300 ${
        saveSuccess 
          ? 'bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 border-indigo-300 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20' 
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/25 shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    分享此記帳簿網址給旅伴
                  </h3>
                  {saveSuccess && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                      設定已完成！
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  將此記帳簿專屬網址傳送給旅伴，開啟後會自動套用行程名稱、均攤人數與 Google Sheet 試算表串接！
                </p>
              </div>
            </div>

            {/* 網址預覽列與複製 */}
            <div className="pt-2 flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={currentShareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
              />
              <button
                type="button"
                onClick={handleCopyCurrentShareLink}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已複製！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製連結</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右側快速分享動作按鈕 */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <a
              href={currentLineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="font-black text-sm">LINE</span>
              <span>LINE 傳送給旅伴</span>
            </a>

            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>{showQrCode ? '收合 QR Code' : '手機掃碼 (QR Code)'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenShareModal}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-4 h-4" />
              <span>完整分享面板</span>
            </button>
          </div>

        </div>

        {/* 展開之 QR Code 面板 */}
        {showQrCode && (
          <div className="mt-5 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs shrink-0">
              <img
                src={qrImageUrl}
                alt="記帳簿專屬 QR Code"
                className="w-32 h-32 object-contain rounded-lg"
                loading="lazy"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="text-xs font-bold text-slate-800">
                旅伴手機掃描加入記帳
              </div>
              <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                只要請身旁的旅伴打開手機相機或 LINE 掃描器對準 QR Code，即可直接以瀏覽器開啟此記帳簿，並立即套用【{formData.tripName || '旅遊公費'}】與 {formData.totalPeople} 人均攤設定！
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start space-x-2 text-[11px] text-indigo-600 font-bold">
                <span>✓ 跨手機免安裝</span>
                <span>•</span>
                <span>✓ 免費免登入</span>
                <span>•</span>
                <span>✓ 同步試算表</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
