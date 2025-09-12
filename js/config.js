// 予約システム設定
const CONFIG = {
    // API設定
    API_BASE_URL: 'https://restaurant-reservation-7tlyu7d2jq-an.a.run.app/api',
    
    // 予約設定
    MAX_GUESTS: 8,
    MIN_GUESTS: 1,
    MAX_RESERVATIONS_PER_SEAT_TYPE: 5,
    ADVANCE_BOOKING_DAYS: 1, // 前日締切
    MAX_BOOKING_DAYS: 30,    // 30日先まで予約可能
    
    // 営業時間設定
    BUSINESS_HOURS: {
        weekday: {
            lunch: {
                start: '11:00',
                end: '14:00',
                slots: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30']
            }
        },
        weekend: {
            lunch: {
                start: '11:00',
                end: '14:00',
                slots: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30']
            },
            dinner: {
                start: '17:00',
                end: '19:30',
                slots: ['17:00', '17:30', '18:00', '18:30']
            }
        }
    },
    
    // 席タイプ設定
    SEAT_TYPES: {
        table: {
            name: 'テーブル席',
            description: '2-4名様でご利用いただけるテーブル席です。',
            minCapacity: 2,
            maxCapacity: 4,
            dailyLimit: 5,
            color: '#2196F3'
        },
        counter: {
            name: 'カウンター席',
            description: '1-2名様でご利用いただけるカウンター席です。',
            minCapacity: 1,
            maxCapacity: 2,
            dailyLimit: 5,
            color: '#FF9800'
        },
        private: {
            name: '個室',
            description: '4-8名様でご利用いただけるプライベート空間です。',
            minCapacity: 4,
            maxCapacity: 8,
            dailyLimit: 5,
            color: '#9C27B0'
        }
    },
    
    // 祝日チェック用設定
    HOLIDAY_API: 'https://holidays-jp.github.io/api/v1/date.json',
    
    // メッセージ
    MESSAGES: {
        LOADING: '処理中です...',
        ERROR: {
            NETWORK: 'ネットワークエラーが発生しました。',
            VALIDATION: '入力内容をご確認ください。',
            UNAVAILABLE: '選択された日時は予約できません。',
            FULL: '選択された時間帯は満席です。',
            PAST_DATE: '過去の日付は選択できません。',
            TOO_EARLY: '予約は前日まで承っております。',
            TOO_FAR: '予約は30日先までとなります。'
        },
        SUCCESS: {
            RESERVATION: 'ご予約ありがとうございました。'
        }
    },
    
    // 店舗情報
    RESTAURANT_INFO: {
        name: 'レストラン名',
        address: '〒637-0043 奈良県五條市小島町449-1',
        phone: '0747-23-0123',
        hours: {
            weekday: '平日11時〜15時',
            weekend: '土日祝11時〜15時、17時〜20時'
        }
    }
};

// 曜日名
const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// ユーティリティ関数
const utils = {
    // 日付フォーマット
    formatDate: (date) => {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    },
    
    // 日付表示用フォーマット
    formatDateDisplay: (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = DAY_NAMES[date.getDay()];
        return `${month}月${day}日(${dayOfWeek})`;
    },
    
    // 土日祝判定
    isWeekend: (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const day = date.getDay();
        return day === 0 || day === 6; // 日曜日または土曜日
    },
    
    // 過去日判定
    isPastDate: (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr + 'T00:00:00');
        return targetDate < today;
    },
    
    // 予約可能日判定
    isBookableDate: (dateStr) => {
        const today = new Date();
        const targetDate = new Date(dateStr + 'T00:00:00');
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays >= CONFIG.ADVANCE_BOOKING_DAYS && diffDays <= CONFIG.MAX_BOOKING_DAYS;
    },
    
    // 予約番号生成
    generateReservationNumber: () => {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return timestamp.slice(-5) + random;
    },
    
    // バリデーション
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    validatePhone: (phone) => {
        const re = /^[\d\-\s\(\)]+$/;
        return re.test(phone) && phone.replace(/[\D]/g, '').length >= 10;
    }
};

// グローバル状態
const state = {
    currentStep: 1,
    reservation: {
        guestCount: 1,
        date: '',
        time: '',
        seatType: '',
        customerName: '',
        phoneNumber: '',
        email: '',
        notes: ''
    },
    availableSlots: {},
    holidays: [],
    seatAvailability: {}
};

// ローディング表示
const showLoading = (show = true) => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
};

// エラー表示
const showError = (message) => {
    const modal = document.getElementById('error-modal');
    const messageEl = document.getElementById('error-message');
    if (modal && messageEl) {
        messageEl.textContent = message;
        modal.classList.add('active');
    }
};

// エラー非表示
const closeError = () => {
    const modal = document.getElementById('error-modal');
    if (modal) {
        modal.classList.remove('active');
    }
};
