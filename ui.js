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
    console.log('ページ遷移:', pageId);
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
    console.log('人数選択の表示を開始');
    const guestCountGrid = document.getElementById('guest-count-grid');
    
    if (!guestCountGrid) {
        console.error('guest-count-grid要素が見つかりません');
        return;
    }
    
    guestCountGrid.innerHTML = '';
    
    for (let count = 1; count <= APP_CONFIG.maxGuests; count++) {
        const guestCountItem = document.createElement('div');
        guestCountItem.className = 'guest-count-item';
        
        // データ属性を追加してカウントを保存
        guestCountItem.setAttribute('data-count', count);
        
        // クリックイベントを追加
        guestCountItem.addEventListener('click', function(e) {
            const clickedCount = parseInt(this.getAttribute('data-count'));
            selectGuestCount(clickedCount, this);
        });
        
        guestCountItem.innerHTML = `
            <div class="guest-count-number">${count}</div>
            <div class="guest-count-label">${count === 1 ? '名様' : '名様'}</div>
        `;
        
        guestCountGrid.appendChild(guestCountItem);
    }
    
    console.log(`${APP_CONFIG.maxGuests}個の人数選択ボタンを生成しました`);
}

// 人数選択（修正版）
function selectGuestCount(count, clickedElement) {
    console.log('人数選択:', count, '名様');
    
    // 既存の選択を解除
    document.querySelectorAll('.guest-count-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 新しい選択を追加
    if (clickedElement) {
        clickedElement.classList.add('selected');
    }
    
    selectedGuestCount = count;
    
    // 次へボタンを表示（存在する場合）
    const nextButton = document.getElementById('guest-next-button');
    if (nextButton) {
        nextButton.classList.add('show');
    }
    
    console.log('人数選択完了 - selectedGuestCount:', selectedGuestCount);
    
    // 少し遅延をかけてから自動で次のページに遷移
    setTimeout(() => {
        console.log('自動遷移開始');
        goToDatetimePage();
    }, 300);
}

// 座席（メニュー）の表示
function displaySeats() {
    const seatGrid = document.getElementById('seat-grid');
    
    console.log('displaySeats 呼び出し - menus:', menus);
    console.log('menus のキー数:', Object.keys(menus).length);
    
    if (!menus || Object.keys(menus).length === 0) {
        console.error('座席データが空です:', menus);
        seatGrid.innerHTML = `
            <div class="error">
                <p>座席情報がありません。管理者にお問い合わせください。</p>
                <button onclick="loadMenus()" class="select-button" style="margin-top: 15px;">再読込</button>
            </div>
        `;
        return;
    }
    
    seatGrid.innerHTML = '';
    
    Object.entries(menus).forEach(([seatName, seatData]) => {
        console.log(`座席追加: ${seatName}`, seatData);
        
        const seatItem = document.createElement('div');
        seatItem.className = 'seat-item';
        
        // クリックイベントを追加
        seatItem.addEventListener('click', function() {
            selectSeat(seatName, seatData, this);
        });
        
        // 座席の収容人数を表示（capacityまたはworktimeを使用）
        const capacity = seatData.capacity || seatData.worktime || 4;
        console.log(`座席 ${seatName} の収容人数: ${capacity} (capacity: ${seatData.capacity}, worktime: ${seatData.worktime})`);
        
        seatItem.innerHTML = `
            <div class="seat-header">
                <div class="seat-name">${seatName}</div>
                <div class="seat-capacity">${capacity}名様まで</div>
            </div>
            <div class="seat-description">${seatData.text || '落ち着いた雰囲気のお席です。'}</div>
        `;
        
        seatGrid.appendChild(seatItem);
    });
    
    console.log(`座席表示完了: ${Object.keys(menus).length}件`);
}

// 座席選択（修正版）
function selectSeat(seatName, seatData, clickedElement) {
    console.log('座席選択:', seatName);
    
    // 既存の選択を解除
    document.querySelectorAll('.seat-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 新しい選択を追加
    if (clickedElement) {
        clickedElement.classList.add('selected');
    }
    
    selectedSeat = { name: seatName, ...seatData };
    
    // 次へボタンを表示
    const nextButton = document.getElementById('seat-next-button');
    if (nextButton) {
        nextButton.classList.add('show');
    }
    
    console.log('座席選択完了 - selectedSeat:', selectedSeat);
}

// カレンダーの初期化
function initCalendar() {
    console.log('カレンダーの初期化');
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    updateCalendar();
}

// カレンダーの更新（スタッフ表示機能を削除）
async function updateCalendar() {
    console.log('カレンダーの更新開始');
    const monthYear = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    
    if (!monthYear || !calendarGrid) {
        console.error('カレンダー要素が見つかりません');
        return;
    }
    
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
        const isHoliday = japaneseHolidays && japaneseHolidays.includes(dateString);
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
        } else if (holidays && holidays.includes(dateString)) {
            dayCell.classList.add('disabled');
            dayCell.classList.add('holiday');
            dayCell.title = '休業日です';
            console.log(`❌ ${dateString} は予約不可（休業日）`);
        } else {
            // クリックイベントを追加
            dayCell.addEventListener('click', function() {
                selectDate(dateString, this);
            });
            
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
    
    console.log(`カレンダー更新完了 - 休業日: ${holidays ? holidays.length : 0}件, 祝日: ${japaneseHolidays ? japaneseHolidays.length : 0}件`);
    console.log(`予約可能期間: ${minBookingDate.getFullYear()}-${String(minBookingDate.getMonth() + 1).padStart(2, '0')}-${String(minBookingDate.getDate()).padStart(2, '0')} ～ ${maxBookingDate.getFullYear()}-${String(maxBookingDate.getMonth() + 1).padStart(2, '0')}-${String(maxBookingDate.getDate()).padStart(2, '0')}`);
}

// 日付選択（修正版）
function selectDate(dateString, clickedElement) {
    console.log('日付選択:', dateString);
    
    // 既存の選択を解除
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // 新しい選択を追加
    if (clickedElement) {
        clickedElement.classList.add('selected');
    }
    
    selectedDate = dateString;
    selectedTime = null;
    
    console.log('日付選択完了 - selectedDate:', selectedDate);
    
    displayTimeSlots(dateString);
}

// 時間スロットの表示（レストラン向け・予約件数制限対応）
async function displayTimeSlots(date) {
    console.log('時間スロット表示開始:', date);
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const timeSlots = document.getElementById('time-slots');
    
    if (!timeSlotsContainer || !timeSlots) {
        console.error('時間スロット要素が見つかりません');
        return;
    }
    
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
        minimumDate.setDate(minimumDate.getDate() + (APP_CONFIG.minAdvanceBookingDays || 1));
        
        // 最大予約日数チェック
        const maximumDate = new Date(today);
        maximumDate.setDate(maximumDate.getDate() + (APP_CONFIG.maxAdvanceBookingDays || 30));
        
        console.log(`displayTimeSlots 日付チェック: ${date}`);
        
        if (targetDate < minimumDate || targetDate > maximumDate) {
            console.log('❌ 予約期間外です');
            timeSlots.innerHTML = '<div class="error">この日は予約できません。</div>';
            timeSlotsContainer.style.display = 'none';
            return;
        }
        
        // 休業日チェック
        if (holidays && holidays.includes(date)) {
            console.log('❌ 休業日です');
            timeSlots.innerHTML = '<div class="error">この日は休業日です。</div>';
            return;
        }
        
        console.log('✅ 予約可能な日付です');
        
        // バックエンドから時間スロット情報を取得
        let slotInfo = {};
        let availableTimeSlots = [];
        
        try {
            if (typeof getAvailableTimeSlots === 'function') {
                slotInfo = await getAvailableTimeSlots(date);
                
                console.log('API レスポンス - slotInfo:', slotInfo);
                
                // 予約満了チェック（修正版）
                if (slotInfo.isFull === true || slotInfo.reservationCount >= 5) {
                    const reservationCount = slotInfo.reservationCount || 5;
                    console.log(`❌ ${date}は予約満了 (${reservationCount}/5件)`);
                    
                    // 時間スロットのタイトルを更新
                    const timeSelectionTitle = document.querySelector('.time-selection-title');
                    if (timeSelectionTitle) {
                        timeSelectionTitle.innerHTML = `この日の予約は満了しました`;
                    }
                    
                    // 満了メッセージを表示
                    timeSlots.innerHTML = `
                        <div class="error" style="text-align: center; padding: 30px 20px;">
                            <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                            <h3 style="color: #dc3545; margin-bottom: 10px; font-size: 18px;">予約満了</h3>
                            <p style="margin-bottom: 15px; line-height: 1.6;">
                                この日の予約は上限に達しました。<br>
                                （予約件数: ${reservationCount}/5件）
                            </p>
                            <p style="color: #6c757d; font-size: 14px;">
                                別の日程をお選びください。
                            </p>
                        </div>
                    `;
                    return;
                }
                
                availableTimeSlots = slotInfo.timeslots || [];
            }
        } catch (error) {
            console.warn('APIから時間スロットを取得できませんでした:', error);
        }
        
        // フォールバック: クライアント側で時間スロットを生成
        if (availableTimeSlots.length === 0 && !slotInfo.isFull) {
            const isWeekend = typeof isWeekendOrHoliday === 'function' ? isWeekendOrHoliday(date) : false;
            if (isWeekend) {
                availableTimeSlots = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];
            } else {
                availableTimeSlots = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];
            }
        }
        
        // 予約状況を取得
        if (typeof loadReservations === 'function') {
            try {
                await loadReservations(date);
            } catch (error) {
                console.warn('予約状況の取得に失敗:', error);
                if (typeof reservations === 'undefined') {
                    window.reservations = [];
                }
            }
        } else {
            if (typeof reservations === 'undefined') {
                window.reservations = [];
            }
        }
        
        timeSlots.innerHTML = '';
        
        const isWeekend = slotInfo.isWeekend !== undefined ? slotInfo.isWeekend : (typeof isWeekendOrHoliday === 'function' ? isWeekendOrHoliday(date) : false);
        
        // 時間スロットのタイトルを更新（予約件数表示を追加）
        const timeSelectionTitle = document.querySelector('.time-selection-title');
        if (timeSelectionTitle) {
            const dayType = isWeekend ? '土日祝' : '平日';
            const reservationCount = slotInfo.reservationCount !== undefined ? slotInfo.reservationCount : 0;
            const remainingSlots = Math.max(0, 5 - reservationCount);
            
            let titleText;
            
            if (isWeekend) {
                titleText = `時間を選択してください（${dayType}: ランチ11:00-15:00 / ディナー17:00-20:00）`;
            } else {
                titleText = `時間を選択してください（${dayType}: ランチ11:00-15:00）`;
            }
            
            // 予約件数情報を追加
            if (reservationCount > 0) {
                titleText += `<br><span style="color: ${remainingSlots <= 2 ? '#dc3545' : '#28a745'}; font-weight: bold; font-size: 14px;">残り ${remainingSlots} 枠（予約: ${reservationCount}/5件）</span>`;
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
            
            // 予約済みチェック
            const isBooked = reservations && reservations.some(reservation => 
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
                timeSlot.addEventListener('click', function() {
                    selectTime(time, this);
                });
                timeSlot.title = `${time}を選択`;
            }
            
            timeSlots.appendChild(timeSlot);
        });
        
        const dayTypeText = isWeekend ? '土日祝' : '平日';
        const countText = slotInfo.reservationCount !== undefined ? ` (予約: ${slotInfo.reservationCount}/5件)` : '';
        console.log(`${date}の時間スロット表示完了 (${dayTypeText}: ${availableTimeSlots.length}件)${countText}`);
        
    } catch (error) {
        console.error('予約状況の確認に失敗しました:', error);
        timeSlots.innerHTML = '<div class="error">予約状況の確認に失敗しました。</div>';
    }
}

