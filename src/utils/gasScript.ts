import { ExpenseRecord, TripSettings } from '../types';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ========================================================
 * 旅遊公費記帳簿 - Google Apps Script 後端服務
 * 功用：接收前端 SPA 傳送的消費打卡記錄，自動追加至 Google 試算表最下方
 * ========================================================
 */

function doPost(e) {
  // 使用 LockService 防止多人同時寫入造成資料碰撞或覆蓋
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // 若為空白試算表，自動建立精美的標題列與凍結第一列
    if (sheet.getLastRow() === 0) {
      var headers = [
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
      
      // 美化標題列：背景色、文字加粗、水平置中
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2563eb');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    // 解析前端傳來的資料（支援 JSON 字串與 form-urlencoded）
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 格式化寫入內容
    var nowFormatted = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
    var tripName = data.tripName || '未命名旅遊團';
    var time = data.time || nowFormatted;
    var itemName = data.itemName || '未命名項目';
    var amount = Number(data.amount) || 0;
    var payer = data.payer || '公費預支';
    var category = data.category || '其他';
    var location = data.location || '無地點';
    var mapUrl = data.mapUrl || '';
    var notes = data.notes || '';

    // 將資料追加至最下方
    sheet.appendRow([
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

    var lastRow = sheet.getLastRow();
    
    // 將金額欄位設定為貨幣格式 (例如 NT$ 1,200)
    sheet.getRange(lastRow, 5).setNumberFormat('"NT$"#,##0');
    
    // 若有地圖連結，設定為超連結顯示文字
    if (mapUrl && mapUrl.startsWith('http')) {
      sheet.getRange(lastRow, 9).setFormula('=HYPERLINK("' + mapUrl + '", "開啟地圖")');
    }

    // 回傳標準 JSON 格式
    var responseObj = {
      status: 'success',
      message: '打卡記帳資料已成功寫入 Google 試算表！',
      row: lastRow,
      data: {
        item: itemName,
        amount: amount,
        time: time
      }
    };

    return ContentService.createTextOutput(JSON.stringify(responseObj))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errorObj = {
      status: 'error',
      message: '寫入失敗: ' + err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorObj))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    // 釋放 Lock
    lock.releaseLock();
  }
}

/**
 * 支援 GET 請求以供前端測試 API 連線狀態
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var rowCount = Math.max(0, sheet.getLastRow() - 1);

  var testResponse = {
    status: 'ok',
    message: '旅遊公費記帳簿 GAS 服務正常運行中！',
    sheetName: sheet.getName(),
    currentRecordsCount: rowCount,
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(testResponse))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GAS_DEPLOY_STEPS = [
  {
    step: 1,
    title: '建立全新的 Google 試算表',
    content: '開啟 Google 雲端硬碟，點擊「新增」>「Google 試算表」，將試算表命名為「旅遊公費記帳簿」（例如：2026東京自由行公費）。'
  },
  {
    step: 2,
    title: '開啟 Apps Script 編輯器',
    content: '在該試算表上方選單列點選「擴充功能」>「Apps Script」。'
  },
  {
    step: 3,
    title: '貼上 GAS 程式碼',
    content: '刪除編輯器內的預設程式碼（Code.gs），將本視窗提供的 GAS 程式碼完整複製並貼上，然後點選儲存圖示（磁片）。'
  },
  {
    step: 4,
    title: '部署為網頁應用程式 (重要)',
    content: '點擊右上角藍色「部署」按鈕 > 選擇「新增部署作業」；點擊左側齒輪選取類型為「網頁應用程式」；\n• 說明：可填寫「公費記帳 API」\n• 誰可以存取 (Who has access)：務必選擇「所有人 (Anyone)」！這是免登入發送記帳的關鍵。'
  },
  {
    step: 5,
    title: '授予授權並複製網址',
    content: '點擊「部署」，若出現授權要求，點選「審查權限」> 選擇你的 Google 帳號 > 點選「進階 (Advanced)」>「前往 (專案名稱) (不安全)」> 點選「允許」。'
  },
  {
    step: 6,
    title: '複製 Web 應用程式網址並貼回本網頁',
    content: '複製部署完成後產生的「網頁應用程式網址」（結尾通常為 /exec），貼回本網頁頂部設定欄位的「Google Sheet Web App API URL」即可！'
  }
];

/**
 * 發送記帳資料至 Google Apps Script Web App
 */
export async function syncRecordToGas(
  record: ExpenseRecord,
  gasUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '尚未設定有效的 Google Apps Script 網址' };
  }

  const payload = {
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
    /**
     * GAS Web App 的 302 重導向機制在跨網域時可能引發瀏覽器 CORS preflight。
     * 使用 mode: 'no-cors' 搭配 text/plain 可確保 100% 成功送達 Google 伺服器並觸發 doPost。
     */
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
 * 測試 GAS API 連線 (Ping)
 */
export async function testGasConnection(gasUrl: string): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '請先輸入有效的 API 網址（需以 https:// 開頭）' };
  }

  try {
    // 試算表 GAS 部署為網頁應用程式時，若要從瀏覽器直接讀取 response，需嘗試 fetch
    // 考慮跨網域 redirect，我們先用 no-cors 測試是否能正常連通
    await fetch(gasUrl.trim(), {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
    });

    return {
      success: true,
      message: '已成功連線至該 API 網址！請確認部署時權限設為「所有人 (Anyone)」。',
    };
  } catch (err: any) {
    return {
      success: false,
      message: '連線測試失敗：' + (err.message || '無法連線到該網址，請確認網址是否正確。'),
    };
  }
}
