// 予約処理メイン
document.addEventListener('DOMContentLoaded', async () => {
    initializeReservationSystem();
});

// 予約システム初期化
async function initializeReservationSystem() {
    try {
        showLoading(true);
        
        // カレンダーを初期化
        calendar = new Calendar();
        
        // 人数選択の初期化
        initGuestCountSelector();
        
        // 各ステップの初期化
        initStepNavigation();
        
        showLoading(false);
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('システムの初期化に失敗しました。ページを再読み込みしてください。');
        showLoading(false);
    }
}

// 人数選択の初期化
function initGuestCountSelector() {
    const minusBtn = document.querySelector('.count-btn.minus');
    const plusBtn = document.querySelector('.count-btn.plus');
    const countDisplay = document.querySelector('.count-display');
    const nextBtn = document.getElementById('guest-count-next');

    // 初期状態設定
    updateGuestCount(state.reservation.guestCount);

    minusBtn?.addEventListener('click', () => {
        if (state.reservation.guestCount > CONFIG.MIN_GUESTS) {
            updateGuestCount(state.reservation.guestCount - 1);
        }
    });

    plusBtn?.addEventListener('click', () => {
        if (state.reservation.guestCount < CONFIG.MAX_GUESTS) {
            updateGuestCount(state.reservation.guestCount + 1);
        }
    });

    nextBtn?.addEventListener('click', () => {
        if (state.reservation.guestCount >= CONFIG.MIN_GUESTS) {
            goToStep(2);
        }
    });
}

// 人数更新
function updateGuestCount(count) {
    state.reservation.guestCount = count;
    
    const countDisplay = document.querySelector('.count-display');
    const minusBtn = document.querySelector('.count-btn.minus');
    const plusBtn = document.querySelector('.count-btn.plus');
    const nextBtn = document.getElementById('guest-count-next');

    if (countDisplay) countDisplay.textContent = count;
    if (minusBtn) minusBtn.disabled = count <= CONFIG.MIN_GUESTS;
    if (plusBtn) plusBtn.disabled = count >= CONFIG.MAX_GUESTS;
    if (nextBtn) nextBtn.disabled = false;
}

// ステップナビゲーション初期化
function initStepNavigation() {
    // フォームの送信処理
    const form = document.getElementById('customer-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// ステップ移動
function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 5) return;

    // 現在のステップを非活性化
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    // 新しいステップを活性化
    const newStepContent = document.getElementById(`step-${stepNumber}`);
    const newStepIndicator = document.querySelector(`.step[data-step="${stepNumber}"]`);

    if (newStepContent) newStepContent.classList.add('active');
    if (newStepIndicator) newStepIndicator.classList.add('active');

    // ステップに応じた処理
    switch (stepNumber) {
        case 3:
            loadTimeSlots();
            break;
        case 4:
            loadSeatOptions();
            updateReservationSummary();
            break;
        case 5:
            updateFinalSummary();
            break;
    }

    state.currentStep = stepNumber;

    // 過去のステップを完了済みにマーク
    for (let i = 1; i < stepNumber; i++) {
        const stepEl = document.querySelector(`.step[data-step="${i}"]`);
        if (stepEl) stepEl.classList.add('completed');
    }
}

// 時間スロット読み込み
async function loadTimeSlots() {
    try {
        showLoading(true);
        
        const dateDisplay = document.getElementById('selected-date-display');
        if (dateDisplay && state.reservation.date) {
            dateDisplay.textContent = utils.formatDateDisplay(state.reservation.date);
        }

        const slotsData = await api.getAvailableSlots(
            state.reservation.date, 
            state.reservation.guestCount
        );

        renderTimeSlots(slotsData);
        showLoading(false);
    } catch (error) {
        console.error('時間スロット読み込みエラー:', error);
        showError('時間スロットの読み込みに失敗しました。');
        showLoading(false);
    }
}

