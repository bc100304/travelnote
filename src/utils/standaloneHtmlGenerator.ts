/**
 * 產生可直接在瀏覽器雙擊開啟執行的單一 index.html 檔案內容
 * 嚴格支援三大功能分頁切換：
 * 功能1：資料設定
 * 功能2：打卡與記錄
 * 功能3：總消費與明細
 */
export function generateStandaloneHtml(initialData?: {
  tripName?: string;
  totalPeople?: number;
  gasApiUrl?: string;
}): string {
  const tripName = initialData?.tripName || '2026 東京春櫻漫遊 5 日遊';
  const totalPeople = initialData?.totalPeople || 4;
  const gasApiUrl = initialData?.gasApiUrl || '';

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>旅遊公費記帳簿 - Travel Expense Tracker</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts 繁體中文與字型 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Noto Sans TC', system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      -webkit-tap-highlight-color: transparent;
    }
  </style>
</head>
<body class="min-h-screen bg-slate-50 text-slate-800 pb-20">

  <!-- 頂部導航列 (提供旅遊名稱、日期、人數等基本資料) -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-5xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md text-xl">
          ✈️
        </div>
        <div>
          <h1 id="topTripTitle" class="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
            ${tripName}
          </h1>
          <div class="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span id="topTravelersCount">${totalPeople} 位旅伴</span>
            <span>•</span>
            <span id="gasStatusBadge" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${gasApiUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
              ${gasApiUrl ? '● GAS 已連線' : '○ 本機儲存'}
            </span>
          </div>
        </div>
      </div>
      <button onclick="switchTab('settings')" class="hidden sm:flex px-3 py-1.5 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors items-center text-xs sm:text-sm font-semibold border border-slate-200">
        ⚙️ 資料設定
      </button>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">

    <!-- 功能切換選單 (總消費與明細在左，打卡與記錄在右) -->
    <section aria-label="功能分頁切換" class="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
        <button id="tabBtnSummary" onclick="switchTab('summary')" class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 flex flex-col sm:flex-row sm:items-center space-x-0 sm:space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20">
          <span class="text-base">📊</span>
          <span class="font-bold">總消費與明細</span>
        </button>

        <button id="tabBtnCheckin" onclick="switchTab('checkin')" class="py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 flex flex-col sm:flex-row sm:items-center space-x-0 sm:space-x-2 text-slate-600 hover:bg-slate-50 font-semibold text-xs sm:text-sm">
          <span class="text-base">📍</span>
          <span class="font-bold">打卡與記錄</span>
        </button>

        <button id="tabBtnSettings" onclick="switchTab('settings')" class="hidden sm:flex py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 flex-col sm:flex-row sm:items-center space-x-0 sm:space-x-2 text-slate-600 hover:bg-slate-50 font-semibold text-xs sm:text-sm">
          <span class="text-base">⚙️</span>
          <span class="font-bold">資料設定</span>
        </button>
      </div>
    </section>

    <!-- ==================== 資料設定 ==================== -->
    <section id="viewSettings" class="hidden space-y-5">
      <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <span class="text-xl">⚙️</span>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-slate-900">旅遊行程與 Google Sheet 資料設定</h2>
            <p class="text-xs text-slate-400">設定行程名稱、總分攤人數與 Google Apps Script Web App API</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">旅遊團名稱</label>
            <input type="text" id="setTripName" value="${tripName}" class="w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold">
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700">旅遊總人數 (分攤計算基礎)</label>
              <span class="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">無條件進位</span>
            </div>
            <input type="number" id="setTotalPeople" min="1" value="${totalPeople}" class="w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold font-mono">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">Google Sheet Web App API URL</label>
          <input type="url" id="setGasUrl" value="${gasApiUrl}" placeholder="https://script.google.com/macros/s/.../exec" class="w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono">
          <p class="text-[11px] text-slate-500 mt-1">留空則僅儲存於本機瀏覽器。填入後每筆打卡會自動發送 POST 寫入 Google 試算表最下方。</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onclick="loadSampleData()" class="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold">
            ✨ 載入示範資料
          </button>
          <div class="flex items-center space-x-2">
            <button type="button" onclick="shareTrackerUrl()" class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-colors">
              🔗 分享此記帳簿網址
            </button>
            <button type="button" onclick="saveSettings()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20">
              儲存設定
            </button>
          </div>
        </div>

        <!-- 旅遊行程基本資料設定完成後的分享功能區塊 -->
        <div id="standaloneShareCard" class="mt-4 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs space-y-2">
          <div class="font-bold text-slate-800 flex items-center justify-between">
            <span class="flex items-center space-x-1.5 text-indigo-900 font-black">
              <span>🔗</span>
              <span>分享此記帳簿網址給旅伴</span>
            </span>
            <span class="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
              自動套用行程與分攤
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <input type="text" id="standaloneShareInput" readonly class="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono text-slate-600 truncate" />
            <button type="button" onclick="copyStandaloneShare()" class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer">
              複製連結
            </button>
            <button type="button" onclick="shareToLine()" class="px-3.5 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer">
              LINE 分享
            </button>
          </div>
          <p class="text-[11px] text-slate-500">
            💡 旅伴點擊連結開啟後，將自動載入此行程名稱、分攤人數與 Google Sheet 試算表串接！
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== 打卡與記錄 ==================== -->
    <section id="viewCheckin" class="space-y-5">
      <div class="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <span class="text-xl">📍</span>
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900">新增打卡記帳</h2>
              <p class="text-xs text-slate-400">支援 GPS 定位打卡，並自動生成 Google Maps 超連結</p>
            </div>
          </div>
          <span class="text-xs text-slate-400">即時計算均攤</span>
        </div>

        <form id="expenseForm" onsubmit="handleFormSubmit(event)" class="space-y-4">
          <!-- 項目名稱與金額 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">消費項目名稱 <span class="text-rose-500">*</span></label>
              <input type="text" id="itemName" required placeholder="例：一蘭拉麵、晴空塔門票、計程車" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">金額 (NTD) <span class="text-rose-500">*</span></label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">NT$</span>
                <input type="number" id="itemAmount" required min="1" step="1" placeholder="0" class="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold font-mono">
              </div>
              <div class="hidden sm:flex items-center space-x-1.5 mt-1.5">
                <button type="button" onclick="quickAddAmount(100)" class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-mono font-medium">+100</button>
                <button type="button" onclick="quickAddAmount(500)" class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-mono font-medium">+500</button>
                <button type="button" onclick="quickAddAmount(1000)" class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-mono font-medium">+1,000</button>
              </div>
            </div>
          </div>

          <!-- 分類選擇與付款人 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">消費分類 <span class="text-rose-500">*</span></label>
              <div class="grid grid-cols-3 gap-2" id="categorySelector">
                <button type="button" onclick="selectCategory('餐飲')" class="cat-btn py-2 px-2 rounded-xl border border-blue-500 bg-blue-50 text-blue-700 text-xs font-bold text-center" data-category="餐飲">🍜 餐飲</button>
                <button type="button" onclick="selectCategory('交通')" class="cat-btn py-2 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold text-center" data-category="交通">🚅 交通</button>
                <button type="button" onclick="selectCategory('住宿')" class="cat-btn py-2 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold text-center" data-category="住宿">🏨 住宿</button>
                <button type="button" onclick="selectCategory('門票')" class="cat-btn py-2 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold text-center" data-category="門票">🎟️ 門票</button>
                <button type="button" onclick="selectCategory('購物')" class="cat-btn py-2 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold text-center" data-category="購物">🛍️ 購物</button>
                <button type="button" onclick="selectCategory('其他')" class="cat-btn py-2 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold text-center" data-category="其他">📦 其他</button>
              </div>
              <input type="hidden" id="selectedCategory" value="餐飲">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">付款人 <span class="text-rose-500">*</span></label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button type="button" onclick="selectPayer('公費預支')" class="payer-tag px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-400 bg-blue-50 text-blue-700">公費預支</button>
                <button type="button" onclick="selectPayer('小明代墊')" class="payer-tag px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700">小明代墊</button>
                <button type="button" onclick="selectPayer('小華代墊')" class="payer-tag px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700">小華代墊</button>
              </div>
              <input type="text" id="customPayer" required placeholder="或自行輸入付款人名稱" value="公費預支" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs">
            </div>
          </div>

          <!-- 打卡地點與地圖超連結生成 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-slate-700">打卡地點</label>
                <button type="button" onclick="fetchCurrentGps()" id="gpsBtn" class="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1">
                  <span>🎯 取得 GPS 定位</span>
                </button>
              </div>
              <input type="text" id="itemLocation" oninput="updateMapPreview()" placeholder="輸入地點/店家名稱，或點擊上方 GPS" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <div id="mapPreviewNotice" class="mt-1.5 text-[11px] text-slate-500 truncate flex items-center space-x-1">
                <span>🗺️ 地圖連結：</span>
                <a id="mapPreviewLink" href="#" target="_blank" class="text-blue-600 hover:underline truncate">填寫地點後自動生成</a>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-slate-700">打卡時間</label>
                <button type="button" onclick="resetToCurrentTime()" class="text-xs text-slate-500 hover:text-blue-600 font-semibold">
                  設為現在
                </button>
              </div>
              <input type="datetime-local" id="itemTime" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono">
            </div>
          </div>

          <!-- 備註 -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">備註說明</label>
            <input type="text" id="itemNotes" placeholder="例如：含四人飲料與服務費、發票放夾層" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
          </div>

          <!-- 送出按鈕 -->
          <div class="pt-2">
            <button type="submit" id="submitBtn" class="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2">
              <span>✨ 新增打卡記帳</span>
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- ==================== 功能 3：總消費與明細 ==================== -->
    <section id="viewSummary" class="hidden space-y-6">
      <!-- 即時統計看板 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-blue-500/10">
          <div class="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">目前累積總花費</div>
          <div class="flex items-baseline space-x-1.5">
            <span class="text-sm font-bold text-blue-200">NT$</span>
            <span id="statTotalExpense" class="text-3xl sm:text-4xl font-black tracking-tight font-mono">0</span>
          </div>
          <div class="mt-3 text-[11px] text-blue-100/80">包含公費預支與所有代墊金額</div>
        </div>

        <div class="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-teal-500/10">
          <div class="flex items-center justify-between text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>每人平均應分攤金額</span>
            <span class="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">無條件進位</span>
          </div>
          <div class="flex items-baseline space-x-1.5">
            <span class="text-sm font-bold text-emerald-200">NT$</span>
            <span id="statPerPerson" class="text-3xl sm:text-4xl font-black tracking-tight font-mono">0</span>
            <span class="text-xs text-emerald-100/90 font-medium">/ 人</span>
          </div>
          <div id="statPerPersonDetail" class="mt-3 text-[11px] text-emerald-100/95 font-medium">
            總花費 ÷ ${totalPeople} 人 (採用 Math.ceil 避免小數糾紛)
          </div>
        </div>
      </div>

      <!-- 歷史打卡明細清單 -->
      <div class="space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>📜 打卡消費歷史明細</span>
            <span id="filteredCountBadge" class="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono">0 筆</span>
          </h3>
          <div class="w-full sm:w-72">
            <input type="text" id="searchInput" oninput="renderRecords()" placeholder="🔍 搜尋項目、地點、付款人..." class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs">
          </div>
        </div>

        <div id="recordsContainer" class="space-y-2.5">
          <!-- 動態渲染卡片 -->
        </div>
      </div>
    </section>

  </main>

  <script>
    // 狀態管理
    let currentTab = 'checkin';
    let appSettings = {
      tripName: localStorage.getItem('trip_name') || '${tripName}',
      totalPeople: Number(localStorage.getItem('trip_people')) || ${totalPeople},
      gasUrl: localStorage.getItem('trip_gas_url') || '${gasApiUrl}'
    };

    let records = JSON.parse(localStorage.getItem('trip_records') || '[]');

    // 分頁切換函式
    function switchTab(tab) {
      currentTab = tab;
      
      const vSettings = document.getElementById('viewSettings');
      const vCheckin = document.getElementById('viewCheckin');
      const vSummary = document.getElementById('viewSummary');

      const bSettings = document.getElementById('tabBtnSettings');
      const bCheckin = document.getElementById('tabBtnCheckin');
      const bSummary = document.getElementById('tabBtnSummary');

      // 隱藏全部
      vSettings.classList.add('hidden');
      vCheckin.classList.add('hidden');
      vSummary.classList.add('hidden');

      // 重設按鈕樣式
      const inactiveClass = 'py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 flex flex-col sm:flex-row sm:items-center space-x-0 sm:space-x-2 text-slate-600 hover:bg-slate-50 font-semibold text-xs sm:text-sm';
      const activeClass = 'py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-center sm:text-left transition-all duration-200 flex flex-col sm:flex-row sm:items-center space-x-0 sm:space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20';

      bSettings.className = 'hidden sm:flex ' + inactiveClass;
      bCheckin.className = inactiveClass;
      bSummary.className = inactiveClass;

      if (tab === 'settings') {
        vSettings.classList.remove('hidden');
        bSettings.className = 'hidden sm:flex ' + activeClass;
      } else if (tab === 'checkin') {
        vCheckin.classList.remove('hidden');
        bCheckin.className = activeClass;
      } else if (tab === 'summary') {
        vSummary.classList.remove('hidden');
        bSummary.className = activeClass;
        renderStats();
        renderRecords();
      }
    }

    // 初始化時間輸入框
    function initDateTime() {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('itemTime').value = now.toISOString().slice(0, 16);
    }

    function resetToCurrentTime() {
      initDateTime();
    }

    function selectCategory(cat) {
      document.getElementById('selectedCategory').value = cat;
      document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.dataset.category === cat) {
          btn.className = 'cat-btn py-2 px-2 rounded-xl border border-blue-500 bg-blue-50 text-blue-700 text-xs font-bold text-center';
        } else {
          btn.className = 'cat-btn py-2 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold text-center';
        }
      });
    }

    function selectPayer(payer) {
      document.getElementById('customPayer').value = payer;
      document.querySelectorAll('.payer-tag').forEach(tag => {
        if (tag.innerText === payer) {
          tag.className = 'payer-tag px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-400 bg-blue-50 text-blue-700';
        } else {
          tag.className = 'payer-tag px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700';
        }
      });
    }

    function quickAddAmount(val) {
      const el = document.getElementById('itemAmount');
      const cur = Number(el.value) || 0;
      el.value = cur + val;
    }

    let currentCoords = null;
    function fetchCurrentGps(isAuto) {
      const btn = document.getElementById('gpsBtn');
      const locInput = document.getElementById('itemLocation');
      if (!navigator.geolocation) {
        if (locInput) locInput.value = '請手動取得GPS定位';
        return;
      }
      if (btn) btn.innerHTML = '<span>⏳ 定位中...</span>';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          currentCoords = { lat, lng };
          if (locInput) locInput.value = 'GPS: ' + lat + ', ' + lng;
          updateMapPreview();
          if (btn) {
            btn.innerHTML = '<span>✅ 定位成功</span>';
            setTimeout(() => { btn.innerHTML = '<span>🎯 重新定位</span>'; }, 2000);
          }
        },
        (err) => {
          if (locInput) locInput.value = '請手動取得GPS定位';
          if (btn) btn.innerHTML = '<span>🎯 取得 GPS 定位</span>';
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    }

    function updateMapPreview() {
      const val = document.getElementById('itemLocation').value.trim();
      const link = document.getElementById('mapPreviewLink');
      if (!val) {
        link.innerText = '填寫地點後自動生成';
        link.href = '#';
        return;
      }
      let url = '';
      if (currentCoords && val.startsWith('GPS:')) {
        url = 'https://www.google.com/maps?q=' + currentCoords.lat + ',' + currentCoords.lng;
      } else {
        url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(val);
      }
      link.href = url;
      link.innerText = url;
    }

    async function handleFormSubmit(e) {
      e.preventDefault();
      const itemName = document.getElementById('itemName').value.trim();
      const amount = Number(document.getElementById('itemAmount').value) || 0;
      const payer = document.getElementById('customPayer').value.trim() || '公費預支';
      const category = document.getElementById('selectedCategory').value;
      const location = document.getElementById('itemLocation').value.trim() || '無打卡地點';
      const timeVal = document.getElementById('itemTime').value;
      const notes = document.getElementById('itemNotes').value.trim();

      let mapUrl = '';
      if (location && location !== '無打卡地點') {
        if (currentCoords && location.startsWith('GPS:')) {
          mapUrl = 'https://www.google.com/maps?q=' + currentCoords.lat + ',' + currentCoords.lng;
        } else {
          mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location);
        }
      }

      const newRecord = {
        id: 'rec_' + Date.now(),
        tripName: appSettings.tripName,
        time: timeVal.replace('T', ' '),
        itemName,
        amount,
        payer,
        category,
        location,
        mapUrl,
        notes,
        createdAt: Date.now()
      };

      records.unshift(newRecord);
      localStorage.setItem('trip_records', JSON.stringify(records));
      renderStats();

      // 重設表單欄位
      document.getElementById('itemName').value = '';
      document.getElementById('itemAmount').value = '';
      document.getElementById('itemNotes').value = '';
      document.getElementById('itemLocation').value = '';
      currentCoords = null;
      updateMapPreview();
      initDateTime();

      // 發送 GAS
      if (appSettings.gasUrl && appSettings.gasUrl.startsWith('http')) {
        try {
          fetch(appSettings.gasUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(newRecord)
          });
        } catch (err) {
          console.warn('GAS Sync error', err);
        }
      }

      if (confirm('✅ 打卡記帳已成功新增！是否立即切換至「功能3：總消費與明細」查看分攤與清單？')) {
        switchTab('summary');
      }
    }

    function deleteRecord(id) {
      if (!confirm('確定要刪除這筆打卡記帳嗎？')) return;
      records = records.filter(r => r.id !== id);
      localStorage.setItem('trip_records', JSON.stringify(records));
      renderStats();
      renderRecords();
    }

    function renderStats() {
      const total = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const count = records.length;
      const people = Math.max(1, appSettings.totalPeople);
      const perPerson = Math.ceil(total / people);

      const elTotal = document.getElementById('statTotalExpense');
      if (elTotal) elTotal.innerText = total.toLocaleString();
      const elRec = document.getElementById('statTotalRecords');
      if (elRec) elRec.innerText = count;
      const elPer = document.getElementById('statPerPerson');
      if (elPer) elPer.innerText = perPerson.toLocaleString();
      const elDetail = document.getElementById('statPerPersonDetail');
      if (elDetail) elDetail.innerText = 'NT$ ' + total.toLocaleString() + ' ÷ ' + people + ' 人 (無條件進位至整數)';
    }

    function renderRecords() {
      const container = document.getElementById('recordsContainer');
      const search = (document.getElementById('searchInput')?.value || '').toLowerCase();

      const filtered = records.filter(r => {
        if (!search) return true;
        return (
          r.itemName.toLowerCase().includes(search) ||
          r.location.toLowerCase().includes(search) ||
          r.payer.toLowerCase().includes(search) ||
          (r.notes && r.notes.toLowerCase().includes(search))
        );
      });

      document.getElementById('filteredCountBadge').innerText = filtered.length + ' 筆';

      if (filtered.length === 0) {
        container.innerHTML = '<div class="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400 text-sm">尚無打卡紀錄，立即切換至「功能2：打卡與記錄」填寫第一筆！</div>';
        return;
      }

      container.innerHTML = filtered.map(r => {
        const mapHtml = (r.location && r.location !== '無打卡地點')
          ? '<span class="flex items-center space-x-1"><span>📍</span>' + (r.mapUrl ? '<a href="' + r.mapUrl + '" target="_blank" class="text-blue-600 hover:underline font-semibold">' + r.location + ' (地圖)</a>' : '<span>' + r.location + '</span>') + '</span>'
          : '';
        const notesHtml = r.notes ? '<span class="text-slate-400 italic">📝 ' + r.notes + '</span>' : '';
        const shareAmount = Math.ceil(r.amount / appSettings.totalPeople);

        return '<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
          '<div class="space-y-1.5 flex-1">' +
            '<div class="flex items-center space-x-2">' +
              '<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">' + r.category + '</span>' +
              '<span class="text-xs text-slate-400 font-mono">' + r.time + '</span>' +
              '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">' + r.payer + '</span>' +
            '</div>' +
            '<div class="text-base font-bold text-slate-900">' + r.itemName + '</div>' +
            '<div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">' +
              mapHtml + notesHtml +
            '</div>' +
          '</div>' +
          '<div class="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">' +
            '<div class="text-right">' +
              '<div class="text-lg sm:text-xl font-black text-slate-900 font-mono">NT$ ' + Number(r.amount).toLocaleString() + '</div>' +
              '<div class="text-[10px] text-slate-400">均攤約 NT$ ' + shareAmount + '</div>' +
            '</div>' +
            '<button onclick="deleteRecord(\\'' + r.id + '\\')" class="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="刪除打卡">' +
              '🗑️' +
            '</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function getShareUrl() {
      try {
        const url = new URL(window.location.origin + window.location.pathname);
        if (appSettings.tripName) url.searchParams.set('trip', appSettings.tripName);
        if (appSettings.totalPeople) url.searchParams.set('people', appSettings.totalPeople.toString());
        if (appSettings.gasUrl) url.searchParams.set('gas', appSettings.gasUrl);
        return url.toString();
      } catch (e) {
        return window.location.href;
      }
    }

    function updateShareUrlInput() {
      const el = document.getElementById('standaloneShareInput');
      if (el) el.value = getShareUrl();
    }

    function copyStandaloneShare() {
      const shareUrl = getShareUrl();
      const text = '✈️【' + appSettings.tripName + '】\\n旅伴人數：' + appSettings.totalPeople + ' 位\\n即時記帳分攤網址：\\n' + shareUrl;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          alert('✅ 已複製記帳簿分享網址！可直接貼在 LINE 傳送給旅伴。');
        }).catch(() => {
          prompt('請複製此專屬記帳簿網址：', shareUrl);
        });
      } else {
        prompt('請複製此專屬記帳簿網址：', shareUrl);
      }
    }

    function shareToLine() {
      const shareUrl = getShareUrl();
      const msg = '✈️「' + appSettings.tripName + '」即時記帳分攤連結：\\n' + shareUrl;
      window.open('https://line.me/R/msg/text/?' + encodeURIComponent(msg), '_blank');
    }

    function shareTrackerUrl() {
      copyStandaloneShare();
    }

    function saveSettings() {
      const name = document.getElementById('setTripName').value.trim() || '未命名旅遊團';
      const people = Math.max(1, Number(document.getElementById('setTotalPeople').value) || 1);
      const gas = document.getElementById('setGasUrl').value.trim();

      appSettings.tripName = name;
      appSettings.totalPeople = people;
      appSettings.gasUrl = gas;

      localStorage.setItem('trip_name', name);
      localStorage.setItem('trip_people', people.toString());
      localStorage.setItem('trip_gas_url', gas);

      document.getElementById('topTripTitle').innerText = name;
      document.getElementById('topTravelersCount').innerText = people + ' 位旅伴';

      const badge = document.getElementById('gasStatusBadge');
      if (gas) {
        badge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700';
        badge.innerText = '● GAS 已連線';
      } else {
        badge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500';
        badge.innerText = '○ 本機儲存';
      }

      updateShareUrlInput();
      alert('🎉 旅遊行程資料已成功儲存！下方已生成專屬分享網址，可直接複製或 LINE 分享給旅伴一同記帳。');
    }

    function loadSampleData() {
      records = [
        { id: 's1', tripName: appSettings.tripName, time: '2026-03-26 19:40', itemName: '7-ELEVEN 宵夜甜點生啤酒', amount: 1150, payer: '公費預支', category: '購物', location: '7-Eleven 新宿歌舞伎町店', mapUrl: 'https://www.google.com/maps/search/?api=1&query=7-Eleven%20新宿', notes: '四人飲料點心', createdAt: Date.now() },
        { id: 's2', tripName: appSettings.tripName, time: '2026-03-26 17:20', itemName: 'SHIBUYA SKY 展望台日落門票', amount: 2400, payer: '小華代墊', category: '門票', location: '澀谷天空 Shibuya Sky', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Shibuya%20Sky', notes: '預約日落場次', createdAt: Date.now() - 3600000 },
        { id: 's3', tripName: appSettings.tripName, time: '2026-03-26 12:15', itemName: '築地場外市場特選海鮮丼', amount: 3200, payer: '公費預支', category: '餐飲', location: 'GPS: 35.665486, 139.770667', mapUrl: 'https://www.google.com/maps?q=35.665486,139.770667', notes: '4人綜合丼', createdAt: Date.now() - 7200000 }
      ];
      localStorage.setItem('trip_records', JSON.stringify(records));
      renderStats();
      renderRecords();
      alert('已載入示範資料！');
      switchTab('summary');
    }

    // 啟動初始化 (載入網址分享參數、更新分享網址、拉取 GPS 定位)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('trip')) appSettings.tripName = urlParams.get('trip');
      if (urlParams.get('people')) appSettings.totalPeople = Math.max(1, Number(urlParams.get('people')) || 1);
      if (urlParams.get('gas')) appSettings.gasUrl = urlParams.get('gas');
    } catch (e) {}

    initDateTime();
    renderStats();
    updateShareUrlInput();
    fetchCurrentGps(true);
    switchTab('summary');
  </script>
</body>
</html>`;
}