// 時間選択（修正版）
function selectTime(time, clickedElement) {
    console.log('時間選択:', time);
    
    // 既存の選択を解除
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // 新しい選択を追加
    if (clickedElement) {
        clickedElement.classList.add('selected');
    }
    
    selectedTime = time;
    
    const nextButton = document.getElementById('datetime-next-button');
    if (nextButton) {
        nextButton.classList.add('show');
    }
    
    console.log('時間選択完了 - selectedTime:', selectedTime);
}

// 確認画面の詳細表示
function displayConfirmationDetails() {
    console.log('確認画面の詳細表示');
    const confirmationDetails = document.getElementById('confirmation-details');
    
    if (!confirmationDetails) {
        console.error('confirmation-details要素が見つかりません');
        return;
    }
    
    const lastName = document.getElementById('last-name')?.value?.trim() || '';
    const phoneNumber = document.getElementById('first-name')?.value?.trim() || '';
    const email = document.getElementById('email')?.value?.trim() || '';
    
    // 選択された日時の詳細情報を追加
    const isWeekend = typeof isWeekendOrHoliday === 'function' ? isWeekendOrHoliday(selectedDate) : false;
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
    `;
    
    if (selectedSeat) {
        html += `
            <div class="confirmation-item">
                <span class="confirmation-label">座席</span>
                <span class="confirmation-value">${selectedSeat.name}</span>
            </div>
        `;
    }
    
    html += `
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
    console.log('確認画面の詳細表示完了');
}

