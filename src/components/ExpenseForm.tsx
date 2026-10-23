import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Loader2, 
  Utensils, 
  Car, 
  Hotel, 
  Ticket, 
  ShoppingBag, 
  MoreHorizontal,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ExpenseRecord, CategoryType, CATEGORIES, TripSettings } from '../types';

interface ExpenseFormProps {
  settings: TripSettings;
  onAddRecord: (record: Omit<ExpenseRecord, 'id' | 'createdAt' | 'syncStatus'>) => Promise<void>;
  isSubmitting?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  settings,
  onAddRecord,
  isSubmitting = false,
}) => {
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<CategoryType>('餐飲');
  const [payer, setPayer] = useState(settings.defaultPayer || '公費預支');
  const [customPayerInput, setCustomPayerInput] = useState('');
  const [isCustomPayer, setIsCustomPayer] = useState(false);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // 初始化預設時間 (格式: YYYY-MM-DDTHH:mm)
  const getCurrentDateTimeString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // 自動根據經緯度或手動輸入生成 Google Maps 超連結
  const getMapUrl = (): string => {
    if (coordinates && location.startsWith('GPS:')) {
      return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    }
    if (location && location.trim() !== '' && location !== '請手動取得GPS定位' && location !== '無打卡地點') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
    }
    return '';
  };

  const mapUrl = getMapUrl();

  // 取得瀏覽器 Geolocation GPS 定位 (直接拉取 GPS 定位)
  const fetchCurrentGps = (isSilent = false) => {
    if (!navigator.geolocation) {
      setLocation('請手動取得GPS定位');
      setGpsMessage('瀏覽器未支援定位功能，請手動取得GPS定位或輸入地點');
      return;
    }

    setIsLocating(true);
    setGpsMessage('正在自動取得 GPS 定位中...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setCoordinates({ lat, lng });
        setLocation(`GPS: ${lat}, ${lng}`);
        setGpsMessage(`定位成功 (精度約 ±${Math.round(position.coords.accuracy)}m)`);
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation auto-fetch error:', error);
        // 若無法辨識時顯示：請手動取得GPS定位
        setLocation('請手動取得GPS定位');
        setGpsMessage('無法辨識GPS定位：請點擊「取得 GPS 定位」手動重試或輸入地點');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 30000,
      }
    );
  };

  // 當載入或進入打卡功能時，直接拉 GPS 定位
  useEffect(() => {
    setTime(getCurrentDateTimeString());
    fetchCurrentGps(true);
  }, []);

  const resetTimeToNow = () => {
    setTime(getCurrentDateTimeString());
  };

  // 快捷加金額
  const handleQuickAddAmount = (val: number) => {
    const current = typeof amount === 'number' ? amount : 0;
    setAmount(current + val);
  };

  // 常用消費項目快捷標籤
  const commonSuggestions = [
    '拉麵晚餐',
    '超商飲料點心',
    '地鐵一日券',
    '晴空塔門票',
    '計程車分攤',
    '飯店住宿尾款',
    '名產伴手禮',
    '景點咖啡廳',
  ];

  // 送出打卡記帳
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('請填寫消費項目名稱');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('請填寫大於 0 的金額');
      return;
    }

    const finalPayer = isCustomPayer ? (customPayerInput.trim() || '自訂付款人') : payer;

    await onAddRecord({
      tripName: settings.tripName || '未命名旅遊團',
      time: time ? time.replace('T', ' ') : getCurrentDateTimeString().replace('T', ' '),
      itemName: itemName.trim(),
      amount: Math.round(Number(amount)),
      payer: finalPayer,
      category,
      location: location.trim() || '無打卡地點',
      coordinates: coordinates || undefined,
      mapUrl,
      notes: notes.trim(),
    });

    // 清空表單欄位以供下一次打卡
    setItemName('');
    setAmount('');
    setNotes('');
    setLocation('');
    setCoordinates(null);
    setGpsMessage(null);
    setTime(getCurrentDateTimeString());
  };

  // 分類圖示對照
  const renderCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case '餐飲': return <Utensils className="w-4 h-4" />;
      case '交通': return <Car className="w-4 h-4" />;
      case '住宿': return <Hotel className="w-4 h-4" />;
      case '門票': return <Ticket className="w-4 h-4" />;
      case '購物': return <ShoppingBag className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              新增打卡記帳
            </h2>
            <p className="text-xs text-slate-400">
              記錄旅遊即時支出，打卡定位並可同步寫入 Google Sheet
            </p>
          </div>
        </div>

        {settings.gasApiUrl ? (
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            GAS 即時同步已啟用
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            本機暫存 (可設定 GAS 雲端備份)
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 消費項目名稱與快捷晶片 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. 消費項目名稱 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="例：一蘭拉麵、晴空塔快速通關票、夜間居酒屋"
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          />
          <div className="hidden sm:flex items-center flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center">
              <Sparkles className="w-3 h-3 mr-0.5 text-amber-500" />
              快速填入：
            </span>
            {commonSuggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => setItemName(suggestion)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* 金額與快捷加總 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. 金額 (NTD) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                NT$
              </span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono font-bold text-slate-900 transition-all"
              />
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 mt-2">
              <span className="text-[11px] text-slate-400 font-medium">快速增額：</span>
              {[100, 500, 1000, 5000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-mono font-semibold transition-colors"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
              {amount !== '' && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-2 py-0.5 rounded-lg text-slate-400 hover:text-rose-500 text-xs"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {/* 付款人選擇 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              3. 付款人 <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {settings.payersList.map((p) => {
                const isSelected = !isCustomPayer && payer === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setPayer(p);
                      setIsCustomPayer(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomPayer(true)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  isCustomPayer
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                + 自訂付款人
              </button>
            </div>

            {isCustomPayer && (
              <input
                type="text"
                value={customPayerInput}
                onChange={(e) => setCustomPayerInput(e.target.value)}
                placeholder="輸入其他付款人姓名（如：小美代墊）"
                className="w-full px-3.5 py-2 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* 消費分類 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            4. 消費分類 <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(Object.keys(CATEGORIES) as CategoryType[]).map((catKey) => {
              const meta = CATEGORIES[catKey];
              const isSelected = category === catKey;
              return (
                <button
                  type="button"
                  key={catKey}
                  onClick={() => setCategory(catKey)}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                    isSelected
                      ? `border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-500/20 shadow-xs font-bold`
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-medium'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {renderCategoryIcon(catKey)}
                  </div>
                  <span className="text-xs">{catKey}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 打卡地點與地圖超連結 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                5. 打卡地點 (支援 GPS 定位或店家名稱)
              </label>
              <button
                type="button"
                onClick={() => fetchCurrentGps(false)}
                disabled={isLocating}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>定位中...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5" />
                    <span>重新定位</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={location}
                onFocus={() => {
                  if (location === '請手動取得GPS定位') {
                    setLocation('');
                  }
                }}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (coordinates && !e.target.value.startsWith('GPS:')) {
                    setCoordinates(null);
                  }
                }}
                placeholder="請手動取得GPS定位"
                className={`w-full px-4 py-2.5 rounded-2xl border transition-colors ${
                  location === '請手動取得GPS定位'
                    ? 'border-amber-300 bg-amber-50/60 text-amber-900 font-medium'
                    : 'border-slate-200 text-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
              />
              {location === '請手動取得GPS定位' && (
                <button
                  type="button"
                  onClick={() => fetchCurrentGps(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span>定位</span>
                </button>
              )}
            </div>

            {gpsMessage && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                {gpsMessage}
              </p>
            )}

            {/* 即時地圖超連結預覽 */}
            {mapUrl ? (
              <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="truncate mr-2 font-mono text-[11px] text-slate-500">
                  🗺️ {mapUrl}
                </span>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 hover:underline"
                >
                  <span>開啟地圖</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                💡 填寫地點或取得 GPS 後，將自動生成 Google Maps 超連結
              </p>
            )}
          </div>

          {/* 打卡時間與備註 */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  6. 打卡時間
                </label>
                <button
                  type="button"
                  onClick={resetTimeToNow}
                  className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center space-x-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>設為現在時間</span>
                </button>
              </div>
              <input
                type="datetime-local"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                7. 備註說明
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：包含小明阿華飲料、發票放夾層、現金結帳"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>儲存並同步至 Google Sheet 中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>新增打卡記帳</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
