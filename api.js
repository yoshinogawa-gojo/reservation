// Hair Works天 予約サイト - API通信モジュール

// 予約設定の読み込み（フロントエンド側で固定値を設定）
async function loadReservationSettings() {
    try {
        // バックエンドAPIが利用できない場合のフォールバック設定
        console.log('予約設定をフロントエンド側で設定します');
        
        // 固定の予約設定を適用（翌日から予約可能に変更）
        APP_CONFIG.minAdvanceBookingDays = 1;  // 翌日から予約可能
        APP_CONFIG.maxAdvanceBookingDays = 30; // 30日後まで予約可能
        
        console.log('予約設定を設定しました:', {
            minAdvanceBookingDays: APP_CONFIG.minAdvanceBookingDays,
            maxAdvanceBookingDays: APP_CONFIG.maxAdvanceBookingDays
        });
        
        return true;
        
    } catch (error) {
        console.error('予約設定の読み込みに失敗しました:', error);
        // デフォルト値を使用
        APP_CONFIG.minAdvanceBookingDays = 1;
        APP_CONFIG.maxAdvanceBookingDays = 30;
        console.log('デフォルトの予約設定を使用します');
        return false;
    }
}

// メニューデータの読み込み
async function loadMenus() {
    const menuGrid = document.getElementById('menu-grid');
    menuGrid.innerHTML = '<div class="loading">メニューを読み込んでいます...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/menus`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.menus) {
            menus = data.menus;
            console.log('メニューデータを正常に読み込みました:', menus);
        } else {
            throw new Error('メニューデータの形式が正しくありません');
        }
        
        displayMenus();
        
    } catch (error) {
        console.error('メニューの読み込みに失敗しました:', error);
        menuGrid.innerHTML = `
            <div class="error">
                <h3>${ERROR_MESSAGES.menuLoadFailed}</h3>
                <p>エラー: ${error.message}</p>
                <p>Cloud Run APIに接続できません。管理者にお問い合わせください。</p>
                <button onclick="loadMenus()" class="select-button" style="margin-top: 15px;">再試行</button>
            </div>
        `;
    }
}

// 日本の祝日データの読み込み
async function loadJapaneseHolidays() {
    try {
        const response = await fetch(`${API_BASE_URL}/japanese-holidays`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.holidays) {
            japaneseHolidays = data.holidays;
            console.log('日本の祝日データを読み込みました:', japaneseHolidays);
        }
        
    } catch (error) {
        console.error('祝日データの読み込みに失敗しました:', error);
        japaneseHolidays = [];
    }
}

// 利用可能な時間スロットを取得（スタッフ情報付き・修正版）
async function getAvailableTimeSlots(date) {
    try {
        console.log(`時間スロット取得開始: ${date}`);
        
        const response = await fetch(`${API_BASE_URL}/timeslots/${date}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log(`API レスポンス: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('API エラーレスポンス:', errorData);
            
            // 400エラーの場合はエラー詳細を含めて返す
            if (response.status === 400) {
                return {
                    success: false,
                    isValidDate: false,
                    message: errorData?.message || '日付が無効です',
                    timeslots: [],
                    staff: null
                };
            }
            
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('時間スロットAPI レスポンス:', data);
        
        // スタッフ情報も含めてレスポンスを返す
        return {
            ...data,
            staff: data.staff || null
        };
        
    } catch (error) {
        console.error('時間スロットの取得に失敗しました:', error);
        // フォールバック：フロントエンドの判定を使用
        return {
            success: false,
            isWeekend: isWeekendOrHoliday(date),
            isValidDate: isValidReservationDate(date),
            timeslots: getTimeSlotsForDate(date),
            message: 'サーバーエラーのためフォールバック処理を使用',
            staff: null
        };
    }
}

// スタッフ情報を取得（新機能）
async function getStaffInfo(date) {
    try {
        console.log(`スタッフ情報取得開始: ${date}`);
        
        const response = await fetch(`${API_BASE_URL}/staff/${date}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            console.warn(`スタッフ情報取得失敗: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`スタッフ情報取得成功: ${date} -> ${data.staff}`);
            return data.staff;
        } else {
            console.warn(`スタッフ情報取得失敗: ${data.message}`);
            return null;
        }
        
    } catch (error) {
        console.error('スタッフ情報の取得に失敗しました:', error);
        return null;
    }
}

// 重要なお知らせデータの読み込み
async function loadNotices() {
    console.log('=== loadNotices() 開始 ===');
    
    try {
        const url = `${API_BASE_URL}/notices`;
        console.log('リクエストURL:', url);
        
        const response = await fetch(url);
        console.log('レスポンス:', response.status);
        
        const data = await response.json();
        console.log('取得データ:', data);
        
        if (data.success && data.notices) {
            notices = data.notices;
            console.log('notices配列に設定:', notices);
            displayNotices();
        } else {
            console.error('データ形式エラー:', data);
            // デフォルトのお知らせを設定（翌日以降のみに変更）
            notices = [
                { icon: '⏰', text: 'ご予約の開始時刻は目安となっており、前のお客様の施術内容によっては、お時間をいただくことがございます。ご理解のほど、よろしくお願いいたします。' },
                { icon: '📞', text: '電話でのご予約は承っておりません。何卒ご了承ください。' },
                { icon: '⏱️', text: 'キャンセルの締切は、ご予約時間の1時間前までとさせていただいております。' },
                { icon: '📅', text: 'ご予約は翌日以降の日程でお取りいただけます。当日のご予約は承っておりません。' }
            ];
            displayNotices();
        }
        
    } catch (error) {
        console.error('loadNotices エラー:', error);
        // デフォルトのお知らせを設定（翌日以降のみに変更）
        notices = [
            { icon: '⏰', text: 'ご予約の開始時刻は目安となっており、前のお客様の施術内容によっては、お時間をいただくことがございます。ご理解のほど、よろしくお願いいたします。' },
            { icon: '📞', text: '電話でのご予約は承っておりません。何卒ご了承ください。' },
            { icon: '⏱️', text: 'キャンセルの締切は、ご予約時間の1時間前までとさせていただいております。' },
            { icon: '📅', text: 'ご予約は翌日以降の日程でお取りいただけます。当日のご予約は承っておりません。' }
        ];
        displayNotices();
    }
    
    console.log('=== loadNotices() 終了 ===');
}