// 時間スロット表示
function renderTimeSlots(slotsData) {
    const container = document.getElementById('time-slots');
    if (!container) return;

    container.innerHTML = '';

    if (!slotsData || !slotsData.slots || slotsData.slots.length === 0) {
        container.innerHTML = '<div class="no-availability">この日は予約できる時間がありません。</div>';
        return;
    }

    // 時間帯ごとに分類
    const lunchSlots = slotsData.slots.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= 11 && hour <= 14;
    });

    const dinnerSlots = slotsData.slots.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= 17;
    });

    // ランチタイム
    if (lunchSlots.length > 0) {
        const lunchSection = document.createElement('div');
        lunchSection.className = 'time-section';
        lunchSection.innerHTML = '<div class="time-section-title">ランチタイム</div>';
        
        const lunchSlotsContainer = document.createElement('div');
        lunchSlotsContainer.className = 'time-slots';
        
        lunchSlots.forEach(slot => {
            const slotEl = createTimeSlotElement(slot);
            lunchSlotsContainer.appendChild(slotEl);
        });
        
        lunchSection.appendChild(lunchSlotsContainer);
        container.appendChild(lunchSection);
    }

    // ディナータイム
    if (dinnerSlots.length > 0) {
        const dinnerSection = document.createElement('div');
        dinnerSection.className = 'time-section';
        dinnerSection.innerHTML = '<div class="time-section-title">ディナータイム</div>';
        
        const dinnerSlotsContainer = document.createElement('div');
        dinnerSlotsContainer.className = 'time-slots';
        
        dinnerSlots.forEach(slot => {
            const slotEl = createTimeSlotElement(slot);
            dinnerSlotsContainer.appendChild(slotEl);
        });
        
        dinnerSection.appendChild(dinnerSlotsContainer);
        container.appendChild(dinnerSection);
    }
}

// 時間スロット要素作成
function createTimeSlotElement(slot) {
    const slotEl = document.createElement('div');
    slotEl.className = 'time-slot';
    slotEl.textContent = slot.time;
    slotEl.dataset.time = slot.time;

    if (slot.available) {
        slotEl.addEventListener('click', () => selectTimeSlot(slot.time, slotEl));
    } else {
        slotEl.classList.add('disabled');
    }

    return slotEl;
}

// 時間スロット選択
function selectTimeSlot(time, slotEl) {
    // 既存の選択を解除
    document.querySelectorAll('.time-slot.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // 新しい選択を設定
    slotEl.classList.add('selected');
    state.reservation.time = time;

    // 次へボタンを有効化
    const nextBtn = document.getElementById('time-next');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.onclick = () => goToStep(4);
    }
}

// 席オプション読み込み
async function loadSeatOptions() {
    try {
        showLoading(true);
        
        const seatTypes = await api.getSeatTypes();
        const availability = await api.getSeatAvailability(
            state.reservation.date,
            state.reservation.time,
            state.reservation.guestCount
        );

        renderSeatOptions(seatTypes, availability);
        showLoading(false);
    } catch (error) {
        console.error('席オプション読み込みエラー:', error);
        showError('席情報の読み込みに失敗しました。');
        showLoading(false);
    }
}

// 席オプション表示
function renderSeatOptions(seatTypes, availability) {
    const container = document.getElementById('seat-options');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(seatTypes).forEach(([key, seatType]) => {
        const seatEl = document.createElement('div');
        seatEl.className = 'seat-option';
        seatEl.dataset.seatType = key;

        const isAvailable = availability[key] && availability[key].available;
        const availableCount = availability[key] ? availability[key].availableCount : 0;

        if (!isAvailable) {
            seatEl.classList.add('disabled');
        }

        seatEl.innerHTML = `
            <div class="seat-type-name">${seatType.name}</div>
            <div class="seat-description">${seatType.description}</div>
            <div class="seat-capacity">
                ${seatType.minCapacity}〜${seatType.maxCapacity}名様
            </div>
            <div class="seat-availability ${getAvailabilityClass(availableCount)}">
                ${getAvailabilityText(availableCount, isAvailable)}
            </div>
        `;

        if (isAvailable) {
            seatEl.addEventListener('click', () => selectSeatOption(key, seatEl));
        }

        container.appendChild(seatEl);
    });
}

// 可用性クラス取得
function getAvailabilityClass(count) {
    if (count === 0) return 'full';
    if (count <= 2) return 'limited';
    return 'available';
}

// 可用性テキスト取得
function getAvailabilityText(count, isAvailable) {
    if (!isAvailable || count === 0) return '満席';
    if (count <= 2) return `残り${count}席`;
    return '空席あり';
}

