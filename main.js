// レストランよしの川 予約サイト - メイン処理

// 予約送信の状態管理
let isSubmittingReservation = false;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded 開始 ===');
    
    // 各関数を順番に呼び出し
    loadReservationSettings(); // 予約設定を最初に読み込み
    console.log('loadReservationSettings() を呼び出しました');
    
    loadMenus(); // 座席情報として使用
    console.log('loadMenus() を呼び出しました');
    
    loadNotices(); // 重要なお知らせの読み込み
    console.log('loadNotices() を呼び出しました');
    
    // 祝日データを読み込み
    loadJapaneseHolidays();
    console.log('loadJapaneseHolidays() を呼び出しました');
    
    initCalendar();
    console.log('initCalendar() を呼び出しました');
    
    loadHolidays();
    console.log('loadHolidays() を呼び出しました');
    
    initLogoDisplay();
    console.log('initLogoDisplay() を呼び出しました');
    
    // 同意チェックボックスのイベントリスナーを設定
    initAgreementCheckbox();
    console.log('initAgreementCheckbox() を呼び出しました');
    
    // 人数選択画面の初期化（初期表示なので必須）
    displayGuestCounts();
    console.log('displayGuestCounts() を呼び出しました');
    
    // ローカルストレージ対応チェック
    if (typeof isLocalStorageSupported === 'function' && isLocalStorageSupported()) {
        console.log('ローカルストレージがサポートされています');
    } else {
        console.warn('ローカルストレージがサポートされていません');
    }
    
    console.log('=== DOMContentLoaded 完了 ===');
});

// 同意チェックボックスの初期化
function initAgreementCheckbox() {
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const submitButton = document.getElementById('submit-button');
    
    if (agreementCheckbox && submitButton) {
        agreementCheckbox.addEventListener('change', function() {
            submitButton.disabled = !this.checked;
            if (this.checked) {
                submitButton.style.opacity = '1';
                submitButton.style.cursor = 'pointer';
            } else {
                submitButton.style.opacity = '0.5';
                submitButton.style.cursor = 'not-allowed';
            }
        });
    }
}

// 同意チェックボックスをリセット
function resetAgreementCheckbox() {
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const submitButton = document.getElementById('submit-button');
    
    if (agreementCheckbox && submitButton) {
        agreementCheckbox.checked = false;
        submitButton.disabled = true;
        submitButton.style.opacity = '0.5';
        submitButton.style.cursor = 'not-allowed';
    }
}

// ページ遷移関数群（修正版）
function goToGuestCountPage() {
    console.log('人数選択ページに移動');
    showPage('guest-count-page');
    resetFormData();
    resetSubmissionState();
    displayGuestCounts();
}

async function goToDatetimePage() {
    if (!selectedGuestCount) {
        alert('人数を選択してください。');
        goToGuestCountPage();
        return;
    }
    
    console.log('日時選択ページに移動 - 選択人数:', selectedGuestCount + '名様');
    showPage('datetime-page');
    
    const calendarGrid = document.getElementById('calendar-grid');
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const nextButton = document.getElementById('datetime-next-button');
    
    if (calendarGrid) {
        calendarGrid.innerHTML = '<div class="loading">カレンダーを読み込んでいます...</div>';
    }
    if (timeSlotsContainer) {
        timeSlotsContainer.style.display = 'none';
    }
    if (nextButton) {
        nextButton.classList.remove('show');
    }
    
    try {
        // 予約設定、祝日データ、休業日データを並行して読み込み
        const promises = [];
        
        if (typeof loadReservationSettings === 'function') {
            promises.push(loadReservationSettings());
        }
        if (typeof loadJapaneseHolidays === 'function') {
            promises.push(loadJapaneseHolidays());
        }
        if (typeof loadHolidays === 'function') {
            promises.push(loadHolidays());
        }
        
        if (promises.length > 0) {
            await Promise.all(promises);
        }
        
        updateCalendar();
        console.log('日時選択ページの初期化が完了しました');
    } catch (error) {
        console.error('日時選択ページの初期化に失敗しました:', error);
        if (calendarGrid) {
            calendarGrid.innerHTML = '<div class="error">カレンダーの読み込みに失敗しました。再度お試しください。</div>';
        }
    }
}

