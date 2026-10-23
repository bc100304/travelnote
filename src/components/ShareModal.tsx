import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  Users, 
  Calendar, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { TripSettings } from '../types';
import { generateShareUrl, copyShareLink, getLineShareUrl } from '../utils/shareHelper';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TripSettings;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);

  if (!isOpen) return null;

  const shareUrl = generateShareUrl(settings);
  const lineShareUrl = getLineShareUrl(settings);
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const handleCopy = async () => {
    const success = await copyShareLink(settings);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `【${settings.tripName || '旅遊公費記帳簿'}】`,
          text: `旅伴人數 ${settings.totalPeople} 位，即時記帳與均攤網址：`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or not supported
      }
    } else {
      handleCopy();
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                分享此記帳簿網址
              </h3>
              <p className="text-xs text-slate-500">
                邀請旅伴一同加入記帳，設定與資料自動同步
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 行程資訊卡 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            將分享的行程內容
          </div>
          <div className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
            <span>✈️</span>
            <span>{settings.tripName || '未命名旅遊公費團'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium pt-1">
            <span className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{settings.totalPeople} 位夥伴均攤</span>
            </span>
            {(settings.startDate || settings.endDate) && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{settings.startDate || '未定'} ~ {settings.endDate || '未定'}</span>
              </span>
            )}
            {settings.gasApiUrl && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                含 Google Sheet 串接設定
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            💡 旅伴開啟此網址後，行程名稱、均攤人數與 Google Sheet 試算表設定將自動載入，無需手動再次設定！
          </p>
        </div>

        {/* 快速分享按鈕群 */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* LINE 快速分享 */}
          <a
            href={lineShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
          >
            <span className="font-extrabold text-base leading-none">LINE</span>
            <span>LINE 傳送給旅伴</span>
          </a>

          {/* 手機原生分享 / 複製連結 */}
          {canNativeShare ? (
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm shadow-blue-500/20 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>更多分享管道</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm shadow-blue-500/20 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已複製連結！' : '一鍵複製分享'}</span>
            </button>
          )}
        </div>

        {/* 網址輸入框與複製 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            專屬記帳簿網址
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>已複製</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code 面板 */}
        <div className="border border-slate-200/80 rounded-2xl p-4 bg-white text-center space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>旅伴手機掃描加入</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="text-slate-400 hover:text-slate-600 font-medium"
            >
              {showQrCode ? '收合' : '展開'}
            </button>
          </div>

          {showQrCode && (
            <div className="flex flex-col items-center justify-center pt-1 pb-2">
              <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs inline-block">
                <img
                  src={qrImageUrl}
                  alt="行程記帳 QR Code"
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                請旅伴使用手機相機或 LINE 掃描此行動條碼，即可直接開啟
              </p>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            完成並關閉
          </button>
        </div>

      </div>
    </div>
  );
};
