// Hair Works天 予約サイト - 設定ファイル

// Cloud Run API設定
const API_BASE_URL = 'https://hair-works-api-v2-knn6yth7rq-an.a.run.app/api';

// アプリケーション設定
const APP_CONFIG = {
    maxCompanions: 1, // 最大同行者数を1名に変更
    minAdvanceBookingDays: 1, // 最小予約日数（1日後=翌日から予約可能に変更）
    maxAdvanceBookingDays: 30, // 最大予約日数（30日後まで予約可能）
    cancelDeadlineHours: 1,
    reservationCutoffTime: '23:59',
    businessHours: {
        weekday: { start: '10:00', end: '19:00' },
        weekend: { start: '09:00', end: '18:00' }
    },
    // 平日・土日祝で分けた時間スロット
    timeSlots: {
        weekday: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
        weekend: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    },
    shopInfo: {
        name: 'Hair Works天',
        address: '〒420-0817 静岡県静岡市葵区東静岡１丁目１−５７',
        phone: null, // 電話予約は受け付けていない
        parkingSpaces: 240
    }
};

// 日付が平日か土日祝かを判定する関数
function isWeekendOrHoliday(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0=日曜日, 6=土曜日
    
    // 土曜日(6)または日曜日(0)の場合は土日祝扱い
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
    }
    
    // 日本の祝日リストに含まれている場合
    if (japaneseHolidays.includes(dateString)) {
        return true;
    }
    
    return false;
}

// 指定日付の時間スロットを取得する関数（翌日以降のみ）
function getTimeSlotsForDate(dateString) {
    const baseSlots = isWeekendOrHoliday(dateString) 
        ? APP_CONFIG.timeSlots.weekend 
        : APP_CONFIG.timeSlots.weekday;
    
    // 当日は予約不可なので、常に全ての時間スロットを返す
    return baseSlots;
}

// 日本時間での今日の日付文字列を取得
function getTodayDateString() {
    const now = new Date();
    const japanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
    const year = japanTime.getFullYear();
    const month = String(japanTime.getMonth() + 1).padStart(2, '0');
    const day = String(japanTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 予約可能日かを判定する関数（翌日以降のみ）
function isValidReservationDate(dateString) {
    // 日本時間での今日の日付を取得
    const now = new Date();
    const japanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
    const today = new Date(japanTime.getFullYear(), japanTime.getMonth(), japanTime.getDate());
    
    // 対象日付（YYYY-MM-DD形式）をDateオブジェクトに変換
    const [year, month, day] = dateString.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    
    console.log(`予約日チェック: ${dateString}`);
    console.log(`今日（日本時間）: ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    console.log(`対象日: ${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`);
    
    // 最小予約日数チェック（1日後=翌日から予約可能）
    const minimumDate = new Date(today);
    minimumDate.setDate(minimumDate.getDate() + APP_CONFIG.minAdvanceBookingDays);
    
    console.log(`最小予約日: ${minimumDate.getFullYear()}-${String(minimumDate.getMonth() + 1).padStart(2, '0')}-${String(minimumDate.getDate()).padStart(2, '0')}`);
    
    if (targetDate < minimumDate) {
        console.log('❌ 最小予約日より前です');
        return false;
    }
    
    // 最大予約日数チェック
    const maximumDate = new Date(today);
    maximumDate.setDate(maximumDate.getDate() + APP_CONFIG.maxAdvanceBookingDays);
    
    console.log(`最大予約日: ${maximumDate.getFullYear()}-${String(maximumDate.getMonth() + 1).padStart(2, '0')}-${String(maximumDate.getDate()).padStart(2, '0')}`);
    
    if (targetDate > maximumDate) {
        console.log('❌ 最大予約日より後です');
        return false;
    }
    
    console.log('✅ 予約可能な日付です');
    return true;
}

// グローバル変数の初期化
let currentPage = 'top-page';
let selectedMenu = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let companions = [];
let menus = {};
let holidays = [];
let reservations = [];
let notices = [];
let japaneseHolidays = []; // 日本の祝日リスト

// 月名配列
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 曜日配列
const DAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土'];

// エラーメッセージ
const ERROR_MESSAGES = {
    menuLoadFailed: 'メニューの読み込みに失敗しました',
    noticeLoadFailed: '重要なお知らせの読み込みに失敗しました',
    holidayLoadFailed: '休業日データの取得に失敗しました',
    reservationLoadFailed: '予約データの読み込みに失敗しました',
    reservationSubmitFailed: '予約の送信に失敗しました',
    networkError: 'ネットワークエラーが発生しました',
    validationError: '入力内容に不備があります',
    timeSlotUnavailable: '選択された時間は既に予約済みです'
};