// 席オプション選択
function selectSeatOption(seatType, seatEl) {
    // 既存の選択を解除
    document.querySelectorAll('.seat-option.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // 新しい選択を設定
    seatEl.classList.add('selected');
    state.reservation.seatType = seatType;

    // 次へボタンを有効化
    const nextBtn = document.getElementById('seat-next');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.onclick = () => goToStep(5);
    }

    updateReservationSummary();
}

// 予約サマリー更新
function updateReservationSummary() {
    const container = document.getElementById('reservation-summary');
    if (!container) return;

    container.innerHTML = `
        <div class="summary-title">予約内容</div>
        <div class="summary-item">
            <span class="summary-label">日付</span>
            <span class="summary-value">${utils.formatDateDisplay(state.reservation.date)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">時間</span>
            <span class="summary-value">${state.reservation.time}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">人数</span>
            <span class="summary-value">${state.reservation.guestCount}名様</span>
        </div>
    `;
}

// 最終サマリー更新
async function updateFinalSummary() {
    const container = document.getElementById('final-summary');
    if (!container) return;

    try {
        const seatTypes = await api.getSeatTypes();
        const selectedSeatType = seatTypes[state.reservation.seatType];

        container.innerHTML = `
            <div class="summary-title">予約確認</div>
            <div class="summary-item">
                <span class="summary-label">日付</span>
                <span class="summary-value">${utils.formatDateDisplay(state.reservation.date)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">時間</span>
                <span class="summary-value">${state.reservation.time}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">人数</span>
                <span class="summary-value">${state.reservation.guestCount}名様</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">席タイプ</span>
                <span class="summary-value">${selectedSeatType ? selectedSeatType.name : ''}</span>
            </div>
        `;
    } catch (error) {
        console.error('最終サマリー更新エラー:', error);
    }
}

// フォーム送信処理
async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        showLoading(true);

        // フォームデータを取得
        const formData = new FormData(event.target);
        const customerName = formData.get('customerName').trim();
        const phoneNumber = formData.get('phoneNumber').trim();
        const email = formData.get('email').trim();
        const notes = formData.get('notes').trim();

        // バリデーション
        if (!customerName || !phoneNumber || !email) {
            throw new Error('必須項目を入力してください。');
        }

        if (!utils.validateEmail(email)) {
            throw new Error('正しいメールアドレスを入力してください。');
        }

        if (!utils.validatePhone(phoneNumber)) {
            throw new Error('正しい電話番号を入力してください。');
        }

        // 予約データを作成
        const reservationData = {
            ...state.reservation,
            customerName,
            phoneNumber,
            email,
            notes,
            reservationNumber: utils.generateReservationNumber()
        };

        // 予約を作成
        const result = await api.createReservation(reservationData);
        
        // 完了画面を表示
        showReservationComplete(result);
        showLoading(false);

    } catch (error) {
        console.error('予約作成エラー:', error);
        showError(error.message || '予約の作成に失敗しました。');
        showLoading(false);
    }
}

// 予約完了画面表示
function showReservationComplete(result) {
    // 完了画面のデータを設定
    const confirmationNumber = document.getElementById('confirmation-number');
    const completionDetails = document.getElementById('completion-details');

    if (confirmationNumber) {
        confirmationNumber.textContent = result.reservationNumber;
    }

    if (completionDetails) {
        completionDetails.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">日付</span>
                <span class="summary-value">${utils.formatDateDisplay(result.date)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">時間</span>
                <span class="summary-value">${result.time}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">人数</span>
                <span class="summary-value">${result.guestCount}名様</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">お名前</span>
                <span class="summary-value">${result.customerName}様</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">電話番号</span>
                <span class="summary-value">${result.phoneNumber}</span>
            </div>
        `;
    }

    // ステップを非表示にして完了画面を表示
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });

    const completionEl = document.getElementById('completion');
    if (completionEl) {
        completionEl.classList.add('active');
    }

    // ステップインジケーターを非表示
    const stepIndicator = document.querySelector('.step-indicator');
    if (stepIndicator) {
        stepIndicator.style.display = 'none';
    }
}
