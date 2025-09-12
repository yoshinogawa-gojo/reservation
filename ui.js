// レストランよしの川 予約サイト - UI制御モジュール

// ロゴ画像の表示制御（Safari対応）
function initLogoDisplay() {
    const headerLogoImg = document.querySelector('.header-logo .logo-image') || document.querySelector('.header-logo img');
    const headerLogoContainer = document.querySelector('.header-logo');
    
    if (headerLogoImg && headerLogoContainer) {
        headerLogoImg.onload = function() {
            headerLogoContainer.classList.add('has-image');
        };
        
        headerLogoImg.onerror = function() {
            headerLogoContainer.classList.remove('has-image');
        };
        
        if (headerLogoImg.complete && headerLogoImg.naturalHeight !== 0) {
            headerLogoContainer.classList.add('has-image');
        }
    }
}

// ページ遷移
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
}

// 重要なお知らせの表示
function displayNotices() {
    console.log('=== displayNotices() 開始 ===');
    console.log('notices配列:', notices);
    
    const noticeContent = document.querySelector('.notice-content');
    
    if (!noticeContent) {
        console.error('notice-content要素が見つかりません');
        return;
    }
    
    console.log('notice-content要素が見つかりました');
    
    if (!notices || notices.length === 0) {
        console.warn('notices配列が空です');
        noticeContent.innerHTML = `
            <div class="error">
                <p>重要なお知らせを取得できませんでした。</p>
                <button onclick="retryLoadNotices()" class="select-button" style="margin-top: 15px;">再試行</button>
            </div>
        `;
        return;
    }
    
    console.log('お知らせを表示開始:', notices.length, '件');
    noticeContent.innerHTML = '';
    
    notices.forEach((notice, index) => {
        console.log(`お知らせ${index + 1}:`, notice);
        
        const noticeItem = document.createElement('div');
        noticeItem.className = 'notice-item';
        
        const icon = notice.icon || '📝';
        const text = notice.text || 'お知らせ内容が設定されていません';
        
        noticeItem.innerHTML = `
            <span class="notice-icon">${icon}</span>
            <span class="notice-text">${text}</span>
        `;
        
        noticeContent.appendChild(noticeItem);
        console.log(`お知らせ${index + 1}を追加しました`);
    });
    
    console.log(`${notices.length}件の重要なお知らせを表示しました`);
    console.log('=== displayNotices() 終了 ===');
}

// 人数選択の表示
function displayGuestCounts() {
    const guestCountGrid = document.getElementById('guest-count-grid');
    
    guestCountGrid.innerHTML = '';
    
    for (let count = 1; count <= APP_CONFIG.maxGuests; count++) {
        const guestCountItem = document.createElement('div');
        guestCountItem.className = 'guest-count-item';
        guestCountItem.onclick = () => selectGuestCount(count);
        
        guestCountItem.innerHTML = `
            <div class="guest-count-number">${count}</div>
            <div class="guest-count-label">${count === 1 ? '名様' : '名様'}</div>
        `;
        
        guestCountGrid.appendChild(guestCountItem);
    }
}

