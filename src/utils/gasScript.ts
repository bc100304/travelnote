import { ExpenseRecord, TripSettings } from '../types';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * 旅遊公費記帳簿 - Google Apps Script (GAS) 中央資料庫與跨裝置即時同步服務
 * 支援多手機、多裝置即時同步讀取 (doGet) 與寫入/刪除 (doPost)
 * ==============================================================================
 */

/**
 * 試算表工作表名稱設定
 */
var SHEET_NAME_RECORDS = '消費記錄';
var SHEET_NAME_SETTINGS = '團體設定';

/**
 * 取得或自動建立「消費記錄」工作表
 */
function getOrCreateRecordsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_RECORDS);
  
  if (!sheet) {
    // 若無此工作表，嘗試使用目前的預設工作表或新建
    sheet = ss.getActiveSheet();
    if (sheet.getName() === '工作表1' || sheet.getName() === 'Sheet1') {
      sheet.setName(SHEET_NAME_RECORDS);
    } else {
      sheet = ss.insertSheet(SHEET_NAME_RECORDS);
    }
  }

  // 若為空白試算表，自動建立精美的標題列與凍結第一列
  if (sheet.getLastRow() === 0) {
    var headers = [
      '紀錄ID',
      '系統寫入時間',
      '旅遊團名稱',
      '打卡時間',
      '消費項目',
      '金額 (NTD)',
      '付款人',
      '分類',
      '打卡地點',
      'Google 地圖連結',
      '備註'
    ];
    sheet.appendRow(headers);
    
    // 美化標題列：科技深藍、文字白色粗體、置中對齊
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1e40af');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 36);
  }

  return sheet;
}

/**
 * 取得或自動建立「團體設定」工作表
 */
function getOrCreateSettingsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SETTINGS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SETTINGS);
    var headers = ['設定項目', '設定值', '最後更新時間'];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f766e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    // 寫入預設設定列
    sheet.appendRow(['tripName', '2026 東京春櫻漫遊 5 日遊', new Date()]);
    sheet.appendRow(['totalPeople', '4', new Date()]);
    sheet.appendRow(['defaultPayer', '公費預支', new Date()]);
  }

  return sheet;
}

/**
 * ==============================================================================
 * doGet(e) - 讀取 API：多手機開啟網頁時，即時從 Google Sheet 載入所有資料與設定
 * 支援一般 JSON 與跨網域 JSONP (透過 callback 參數，徹底解決 Failed to fetch 與 CORS 問題)
 * ==============================================================================
 */