function goToSeatPage() {
    if (!selectedDate || !selectedTime) {
        alert('日時を選択してください。');
        return;
    }
    
    // 選択された日付が予約可能かチェック
    if (typeof isValidReservationDate === 'function' && !isValidReservationDate(selectedDate)) {
        const maxDays = APP_CONFIG.maxAdvanceBookingDays || 30;
        alert(`選択された日付は予約できません。翌日から${maxDays}日後まで予約可能です。`);
        goToDatetimePage();
        return;
    }
    
    console.log('座席選択ページに移動');
    showPage('seat-page');
    
    // 座席情報が読み込まれていない場合は再読み込み
    if (!menus || Object.keys(menus).length === 0) {
        console.log('座席情報が未読み込みのため再読み込み開始');
        const seatGrid = document.getElementById('seat-grid');
        if (seatGrid) {
            seatGrid.innerHTML = '<div class="loading">座席情報を読み込んでいます...</div>';
        }
        
        if (typeof loadMenus === 'function') {
            loadMenus().then(() => {
                console.log('座席情報再読み込み完了:', menus);
                displaySeats();
            }).catch((error) => {
                console.error('座席情報再読み込み失敗:', error);
                if (seatGrid) {
                    seatGrid.innerHTML = `
                        <div class="error">
                            <p>座席情報の読み込みに失敗しました。</p>
                            <button onclick="loadMenus().then(() => displaySeats())" class="select-button">再試行</button>
                        </div>
                    `;
                }
            });
        } else {
            // loadMenus関数が存在しない場合のフォールバック
            console.warn('loadMenus関数が存在しません。フォールバック座席データを使用します。');
            menus = {
                'テーブル席A': {
                    text: '窓際の明るいテーブル席です。',
                    worktime: 4,
                    fare: 0
                },
                'テーブル席B': {
                    text: '静かな奥側のテーブル席です。',
                    worktime: 6,
                    fare: 0
                },
                'カウンター席': {
                    text: '料理人の手さばきが見えるカウンター席です。',
                    worktime: 2,
                    fare: 0
                }
            };
            displaySeats();
        }
    } else {
        displaySeats();
    }
    
    // 座席選択ページの次へボタンを非表示にリセット
    const seatNextButton = document.getElementById('seat-next-button');
    if (seatNextButton) {
        seatNextButton.classList.remove('show');
    }
}

function goToInfoPage() {
    if (!selectedSeat) {
        alert('座席を選択してください。');
        return;
    }
    
    console.log('情報入力ページに移動');
    showPage('info-page');
    
    // 顧客情報の自動入力
    if (typeof isLocalStorageSupported === 'function' && isLocalStorageSupported()) {
        setTimeout(() => {
            if (typeof autoFillCustomerInfo === 'function') {
                autoFillCustomerInfo();
            }
        }, 100);
    }
}

function goToConfirmPage() {
    if (!validateInfoForm()) {
        return;
    }
    console.log('確認ページに移動');
    showPage('confirm-page');
    displayConfirmationDetails();
    resetSubmissionState();
    resetAgreementCheckbox();
    
    // 情報保存オプションの表示
    if (typeof isLocalStorageSupported === 'function' && isLocalStorageSupported()) {
        if (typeof showSaveInfoOption === 'function') {
            showSaveInfoOption();
        }
    }
}

function goToCompletionPage() {
    console.log('完了ページに移動');
    showPage('completion-page');
}

// 月変更（修正版）
async function changeMonth(direction) {
    console.log('月変更:', direction > 0 ? '次月' : '前月');
    currentMonth += direction;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const nextButton = document.getElementById('datetime-next-button');
    
    if (timeSlotsContainer) {
        timeSlotsContainer.style.display = 'none';
    }
    if (nextButton) {
        nextButton.classList.remove('show');
    }
    
    selectedDate = null;
    selectedTime = null;
    
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        calendarGrid.innerHTML = '<div class="loading">カレンダーを更新しています...</div>';
    }
    
    try {
        const promises = [];
        
        if (typeof loadReservationSettings === 'function') {
            promises.push(loadReservationSettings());
        }
        if (typeof loadHolidays === 'function') {
            promises.push(loadHolidays());
        }
        
        if (promises.length > 0) {
            await Promise.all(promises);
        }
        
        updateCalendar();
        console.log(`${currentYear}年${currentMonth + 1}月のカレンダーを更新しました`);
    } catch (error) {
        console.error('カレンダー更新に失敗しました:', error);
        if (calendarGrid) {
            calendarGrid.innerHTML = '<div class="error">カレンダーの更新に失敗しました。再度お試しください。</div>';
        }
    }
}