// 重要なお知らせの再取得
async function retryLoadNotices() {
    console.log('=== retryLoadNotices() 開始 ===');
    const noticesContainer = document.querySelector('.notice-content');
    if (noticesContainer) {
        noticesContainer.innerHTML = '<div class="loading">重要なお知らせを再取得しています...</div>';
    }
    
    try {
        await loadNotices();
        console.log('重要なお知らせの再取得が成功しました');
    } catch (error) {
        console.error('重要なお知らせの再取得に失敗しました:', error);
    }
    console.log('=== retryLoadNotices() 終了 ===');
}

// 休業日データの読み込み
async function loadHolidays() {
    try {
        console.log('休業日データを取得中...');
        const response = await fetch(`${API_BASE_URL}/holidays`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.holidays)) {
            holidays = data.holidays;
            console.log('休業日データを正常に読み込みました:', holidays);
        } else {
            throw new Error('休業日データの形式が正しくありません');
        }
        
    } catch (error) {
        console.error('休業日の読み込みに失敗しました:', error);
        holidays = [];
        
        if (currentPage === 'datetime-page') {
            const calendarGrid = document.getElementById('calendar-grid');
            calendarGrid.innerHTML = `
                <div class="error">
                    <h4>${ERROR_MESSAGES.holidayLoadFailed}</h4>
                    <p>エラー: ${error.message}</p>
                    <button onclick="retryLoadHolidays()" class="select-button" style="margin-top: 15px;">再試行</button>
                </div>
            `;
        }
        
        throw error;
    }
}

// 休業日データの再取得
async function retryLoadHolidays() {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '<div class="loading">休業日データを再取得しています...</div>';
    
    try {
        await loadHolidays();
        updateCalendar();
        console.log('休業日データの再取得が成功しました');
    } catch (error) {
        console.error('休業日データの再取得に失敗しました:', error);
    }
}

// 予約データの読み込み（修正版）
async function loadReservations(date) {
    try {
        console.log(`予約データ取得開始: ${date}`);
        
        const response = await fetch(`${API_BASE_URL}/reservations/${date}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log(`予約API レスポンス: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('予約API エラーレスポンス:', errorData);
            
            // 400エラーの場合は詳細なエラー処理
            if (response.status === 400) {
                console.warn(`予約データ取得失敗（400）: ${errorData?.message || '日付が無効'}`);
                reservations = [];
                return;
            }
            
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.reservations)) {
            reservations = data.reservations;
            console.log(`予約データ取得成功: ${reservations.length}件`);
        } else {
            reservations = [];
            console.warn('予約データの形式が正しくありません');
        }
        
    } catch (error) {
        console.error('予約データの読み込みに失敗しました:', error);
        reservations = [];
    }
}

// 複数の予約データを一括送信
async function saveMultipleReservations(reservationsArray) {
    try {
        const response = await fetch(`${API_BASE_URL}/reservations/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reservations: reservationsArray
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '予約の一括保存に失敗しました');
        }
        
        console.log('全ての予約データが正常に保存されました。');
        return result;
        
    } catch (error) {
        console.error('予約データの一括送信に失敗しました:', error);
        throw error;
    }
}

// 予約番号の重複チェック
async function checkReservationNumberExists(reservationNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/reservations/check/${reservationNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.exists || false;
        
    } catch (error) {
        console.error('予約番号の確認に失敗しました:', error);
        return false;
    }
}

// 月別スタッフ情報を取得（新機能）
async function getMonthlyStaffInfo(year, month) {
    try {
        const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        console.log(`月別スタッフ情報取得開始: ${yearMonth}`);
        
        const response = await fetch(`${API_BASE_URL}/staff/month/${yearMonth}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            console.warn(`月別スタッフ情報取得失敗: ${response.status}`);
            return {};
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`月別スタッフ情報取得成功: ${yearMonth} -> ${Object.keys(data.staff_data).length}件`);
            return data.staff_data;
        } else {
            console.warn(`月別スタッフ情報取得失敗: ${data.message}`);
            return {};
        }
        
    } catch (error) {
        console.error('月別スタッフ情報の取得に失敗しました:', error);
        return {};
    }
}
async function generateReservationNumber() {
    let reservationNumber;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
        reservationNumber = Math.floor(Math.random() * 90000000) + 10000000;
        attempts++;
        
        if (attempts >= maxAttempts) {
            throw new Error('予約番号の生成に失敗しました。しばらく時間をおいてから再度お試しください。');
        }
        
    } while (await checkReservationNumberExists(reservationNumber));
    
    return reservationNumber;
}