// 完了画面の詳細表示
function displayCompletionDetails(mainReservation) {
    console.log('完了画面の詳細表示');
    const completionReservationNumber = document.getElementById('completion-reservation-number');
    const completionDetails = document.getElementById('completion-details');
    
    if (completionReservationNumber && mainReservation) {
        completionReservationNumber.textContent = `予約番号: ${mainReservation.reservationNumber}`;
    }
    
    if (!completionDetails) {
        console.error('completion-details要素が見つかりません');
        return;
    }
    
    // 日時の詳細情報を追加
    const isWeekend = typeof isWeekendOrHoliday === 'function' ? isWeekendOrHoliday(selectedDate) : false;
    const dayType = isWeekend ? '土日祝' : '平日';
    
    let html = `
        <div class="confirmation-section">
            <div class="confirmation-title">店舗情報</div>
            <div class="confirmation-item">
                <span class="confirmation-label">店舗名</span>
                <span class="confirmation-value">${APP_CONFIG.shopInfo?.name || 'レストランよしの川'}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">住所</span>
                <span class="confirmation-value">${APP_CONFIG.shopInfo?.address || '〒637-0031 奈良県五條市小島町４４９−１'}</span>
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
    `;
    
    if (selectedSeat) {
        html += `
            <div class="confirmation-item">
                <span class="confirmation-label">座席</span>
                <span class="confirmation-value">${selectedSeat.name}</span>
            </div>
        `;
    }
    
    if (mainReservation) {
        html += `
            <div class="confirmation-item">
                <span class="confirmation-label">代表者お名前</span>
                <span class="confirmation-value">${mainReservation["Name-f"] || ''}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">電話番号</span>
                <span class="confirmation-value">${mainReservation["Name-s"] || ''}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">メールアドレス</span>
                <span class="confirmation-value">${mainReservation.mail || ''}</span>
            </div>
        `;
    }
    
    html += `
        </div>
    `;
    
    completionDetails.innerHTML = html;
    console.log('完了画面の詳細表示完了');
}