// 電話番号のバリデーション（数字のみ対応）
function validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^0\d{9,10}$/;
    const numericOnly = /^\d+$/.test(phoneNumber);
    
    if (!numericOnly) {
        return false;
    }
    
    return phoneRegex.test(phoneNumber);
}

// 入力フォームの検証（修正版）
function validateInfoForm() {
    const lastName = document.getElementById('last-name')?.value?.trim() || '';
    const phoneNumber = document.getElementById('first-name')?.value?.trim() || '';
    const email = document.getElementById('email')?.value?.trim() || '';
    
    if (!lastName || !phoneNumber || !email) {
        alert('必須項目を入力してください。');
        return false;
    }
    
    // 電話番号の形式チェック（数字のみ）
    if (!validatePhoneNumber(phoneNumber)) {
        alert('正しい電話番号を入力してください。（例：09012345678 - 数字のみ10〜11桁）');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('正しいメールアドレスを入力してください。');
        return false;
    }
    
    // 選択された日時の再検証
    if (typeof isValidReservationDate === 'function' && !isValidReservationDate(selectedDate)) {
        const maxDays = APP_CONFIG.maxAdvanceBookingDays || 30;
        alert(`選択された日付は予約できません。翌日から${maxDays}日後まで予約可能です。`);
        goToDatetimePage();
        return false;
    }
    
    return true;
}

// 予約送信状態をリセット
function resetSubmissionState() {
    isSubmittingReservation = false;
    const confirmButton = document.querySelector('#confirm-page .confirm-button');
    if (confirmButton) {
        // 同意チェックボックスの状態をチェック
        const agreementCheckbox = document.getElementById('agreement-checkbox');
        const isAgreed = agreementCheckbox ? agreementCheckbox.checked : false;
        
        confirmButton.disabled = !isAgreed;
        confirmButton.textContent = '予約する';
        confirmButton.style.opacity = isAgreed ? '1' : '0.5';
        confirmButton.style.cursor = isAgreed ? 'pointer' : 'not-allowed';
    }
}

// 予約送信中の状態に変更
function setSubmittingState() {
    isSubmittingReservation = true;
    const confirmButton = document.querySelector('#confirm-page .confirm-button');
    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = '予約中...';
        confirmButton.style.opacity = '0.6';
        confirmButton.style.cursor = 'not-allowed';
    }
}