// 人数選択
function selectGuestCount(count) {
    document.querySelectorAll('.guest-count-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    selectedGuestCount = count;
    
    // 次へボタンを表示（人数選択後は自動的に次のページへ）
    setTimeout(() => {
        goToDatetimePage();
    }, 300);
}

// 座席（メニュー）の表示
function displaySeats() {
    const seatGrid = document.getElementById('seat-grid');
    
    if (Object.keys(menus).length === 0) {
        seatGrid.innerHTML = '<div class="error">座席情報がありません。管理者にお問い合わせください。</div>';
        return;
    }
    
    seatGrid.innerHTML = '';
    
    Object.entries(menus).forEach(([seatName, seatData]) => {
        const seatItem = document.createElement('div');
        seatItem.className = 'seat-item';
        seatItem.onclick = () => selectSeat(seatName, seatData);
        
        // 座席の収容人数を表示（worktimeを人数として使用）
        const capacity = seatData.worktime || 4;
        
        seatItem.innerHTML = `
            <div class="seat-header">
                <div class="seat-name">${seatName}</div>
                <div class="seat-capacity">${capacity}名様まで</div>
            </div>
            <div class="seat-description">${seatData.text || '落ち着いた雰囲気のお席です。'}</div>
        `;
        
        seatGrid.appendChild(seatItem);
    });
}

// 座席選択
function selectSeat(seatName, seatData) {
    document.querySelectorAll('.seat-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    selectedSeat = { name: seatName, ...seatData };
    
    // 次へボタンを表示
    document.getElementById('seat-next-button').classList.add('show');
}

// カレンダーの初期化
function initCalendar() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    updateCalendar();
}

// カレンダーの更新（スタッフ表示機能を削除）
async function updateCalendar() {
    const monthYear = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    
    monthYear.textContent = `${currentYear}年 ${MONTH_NAMES[currentMonth]}`;
    
    calendarGrid.innerHTML = '';
    
    // 曜日ヘッダー
    DAY_HEADERS.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.color = '#2c3e50';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.padding = '10px 0';
        calendarGrid.appendChild(dayHeader);
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // 日本時間での今日の日付を取得
    const now = new Date();
    const japanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
    const today = new Date(japanTime.getFullYear(), japanTime.getMonth(), japanTime.getDate());
    
    // 翌日から予約可能（1日後から）
    const minBookingDate = new Date(today);
    minBookingDate.setDate(minBookingDate.getDate() + APP_CONFIG.minAdvanceBookingDays);
    
    // 最大予約可能日を計算
    const maxBookingDate = new Date(today);
    maxBookingDate.setDate(maxBookingDate.getDate() + APP_CONFIG.maxAdvanceBookingDays);
    
    console.log('カレンダー更新:');
    console.log(`今日（日本時間）: ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    console.log(`最小予約日: ${minBookingDate.getFullYear()}-${String(minBookingDate.getMonth() + 1).padStart(2, '0')}-${String(minBookingDate.getDate()).padStart(2, '0')}`);
    console.log(`最大予約日: ${maxBookingDate.getFullYear()}-${String(maxBookingDate.getMonth() + 1).padStart(2, '0')}-${String(maxBookingDate.getDate()).padStart(2, '0')}`);
    
    // 空白セル
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        calendarGrid.appendChild(emptyCell);
    }
    
    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const cellDate = new Date(currentYear, currentMonth, day);
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 祝日判定を追加
        const isHoliday = japaneseHolidays.includes(dateString);
        if (isHoliday) {
            dayCell.classList.add('japanese-holiday');
        }
        
        // 予約可能日の判定（翌日から）
        if (cellDate < minBookingDate) {
            dayCell.classList.add('disabled');
            dayCell.title = `予約は翌日以降から可能です`;
            console.log(`❌ ${dateString} は予約不可（当日または過去の日付）`);
        } else if (cellDate > maxBookingDate) {
            dayCell.classList.add('disabled');
            dayCell.title = `予約は${APP_CONFIG.maxAdvanceBookingDays}日後まで可能です`;
            console.log(`❌ ${dateString} は予約不可（最大予約日より後）`);
        } else if (holidays.includes(dateString)) {
            dayCell.classList.add('disabled');
            dayCell.classList.add('holiday');
            dayCell.title = '休業日です';
            console.log(`❌ ${dateString} は予約不可（休業日）`);
        } else {
            dayCell.onclick = () => selectDate(dateString);
            
            // 平日・土日祝を示すツールチップを追加
            const isWeekend = isWeekendOrHoliday(dateString);
            const timeInfo = isWeekend ? 'ランチ・ディナー' : 'ランチのみ';
            const dayType = isWeekend ? '土日祝' : '平日';
            
            const tooltipText = `${dateString}を選択 (${dayType}: ${timeInfo})`;
            dayCell.title = tooltipText;
            
            console.log(`✅ ${dateString} は予約可能`);
        }
        
        calendarGrid.appendChild(dayCell);
    }
    
    console.log(`カレンダー更新完了 - 休業日: ${holidays.length}件, 祝日: ${japaneseHolidays.length}件`);
    console.log(`予約可能期間: ${minBookingDate.getFullYear()}-${String(minBookingDate.getMonth() + 1).padStart(2, '0')}-${String(minBookingDate.getDate()).padStart(2, '0')} ～ ${maxBookingDate.getFullYear()}-${String(maxBookingDate.getMonth() + 1).padStart(2, '0')}-${String(maxBookingDate.getDate()).padStart(2, '0')}`);
}

// 日付選択
function selectDate(dateString) {
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    selectedDate = dateString;
    selectedTime = null;
    
    displayTimeSlots(dateString);
}

// 時間スロットの表示（レストラン向け）
async function displayTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const timeSlots = document.getElementById('time-slots');
    
    timeSlotsContainer.style.display = 'block';
    timeSlots.innerHTML = '<div class="loading">時間を確認しています...</div>';
    
    try {
        // 日付判定
        const [year, month, day] = date.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        
        // 日本時間での今日の日付を取得
        const now = new Date();
        const japanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
        const today = new Date(japanTime.getFullYear(), japanTime.getMonth(), japanTime.getDate());
        
        // 翌日から予約可能
        const minimumDate = new Date(today);
        minimumDate.setDate(minimumDate.getDate() + APP_CONFIG.minAdvanceBookingDays);
        
        // 最大予約日数チェック
        const maximumDate = new Date(today);
        maximumDate.setDate(maximumDate.getDate() + APP_CONFIG.maxAdvanceBookingDays);
        
        console.log(`displayTimeSlots 日付チェック: ${date}`);
        
        if (targetDate < minimumDate || targetDate > maximumDate) {
            console.log('❌ 予約期間外です');
            timeSlots.innerHTML = '<div class="error">この日は予約できません。</div>';
            return;
        }
        
        // 休業日チェック
        if (holidays.includes(date)) {
            console.log('❌ 休業日です');
            timeSlots.innerHTML = '<div class="error">この日は休業日です。</div>';
            return;
        }
        
        console.log('✅ 予約可能な日付です');
        
        // バックエンドから時間スロット情報を取得（フォールバック付き）
        const slotInfo = await getAvailableTimeSlots(date);
        
        // 予約状況を取得
        await loadReservations(date);
        
        timeSlots.innerHTML = '';
        
        // バックエンドから取得した時間スロットを使用
        const availableTimeSlots = slotInfo.timeslots || getTimeSlotsForDate(date);
        const isWeekend = slotInfo.isWeekend !== undefined ? slotInfo.isWeekend : isWeekendOrHoliday(date);
        
        // 時間スロットのタイトルを更新
        const timeSelectionTitle = document.querySelector('.time-selection-title');
        if (timeSelectionTitle) {
            const dayType = isWeekend ? '土日祝' : '平日';
            let titleText;
            
            if (isWeekend) {
                titleText = `時間を選択してください（${dayType}: ランチ11:00-15:00 / ディナー17:00-20:00）`;
            } else {
                titleText = `時間を選択してください（${dayType}: ランチ11:00-15:00）`;
            }
            
            timeSelectionTitle.innerHTML = titleText;
        }
        
        if (availableTimeSlots.length === 0) {
            timeSlots.innerHTML = '<div class="error">この日は予約可能な時間がありません。</div>';
            return;
        }
        
        availableTimeSlots.forEach(time => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = time;
            
            const isBooked = reservations.some(reservation => 
                reservation.date === date && 
                reservation.Time === time && 
                reservation.states === 0
            );
            
            if (isBooked) {
                timeSlot.classList.add('disabled');
                timeSlot.textContent += ' ✖️';
                timeSlot.title = 'この時間は既に予約済みです';
            } else {
                timeSlot.textContent += ' ⭕';
                timeSlot.onclick = () => selectTime(time);
                timeSlot.title = `${time}を選択`;
            }
            
            timeSlots.appendChild(timeSlot);
        });
        
        const dayTypeText = isWeekend ? '土日祝' : '平日';
        console.log(`${date}の時間スロット表示完了 (${dayTypeText}: ${availableTimeSlots.length}件)`);
        
    } catch (error) {
        console.error('予約状況の確認に失敗しました:', error);
        timeSlots.innerHTML = '<div class="error">予約状況の確認に失敗しました。</div>';
    }
}

// 時間選択
function selectTime(time) {
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    selectedTime = time;
    
    document.getElementById('datetime-next-button').classList.add('show');
}

// 確認画面の詳細表示
function displayConfirmationDetails() {
    const confirmationDetails = document.getElementById('confirmation-details');
    
    const lastName = document.getElementById('last-name').value.trim();
    const phoneNumber = document.getElementById('first-name').value.trim();
    const email = document.getElementById('email').value.trim();
    
    // 選択された日時の詳細情報を追加
    const isWeekend = isWeekendOrHoliday(selectedDate);
    const dayType = isWeekend ? '土日祝' : '平日';
    
    let html = `
        <div class="confirmation-item">
            <span class="confirmation-label">予約日時</span>
            <span class="confirmation-value">${selectedDate} ${selectedTime} (${dayType})</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">ご利用人数</span>
            <span class="confirmation-value">${selectedGuestCount}名様</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">座席</span>
            <span class="confirmation-value">${selectedSeat.name}</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">代表者お名前</span>
            <span class="confirmation-value">${lastName}</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">電話番号</span>
            <span class="confirmation-value">${phoneNumber}</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">メールアドレス</span>
            <span class="confirmation-value">${email}</span>
        </div>
    `;
    
    confirmationDetails.innerHTML = html;
}

// 完了画面の詳細表示
function displayCompletionDetails(mainReservation) {
    document.getElementById('completion-reservation-number').textContent = `予約番号: ${mainReservation.reservationNumber}`;
    
    // 日時の詳細情報を追加
    const isWeekend = isWeekendOrHoliday(selectedDate);
    const dayType = isWeekend ? '土日祝' : '平日';
    
    let html = `
        <div class="confirmation-section">
            <div class="confirmation-title">店舗情報</div>
            <div class="confirmation-item">
                <span class="confirmation-label">店舗名</span>
                <span class="confirmation-value">${APP_CONFIG.shopInfo.name}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">住所</span>
                <span class="confirmation-value">${APP_CONFIG.shopInfo.address}</span>
            </div>
        </div>
        
        <div class="confirmation-section">
            <div class="confirmation-title">予約詳細</div>
            <div class="confirmation-item">
                <span class="confirmation-label">予約日時</span>
                <span class="confirmation-value">${selectedDate} ${selectedTime} (${dayType})</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">ご利用人数</span>
                <span class="confirmation-value">${selectedGuestCount}名様</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">座席</span>
                <span class="confirmation-value">${selectedSeat.name}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">代表者お名前</span>
                <span class="confirmation-value">${mainReservation["Name-f"]}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">電話番号</span>
                <span class="confirmation-value">${mainReservation["Name-s"]}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">メールアドレス</span>
                <span class="confirmation-value">${mainReservation.mail}</span>
            </div>
        </div>
    `;
    
    document.getElementById('completion-details').innerHTML = html;
}
