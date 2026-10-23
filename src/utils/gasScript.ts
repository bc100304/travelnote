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
 * ==============================================================================
 */
function doGet(e) {
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
        records: records, // 依試算表由上而下（通常前端會 reverse 為由新到舊）
        settings: settings,
        summary: {
          totalExpense: totalExpense,
          totalRecords: records.length,
          perPerson: perPerson
        },
        timestamp: new Date().toISOString()
      }
    };

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errResponse = {
      status: 'error',
      message: '讀取失敗: ' + err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResponse))
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
    content: '開啟 Google 雲端硬碟，開啟你的記帳試算表（或點選「新增」>「Google 試算表」，命名為「旅遊公費記帳簿」）。'
  },
  {
    step: 2,
    title: '開啟 Apps Script 編輯器',
    content: '在試算表上方選單列點選「擴充功能」>「Apps Script」。'
  },
  {
    step: 3,
    title: '貼上完整升級版 GAS 程式碼',
    content: '清空編輯器內既有程式碼（Code.gs），將本專案提供的最新完整 GAS 程式碼全部貼上，並按 Ctrl+S (或 Cmd+S) 儲存。'
  },
  {
    step: 4,
    title: '部署為網頁應用程式 (重要)',
    content: '點擊右上角藍色「部署」按鈕 >「管理部署作業」或「新增部署作業」：\n• 類型：選擇「網頁應用程式 (Web App)」\n• 執行身分：選擇「我 (你的 Google 帳號)」\n• 誰可以存取 (Who has access)：務必選擇「所有人 (Anyone)」！這是免登入多手機同步的關鍵。'
  },
  {
    step: 5,
    title: '授予授權並複製網址',
    content: '點擊「部署」，若出現授權彈窗，依序點選「審查權限」>「進階 (Advanced)」>「前往 (專案名稱) (不安全)」> 點選「允許」。'
  },
  {
    step: 6,
    title: '複製 Web 應用程式網址並貼回本網頁',
    content: '複製部署完成後產生的「網頁應用程式網址」（結尾為 /exec），貼回本網頁頂部設定欄位的「Google Sheet Web App API URL」即可！'
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
 * 從 Google Apps Script 讀取全體打卡紀錄與設定 (doGet)
 */
export async function fetchFromGas(gasUrl: string): Promise<GasFetchResult> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '尚未設定有效的 Google Apps Script 網址' };
  }

  try {
    const cleanUrl = gasUrl.trim();
    const fetchUrl = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP 錯誤狀態碼: ${res.status}`);
    }

    const json = await res.json();
    if (json.status !== 'success' || !json.data) {
      return { success: false, message: json.message || '回傳格式異常' };
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
  } catch (err: any) {
    console.error('GAS fetch error:', err);
    return {
      success: false,
      message: '無法讀取 Google Sheet：' + (err.message || '請確認 GAS 網址與權限已設為「任何人」'),
    };
  }
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
    console.error('GAS sync error:', error);
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
    console.error('GAS delete error:', error);
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
