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
              
              {/* 🚨 Failed to fetch 快速排查錦囊 */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-2.5">
                <div className="flex items-center space-x-2 font-black text-rose-900 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>遇見「Failed to fetch」？請確認這 3 點（99% 皆因以下造成）：</span>
                </div>
                <div className="space-y-1.5 text-xs text-rose-900/90 leading-relaxed pl-1">
                  <div className="flex items-start space-x-1.5">
                    <span className="font-black text-rose-700 shrink-0">①</span>
                    <span>
                      <strong>【最常見】誰可以存取 (Who has access) 必須設為「所有人 (Anyone)」</strong>：<br/>
                      若設為「僅限我自己」或「Google 帳號使用者」，Google 會強制轉跳登入頁，瀏覽器因跨域安全機制直接報錯 <code>Failed to fetch</code>。請至 Apps Script 點「部署 → 管理部署作業 → 編輯」，改為「所有人」。
                    </span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-black text-rose-700 shrink-0">②</span>
                    <span>
                      <strong>修改 Code.gs 後必須選擇「新版本 (New version)」部署</strong>：<br/>
                      Apps Script 單純按儲存不會生效！必須在「管理部署作業」點鉛筆圖示，將「版本」切換為「新版本」後按下部署。
                    </span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="font-black text-rose-700 shrink-0">③</span>
                    <span>
                      <strong>網址結尾必須是 <code>/exec</code></strong>：<br/>
                      切勿使用 <code>/dev</code> 測試網址（需開發者登入），也不要直接貼上試算表的網址。
                    </span>
                  </div>
                </div>
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
