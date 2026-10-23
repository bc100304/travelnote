import React, { useState } from 'react';
import { 
  X, 
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
  Share2
} from 'lucide-react';
import { TripSettings } from '../types';
import { testGasConnection } from '../utils/gasScript';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TripSettings;
  onSave: (newSettings: TripSettings) => void;
  onOpenGasTutorial: () => void;
  onOpenShareModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onOpenGasTutorial,
  onOpenShareModal,
}) => {
  const [formData, setFormData] = useState<TripSettings>({ ...settings });
  const [newPayerName, setNewPayerName] = useState('');
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                旅遊公費設定
              </h3>
              <p className="text-xs text-slate-400">
                設定行程資訊、分攤人數與 Google Sheet 串接
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

        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* 旅遊團名稱 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              旅遊團名稱
            </label>
            <input
              type="text"
              required
              value={formData.tripName}
              onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
              placeholder="例如：2026 京都大阪賞櫻公費團"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            />
          </div>

          {/* 旅遊日期區間 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                出發日期
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                結束日期
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* 旅遊總人數 (分攤計算基礎) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                旅遊總人數 (用於計算每人平均分攤)
              </label>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                採無條件進位 (Math.ceil)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, totalPeople: Math.max(1, formData.totalPeople - 1) })}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                required
                value={formData.totalPeople}
                onChange={(e) => setFormData({ ...formData, totalPeople: Math.max(1, parseInt(e.target.value) || 1) })}
                className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, totalPeople: formData.totalPeople + 1 })}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* 付款人清單管理 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              常用付款人名單
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.payersList.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                >
                  <span>{p}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePayer(p)}
                    className="text-slate-400 hover:text-rose-500 ml-1"
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
                placeholder="新增付款人（例：阿哲代墊）"
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddPayer}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增</span>
              </button>
            </div>
          </div>

          {/* Google Sheet Web App API URL */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Google Sheet Web App API URL
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGasTutorial();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 hover:underline"
              >
                <HelpCircle className="w-3 h-3" />
                <span>查看 GAS 設定教學</span>
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="url"
                value={formData.gasApiUrl}
                onChange={(e) => {
                  setFormData({ ...formData, gasApiUrl: e.target.value });
                  setTestResult(null);
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestGas}
                  disabled={isTestingGas || !formData.gasApiUrl}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50 transition-colors"
                >
                  {isTestingGas ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      <span>連線測試中...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3 text-slate-500" />
                      <span>測試 API 連線</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-400">
                  設定值將自動儲存於瀏覽器 localStorage
                </span>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 ${
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
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {onOpenShareModal && (
              <button
                type="button"
                onClick={() => {
                  onSave(formData);
                  onClose();
                  onOpenShareModal();
                }}
                className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>儲存並分享網址</span>
              </button>
            )}
            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                儲存並套用
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