// 予約送信（修正版）
async function submitReservation() {
    // 既に送信処理中の場合は何もしない
    if (isSubmittingReservation) {
        console.log('予約送信は既に処理中です。重複送信を防止しました。');
        return;
    }
    
    try {
        // 送信処理中の状態に変更
        setSubmittingState();
        
        console.log('予約送信処理を開始します...');
        
        // 最終的な日付検証
        if (typeof isValidReservationDate === 'function' && !isValidReservationDate(selectedDate)) {
            const maxDays = APP_CONFIG.maxAdvanceBookingDays || 30;
            alert(`選択された日付は予約できません。翌日から${maxDays}日後まで予約可能です。`);
            goToDatetimePage();
            return;
        }
        
        // 予約状況の確認
        if (typeof loadReservations === 'function') {
            await loadReservations(selectedDate);
        }
        
        // 予約の重複チェック
        if (reservations && reservations.length > 0) {
            const isStillAvailable = !reservations.some(reservation => 
                reservation.date === selectedDate && 
                reservation.Time === selectedTime && 
                reservation.states === 0
            );
            
            if (!isStillAvailable) {
                alert('申し訳ございません。選択された時間は既に予約が入りました。別の時間をお選びください。');
                goToDatetimePage();
                return;
            }
        }
        
        // 予約番号の生成
        let mainReservationNumber;
        if (typeof generateReservationNumber === 'function') {
            mainReservationNumber = await generateReservationNumber();
        } else {
            mainReservationNumber = Math.floor(Math.random() * 90000000) + 10000000;
        }
        
        // 予約データの作成
        const mainReservation = {
            reservationNumber: mainReservationNumber,
            Menu: selectedSeat ? selectedSeat.name : 'テーブル席', // 座席名をメニューとして保存
            "Name-f": document.getElementById('last-name').value.trim(),
            "Name-s": document.getElementById('first-name').value.trim(), // 電話番号
            Time: selectedTime,
            WorkTime: selectedGuestCount, // 人数をworktimeとして保存
            date: selectedDate,
            mail: document.getElementById('email').value.trim(),
            states: 0
        };
        
        // 予約データの送信
        if (typeof saveMultipleReservations === 'function') {
            await saveMultipleReservations([mainReservation]);
        } else {
            // API関数が存在しない場合のシミュレーション
            console.log('予約データ送信をシミュレート:', mainReservation);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        }
        
        // 顧客情報の保存処理
        if (typeof isLocalStorageSupported === 'function' && isLocalStorageSupported()) {
            if (typeof handleCustomerInfoSave === 'function') {
                handleCustomerInfoSave();
            }
        }
        
        console.log('予約送信処理が正常に完了しました');
        displayCompletionDetails(mainReservation);
        goToCompletionPage();
        
    } catch (error) {
        console.error('予約の送信に失敗しました:', error);
        
        // エラーが発生した場合は送信状態をリセット
        resetSubmissionState();
        
        // エラーメッセージの詳細化
        let errorMessage = '予約の送信に失敗しました。';
        if (error.message && error.message.includes('予約は') && error.message.includes('日後')) {
            errorMessage = error.message;
        } else {
            errorMessage += 'もう一度お試しください。';
        }
        
        alert(errorMessage);
    }
}

// フォームデータのリセット
function resetFormData() {
    console.log('フォームデータをリセット');
    selectedGuestCount = null;
    selectedSeat = null;
    selectedDate = null;
    selectedTime = null;
    
    const forms = document.querySelectorAll('input, select');
    forms.forEach(form => {
        if (form.type !== 'button' && form.type !== 'submit') {
            form.value = '';
        }
    });
    
    // 各ページの次へボタンを非表示に
    const nextButtons = document.querySelectorAll('.next-button');
    nextButtons.forEach(button => {
        button.classList.remove('show');
    });
}

// エラーハンドリング
window.addEventListener('error', function(event) {
    console.error('JavaScript エラーが発生しました:', event.error);
    if (isSubmittingReservation) {
        resetSubmissionState();
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('未処理のPromise拒否:', event.reason);
    if (isSubmittingReservation) {
        resetSubmissionState();
    }
});

// ページ離脱時の警告（予約送信中の場合）
window.addEventListener('beforeunload', function(event) {
    if (isSubmittingReservation) {
        const message = '予約処理中です。ページを離れると予約が正常に完了しない可能性があります。';
        event.returnValue = message;
        return message;
    }
});

// ブラウザの戻る/進むボタンでの移動時の処理
window.addEventListener('popstate', function(event) {
    if (isSubmittingReservation) {
        const shouldContinue = confirm('予約処理中です。本当にページを離れますか？');
        if (!shouldContinue) {
            history.pushState(null, null, location.href);
            return false;
        } else {
            resetSubmissionState();
        }
    }
});

// デバッグ用: 現在の状態をコンソールに出力
function debugCurrentState() {
    console.log('=== 現在の予約状態 ===');
    console.log('currentPage:', currentPage);
    console.log('selectedGuestCount:', selectedGuestCount);
    console.log('selectedDate:', selectedDate);
    console.log('selectedTime:', selectedTime);
    console.log('selectedSeat:', selectedSeat);
    console.log('isSubmittingReservation:', isSubmittingReservation);
    console.log('======================');
}

// グローバルからアクセス可能にする（デバッグ用）
window.debugCurrentState = debugCurrentState;
