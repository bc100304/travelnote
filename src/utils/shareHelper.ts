import { TripSettings } from '../types';

/**
 * 產生帶有行程基本資料與 GAS 設定參數的分享網址
 * 旅伴點擊此網址開啟時，可自動同步旅遊團名稱、人數與 Google Sheet 串接設定
 */
export function generateShareUrl(settings: TripSettings): string {
  try {
    const url = new URL(window.location.origin + window.location.pathname);
    if (settings.tripName) url.searchParams.set('trip', settings.tripName);
    if (settings.totalPeople) url.searchParams.set('people', settings.totalPeople.toString());
    if (settings.startDate) url.searchParams.set('start', settings.startDate);
    if (settings.endDate) url.searchParams.set('end', settings.endDate);
    if (settings.gasApiUrl) url.searchParams.set('gas', settings.gasApiUrl);
    if (settings.payersList && settings.payersList.length > 0) {
      url.searchParams.set('payers', settings.payersList.join(','));
    }
    return url.toString();
  } catch (e) {
    return window.location.href;
  }
}

/**
 * 從網址查詢參數 (Query Params) 解析旅伴分享的行程資料
 */
export function parseSettingsFromUrl(): Partial<TripSettings> | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const trip = params.get('trip');
    const people = params.get('people');
    const start = params.get('start');
    const end = params.get('end');
    const gas = params.get('gas');
    const payers = params.get('payers');

    if (!trip && !people && !gas) return null;

    const result: Partial<TripSettings> = {};
    if (trip) result.tripName = trip;
    if (people && !isNaN(parseInt(people))) result.totalPeople = Math.max(1, parseInt(people));
    if (start) result.startDate = start;
    if (end) result.endDate = end;
    if (gas) result.gasApiUrl = gas;
    if (payers) {
      const list = payers.split(',').map((p) => p.trim()).filter(Boolean);
      if (list.length > 0) result.payersList = list;
    }

    return result;
  } catch (e) {
    return null;
  }
}

/**
 * 複製分享文字與連結至剪貼簿
 */
export async function copyShareLink(settings: TripSettings): Promise<boolean> {
  const shareUrl = generateShareUrl(settings);
  const textToCopy = `✈️【${settings.tripName || '旅遊公費記帳簿'}】\n` +
    `旅伴人數：${settings.totalPeople} 位\n` +
    (settings.startDate ? `行程日期：${settings.startDate} ~ ${settings.endDate || ''}\n` : '') +
    `即時記帳與均攤網址：\n${shareUrl}`;

  try {
    await navigator.clipboard.writeText(textToCopy);
    return true;
  } catch (err) {
    // 備援方案
    try {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * 產生 LINE 快速分享 URL
 */
export function getLineShareUrl(settings: TripSettings): string {
  const shareUrl = generateShareUrl(settings);
  const msg = `✈️「${settings.tripName || '旅遊公費記帳簿'}」即時記帳分攤連結：\n${shareUrl}`;
  return `https://line.me/R/msg/text/?${encodeURIComponent(msg)}`;
}