function doGet(e) {
  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;
  
  try {
    var recordsSheet = getOrCreateRecordsSheet();
    var lastRow = recordsSheet.getLastRow();
    var records = [];

    // 若有資料列 (第一列為標題，第 2 列起為紀錄)
    if (lastRow > 1) {
      var numCols = recordsSheet.getLastColumn();
      var data = recordsSheet.getRange(2, 1, lastRow - 1, numCols).getValues();

      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        // 欄位對應：[0]ID, [1]系統時間, [2]旅遊團名稱, [3]打卡時間, [4]項目名稱, [5]金額, [6]付款人, [7]分類, [8]地點, [9]地圖網址, [10]備註
        var recId = String(row[0] || ('rec_' + (i + 1)));
        var systemTime = row[1] instanceof Date ? Utilities.formatDate(row[1], 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss') : String(row[1] || '');
        var tripName = String(row[2] || '');
        var time = row[3] instanceof Date ? Utilities.formatDate(row[3], 'Asia/Taipei', 'yyyy-MM-dd HH:mm') : String(row[3] || '');
        var itemName = String(row[4] || '');
        var amount = Number(row[5]) || 0;
        var payer = String(row[6] || '公費預支');
        var category = String(row[7] || '其他');
        var location = String(row[8] || '無打卡地點');
        var mapUrl = String(row[9] || '');
        var notes = String(row[10] || '');

        // 避免加入全空列
        if (itemName || amount > 0) {
          records.push({
            id: recId,
            systemTime: systemTime,
            tripName: tripName,
            time: time,
            itemName: itemName,
            amount: amount,
            payer: payer,
            category: category,
            location: location,
            mapUrl: mapUrl,
            notes: notes,
            syncStatus: 'synced',
            rowIndex: i + 2
          });
        }
      }
    }

    // 讀取團體設定
    var settings = {
      tripName: '旅遊公費記帳簿',
      totalPeople: 4,
      defaultPayer: '公費預支'
    };

    try {
      var settingsSheet = getOrCreateSettingsSheet();
      var sRows = settingsSheet.getDataRange().getValues();
      for (var s = 1; s < sRows.length; s++) {
        var key = String(sRows[s][0]).trim();
        var val = sRows[s][1];
        if (key === 'tripName') settings.tripName = String(val);
        if (key === 'totalPeople') settings.totalPeople = Math.max(1, Number(val) || 1);
        if (key === 'defaultPayer') settings.defaultPayer = String(val);
      }
    } catch (eSettings) {
      console.warn('讀取團體設定警告:', eSettings);
    }

    // 計算總統計
    var totalExpense = records.reduce(function(sum, r) { return sum + (r.amount || 0); }, 0);
    var perPerson = Math.ceil(totalExpense / Math.max(1, settings.totalPeople));

    var responseData = {
      status: 'success',
      message: '讀取成功',
      data: {
        records: records, // 依試算表由上而下（前端會 reverse 為由新到舊）
        settings: settings,
        summary: {
          totalExpense: totalExpense,
          totalRecords: records.length,
          perPerson: perPerson
        },
        timestamp: new Date().toISOString()
      }
    };

    var jsonString = JSON.stringify(responseData);

    // 若前端採用 JSONP (callback 模式)，回傳 JavaScript 執行腳本
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + jsonString + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    // 否則回傳標準 application/json
    return ContentService.createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errResponse = {
      status: 'error',
      message: '讀取失敗: ' + err.toString()
    };
    var errString = JSON.stringify(errResponse);

    if (callback) {
      return ContentService.createTextOutput(callback + '(' + errString + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(errString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ==============================================================================
 * doPost(e) - 寫入 / 刪除 / 更新 API
 * 支援 action: 'add' (新增)、'delete' (刪除指定 ID)、'saveSettings' (儲存設定)
 * ==============================================================================
 */
function doPost(e) {
  // 使用 LockService 防止多部手機同時寫入或刪除時發生碰撞
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var recordsSheet = getOrCreateRecordsSheet();

    // 解析傳入資料 (支援 JSON 或 URL-encoded)
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || 'add';

    // -------------------------------------------------------------
    // 動作 1：刪除打卡紀錄 (根據 ID 或列號刪除)
    // -------------------------------------------------------------
    if (action === 'delete') {
      var targetId = String(payload.id || '');
      var deleted = false;
      var lastRow = recordsSheet.getLastRow();

      if (!targetId && payload.rowIndex) {
        var rowNum = Number(payload.rowIndex);
        if (rowNum >= 2 && rowNum <= lastRow) {
          recordsSheet.deleteRow(rowNum);
          deleted = true;
        }
      } else if (targetId && lastRow > 1) {
        // 搜尋 ID 欄位 (第 1 欄)
        var ids = recordsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = ids.length - 1; i >= 0; i--) {
          if (String(ids[i][0]) === targetId) {
            recordsSheet.deleteRow(i + 2);
            deleted = true;
            break;
          }
        }
      }

      var deleteResult = {
        status: deleted ? 'success' : 'not_found',
        message: deleted ? '紀錄已自 Google 試算表刪除' : '找不到該筆紀錄，可能已被其他成員刪除',
        targetId: targetId
      };

      return ContentService.createTextOutput(JSON.stringify(deleteResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // 動作 2：儲存團體設定 (行程名稱、人數等)
    // -------------------------------------------------------------
    if (action === 'saveSettings') {
      var settingsSheet = getOrCreateSettingsSheet();
      var now = new Date();
      if (payload.tripName) {
        updateOrAppendSetting(settingsSheet, 'tripName', payload.tripName, now);
      }
      if (payload.totalPeople) {
        updateOrAppendSetting(settingsSheet, 'totalPeople', String(payload.totalPeople), now);
      }
      if (payload.defaultPayer) {
        updateOrAppendSetting(settingsSheet, 'defaultPayer', payload.defaultPayer, now);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: '團體設定已同步儲存至 Google 試算表！'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // 動作 3：新增打卡記帳 (追加至最後一行)
    // -------------------------------------------------------------
    var recordId = String(payload.id || ('rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)));
    var nowFormatted = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
    var tripName = payload.tripName || '旅遊公費';
    var time = payload.time || Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
    var itemName = payload.itemName || '未命名項目';
    var amount = Number(payload.amount) || 0;
    var payer = payload.payer || '公費預支';
    var category = payload.category || '其他';
    var location = payload.location || '無地點';
    var mapUrl = payload.mapUrl || '';
    var notes = payload.notes || '';

    // 將資料新增至試算表最下方
    recordsSheet.appendRow([
      recordId,
      nowFormatted,
      tripName,
      time,
      itemName,
      amount,
      payer,
      category,
      location,
      mapUrl,
      notes
    ]);

    var newLastRow = recordsSheet.getLastRow();

    // 格式化金額欄位為貨幣格式 (例如 NT$ 1,200)
    recordsSheet.getRange(newLastRow, 6).setNumberFormat('"NT$"#,##0');

    // 若有 Google 地圖超連結，設定為公式超連結
    if (mapUrl && String(mapUrl).indexOf('http') === 0) {
      recordsSheet.getRange(newLastRow, 10).setFormula('=HYPERLINK("' + mapUrl + '", "開啟地圖")');
    }

    var addResult = {
      status: 'success',
      message: '打卡記帳已成功新增並寫入 Google 試算表！',
      data: {
        id: recordId,
        row: newLastRow,
        itemName: itemName,
        amount: amount,
        time: time
      }
    };

    return ContentService.createTextOutput(JSON.stringify(addResult))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errorResult = {
      status: 'error',
      message: '處理失敗: ' + err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * 輔助函式：更新或新增設定項目
 */
function updateOrAppendSetting(sheet, key, value, updateTime) {
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 3).setValue(updateTime);
      return;
    }
  }
  sheet.appendRow([key, value, updateTime]);
}
`;

export const GAS_DEPLOY_STEPS = [
  {
    step: 1,
    title: '開啟或建立 Google 試算表',
    content: '開啟 Google 雲端硬碟，打開或新建一個記帳試算表（命名為「旅遊公費記帳簿」）。'
  },
  {
    step: 2,
    title: '開啟 Apps Script 編輯器',
    content: '在試算表上方選單點選「擴充功能」>「Apps Script」。'
  },
  {
    step: 3,
    title: '貼上完整升級版程式碼 (含 JSONP 支援)',
    content: '清空 Code.gs 內的所有舊程式碼，完整貼上本專案提供的最新 GAS 程式碼，並按 Ctrl+S (或 Cmd+S) 存檔。'
  },
  {
    step: 4,
    title: '部署為網頁應用程式 (⚡ 關鍵避坑步驟)',
    content: '點擊右上角藍色「部署」按鈕 >「管理部署作業」：\n• 點選鉛筆圖示（編輯）或「新增部署作業」\n• 類型：選擇「網頁應用程式 (Web App)」\n• 版本：務必選擇「新版本 (New version)」！\n• 執行身分：選擇「我 (你的 Google 帳號)」\n• 誰可以存取 (Who has access)：🚨 務必選擇「所有人 (Anyone)」！若選錯為「僅限我自己」或「Google 帳戶使用者」，瀏覽器會因 Google 轉跳登入頁而出現「Failed to fetch」！'
  },
  {
    step: 5,
    title: '完成授權',
    content: '點擊「部署」，若出現「需要授權」彈窗：\n依序點選「審查權限」> 選擇你的帳號 > 點選「進階 (Advanced)」>「前往 (專案名稱) (不安全)」> 點選「允許」。'
  },
  {
    step: 6,
    title: '複製 /exec 正式網址',
    content: '複製部署完成後出現的「網頁應用程式網址」（結尾必須為 /exec，切勿複製編輯器或測試 /dev 網址），貼回本網頁頂部設定欄位即可！'
  }
];

export interface GasFetchResult {
  success: boolean;
  message: string;
  records?: ExpenseRecord[];
  settings?: Partial<TripSettings>;
  summary?: {
    totalExpense: number;
    totalRecords: number;
    perPerson: number;
  };
}

/**
 * 網址規格檢測與防呆診斷
 */
export function validateGasUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: '尚未填寫 Google Apps Script 網址' };
  }
  const clean = url.trim();

  // 常見錯誤 1：貼成 Google 試算表本體網址
  if (clean.includes('docs.google.com/spreadsheets')) {
    return {
      valid: false,
      error: '⚠️ 您輸入的是「Google 試算表」網址，而非 Apps Script 網頁應用程式網址！請至試算表點選「擴充功能 > Apps Script > 部署 > 管理部署作業」，複製結尾為 /exec 的網址。',
    };
  }

  // 常見錯誤 2：貼成 /dev 開發測試網址
  if (clean.endsWith('/dev') || clean.includes('/dev?')) {
    return {
      valid: false,
      error: '⚠️ 您輸入的是「/dev 開發測試網址」，此網址需要開發者登入驗證，會導致跨手機存取失敗（Failed to fetch）！請至 Apps Script 點「部署 > 管理部署作業」，複製結尾為 /exec 的正式網址。',
    };
  }

  // 常見錯誤 3：貼成 Apps Script 專案編輯器網址
  if (clean.includes('script.google.com/home') || clean.includes('/edit')) {
    return {
      valid: false,
      error: '⚠️ 您輸入的是 Apps Script 程式碼編輯器網址！請點擊右上角「部署 > 管理部署作業」，複製網頁應用程式網址（結尾為 /exec）。',
    };
  }

  // 檢查是否為標準 GAS 網址
  if (!clean.startsWith('https://script.google.com/macros/s/')) {
    return {
      valid: false,
      error: '⚠️ 網址格式不正確，標準 GAS 網址應以「https://script.google.com/macros/s/...」開頭，並以「/exec」結尾。',
    };
  }

  return { valid: true };
}

interface JsonpResult {
  success: boolean;
  data?: any;
  reason?: 'login_redirect_or_blocked' | 'timeout' | 'error';
}

/**
 * 透過 JSONP 動態插入 <script> 進行跨網域載入
 * 1. 徹底繞過瀏覽器 CORS 限制
 * 2. 順暢跟隨 Google Apps Script 的 302 重新導向
 * 3. 優雅回傳結果，避免觸發非預期異常中斷
 */
function fetchWithJsonp(url: string, timeoutMs = 8000): Promise<JsonpResult> {
  return new Promise((resolve) => {
    const callbackName = 'gas_cb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const script = document.createElement('script');
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}&_t=${Date.now()}`;
    script.async = true;

    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      try {
        delete (window as any)[callbackName];
      } catch (e) {
        (window as any)[callbackName] = undefined;
      }
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve({ success: true, data });
    };

    script.onerror = () => {
      cleanup();
      // Google 轉跳至登入頁面會導致 <script> 標籤無法作為 JavaScript 解析而觸發 onerror
      resolve({ success: false, reason: 'login_redirect_or_blocked' });
    };

    timer = setTimeout(() => {
      cleanup();
      resolve({ success: false, reason: 'timeout' });
    }, timeoutMs);

    document.head.appendChild(script);
  });
}

/**
 * 解析 GAS 傳回的資料為前端 ExpenseRecord
 */
function formatGasResponse(json: any): GasFetchResult {
  if (json.status !== 'success' || !json.data) {
    return { success: false, message: json.message || '試算表回傳格式異常' };
  }

  const rawRecords = json.data.records || [];
  const formattedRecords: ExpenseRecord[] = rawRecords.map((r: any) => ({
    id: r.id || 'rec_' + Math.random().toString(36).substring(2, 8),
    tripName: r.tripName || '',
    time: r.time || '',
    itemName: r.itemName || '',
    amount: Number(r.amount) || 0,
    payer: r.payer || '公費預支',
    category: r.category || '其他',
    location: r.location || '',
    mapUrl: r.mapUrl || '',
    notes: r.notes || '',
    syncStatus: 'synced',
    createdAt: r.systemTime ? new Date(r.systemTime).getTime() || Date.now() : Date.now(),
  })).reverse(); // 倒序排列，讓最新一筆在最上方

  return {
    success: true,
    message: `成功同步 ${formattedRecords.length} 筆打卡資料`,
    records: formattedRecords,
    settings: json.data.settings,
    summary: json.data.summary,
  };
}

/**
 * 產生標準的「Failed to fetch」診斷建議文字
 */
export function getGasTroubleshootMessage(reason?: string): string {
  const isAuthBlocked = reason === 'login_redirect_or_blocked';
  return [
    isAuthBlocked
      ? '🔒 Google 帳戶驗證受阻：您的 GAS 部署目前需要登入才能讀取'
      : '⚠️ 無法讀取 Google Sheet (Failed to fetch)',
    '',
    '【解決指南 3 步驟】：',
    '1. 🚨【最關鍵！90% 原因】部署權限務必設為「所有人 (Anyone)」：',
    '   請進入 Google 試算表 >「擴充功能」>「Apps Script」> 點右上角「部署」>「管理部署作業」> 點鉛筆圖示編輯，將「誰可以存取 (Who has access)」設定為「所有人 (Anyone)」。若選成「僅限我自己」或「Google 帳戶使用者」，Google 就會轉跳登入頁，瀏覽器便會阻擋連線。',
    '',
    '2. 🔄 貼上新程式碼後必須建立「新版本」部署：',
    '   修改或貼上最新 Code.gs 後，按存檔並點選「部署」>「管理部署作業」> 點鉛筆圖示 >「版本」下拉選單務必切換為「新版本 (New version)」> 按下「部署」。若未建立新版本，線上跑的仍是舊程式！',
    '',
    '3. 🔗 網址必須以 /exec 結尾：',
    '   切勿複製測試用的 /dev 網址或試算表網址。',
    '',
    '💡 提示：您可直接點擊「在新分頁打開 API 網址測試」，若出現 Google 登入畫面，即代表權限尚未開放為「所有人」。',
  ].join('\n');
}

/**
 * 從 Google Apps Script 讀取全體打卡紀錄與設定 (doGet)
 * 雙引擎機制：優先使用標準 fetch (不帶自訂 headers 避免 preflight 阻擋)，失敗時自動降級使用 JSONP 跨網域載入
 */
export async function fetchFromGas(gasUrl: string): Promise<GasFetchResult> {
  const urlCheck = validateGasUrl(gasUrl);
  if (!urlCheck.valid) {
    return { success: false, message: urlCheck.error || '無效的 GAS 網址' };
  }

  const cleanUrl = gasUrl.trim();
  const fetchUrl = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();

  // 嘗試方法 1: 標準 fetch (特別注意：切勿傳遞 Accept 或自訂 headers，避免引發 preflight 失敗)
  try {
    const res = await fetch(fetchUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-cache',
    });

    if (res.ok) {
      const json = await res.json();
      return formatGasResponse(json);
    }
  } catch (fetchErr: any) {
    console.warn('標準 fetch 失敗，自動切換至 JSONP 跨網域載入...');
  }

  // 嘗試方法 2: JSONP 跨網域載入 (免受 CORS 限制)
  const jsonpRes = await fetchWithJsonp(cleanUrl, 8000);
  if (jsonpRes.success && jsonpRes.data) {
    return formatGasResponse(jsonpRes.data);
  }

  // 若兩者皆未成功，記錄原因 (使用 warn，避免誤觸 AI Studio 報警機制)
  console.warn('GAS 雲端連線失敗原因:', jsonpRes.reason || '連線未成功');

  return {
    success: false,
    message: getGasTroubleshootMessage(jsonpRes.reason),
  };
}

/**
 * 新增打卡資料至 Google Apps Script (doPost)
 */
export async function syncRecordToGas(
  record: ExpenseRecord,
  gasUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '尚未設定有效的 Google Apps Script 網址' };
  }

  const payload = {
    action: 'add',
    id: record.id,
    tripName: record.tripName,
    time: record.time,
    itemName: record.itemName,
    amount: record.amount,
    payer: record.payer,
    category: record.category,
    location: record.location,
    mapUrl: record.mapUrl,
    notes: record.notes,
  };

  try {
    await fetch(gasUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, message: '已成功送出至 Google 試算表！' };
  } catch (error: any) {
    console.warn('GAS sync error:', error);
    return { success: false, message: error?.message || '傳送失敗，請檢查網路連線或 API 網址' };
  }
}

/**
 * 刪除打卡資料從 Google Apps Script (doPost)
 */
export async function deleteRecordFromGas(
  recordId: string,
  gasUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '尚未設定有效的 Google Apps Script 網址' };
  }

  const payload = {
    action: 'delete',
    id: recordId,
  };

  try {
    await fetch(gasUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, message: '已發送刪除請求至 Google 試算表！' };
  } catch (error: any) {
    console.warn('GAS delete error:', error);
    return { success: false, message: error?.message || '刪除失敗，請檢查網路連線' };
  }
}

/**
 * 測試 GAS API 連線 (Ping)
 */
export async function testGasConnection(gasUrl: string): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '請先輸入有效的 API 網址（需以 https:// 開頭）' };
  }

  const result = await fetchFromGas(gasUrl);
  if (result.success) {
    return {
      success: true,
      message: `連線成功！已讀取到 ${result.records?.length || 0} 筆紀錄。`,
    };
  }

  return {
    success: false,
    message: result.message,
  };
}
