import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileCode2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Link2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE, GAS_DEPLOY_STEPS, testGasConnection } from '../utils/gasScript';

interface GasTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
}

export const GasTutorialModal: React.FC<GasTutorialModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(gasUrl);
  const [activeTab, setActiveTab] = useState<'tutorial' | 'code'>('tutorial');
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      alert('複製失敗，請手動全選下方程式碼複製');
    }
  };

  const handleTestPing = async () => {
    if (!inputUrl.trim()) {
      setTestStatus({ success: false, message: '請輸入要測試的 GAS 網址' });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    const result = await testGasConnection(inputUrl.trim());
    setTestStatus(result);
    setIsTesting(false);
  };

  const handleSaveAndClose = () => {
    onSaveGasUrl(inputUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 max-h-[90vh] flex flex-col">
        
        {/* 頂部標題與關閉按鈕 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Google Apps Script (GAS) 後端串接指南
              </h3>
              <p className="text-xs text-slate-400">
                將打卡記帳資料即時、非同步寫入個人的 Google 雲端試算表
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 分頁切換 */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tutorial'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📚 Step-by-Step 部署步驟教學
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>💻 查看完整 GAS 原始碼</span>
            {copied && <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">已複製</span>}
          </button>
        </div>

        {/* 內容區域 */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {activeTab === 'tutorial' ? (
            <div className="space-y-4">
              
              {/* 重要提示卡片 */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>核心重點：部署時權限請務必設為「任何人 (Anyone)」</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Google Apps Script 網頁應用程式部署時，若將「誰可以存取 (Who has access)」設定為「任何人 (Anyone)」，前端 SPA 才能在無需讓所有旅伴登入 Google 的情況下，透過 POST 請求將打卡記錄寫入你的 Google 試算表。
                </p>
              </div>

              {/* 步驟清單 */}
              <div className="space-y-3">
                {GAS_DEPLOY_STEPS.map((s) => (
                  <div
                    key={s.step}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-all space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">{s.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pl-8">
                      {s.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* 寫入欄位架構說明 */}
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google 試算表自動寫入之欄位架構：</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-slate-700 font-mono">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">1. 寫入時間</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">2. 旅遊團名</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">3. 打卡時間</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">4. 消費項目</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">5. 金額(NTD)</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">6. 付款人</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">7. 消費分類</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">8. 打卡地點</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">9. 地圖連結</div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center font-bold">10. 備註</div>
                </div>
                <p className="text-[10px] text-blue-700/80">
                  * 程式碼內建防碰撞機制 (LockService) 與首次自動產生置中美化標題列、凍結首列與貨幣格式化。
                </p>
              </div>

            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Google Apps Script (GAS) 完整程式碼 (Code.gs)
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>已複製到剪貼簿！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>一鍵複製全部程式碼</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed max-h-[380px]">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 底部 API 網址設定與測試區 */}
        <div className="pt-4 border-t border-slate-100 shrink-0 space-y-3 bg-slate-50/50 p-4 rounded-2xl">
          <label className="block text-xs font-bold text-slate-700">
            貼上已部署完成的 Web App URL (結尾通常為 /exec)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setTestStatus(null);
              }}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={handleTestPing}
              disabled={isTesting || !inputUrl.trim()}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1 disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isTesting ? '連線測試中...' : '測試連線'}</span>
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              儲存網址
            </button>
          </div>

          {testStatus && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
