// カレンダー機能
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.holidays = {};
        this.init();
    }

    async init() {
        try {
            this.holidays = await api.getHolidays();
        } catch (error) {
            console.warn('祝日データの読み込みに失敗しました');
        }
        this.render();
        this.attachEvents();
    }

    attachEvents() {
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');

        prevBtn?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        nextBtn?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
    }

    render() {
        this.renderTitle();
        this.renderDays();
    }

    renderTitle() {
        const titleEl = document.getElementById('calendar-title');
        if (titleEl) {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            titleEl.textContent = `${year}年${MONTH_NAMES[month]}`;
        }
    }

    renderDays() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // 曜日ヘッダーを追加
        DAY_NAMES.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        // 月の最初の日と最後の日を取得
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 最初の週の空白を埋める
        const startDayOfWeek = firstDay.getDay();
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            grid.appendChild(emptyDay);
        }

        // 日付を追加
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;

            const dateStr = utils.formatDate(new Date(year, month, day));
            dayEl.dataset.date = dateStr;

            // 今日の日付をマーク
            const today = utils.formatDate(new Date());
            if (dateStr === today) {
                dayEl.classList.add('today');
            }

            // 過去の日付を無効化
            if (utils.isPastDate(dateStr)) {
                dayEl.classList.add('past');
            }

            // 予約不可日を無効化
            if (!utils.isBookableDate(dateStr)) {
                dayEl.classList.add('disabled');
            }

            // 祝日をマーク
            if (this.holidays[dateStr]) {
                dayEl.classList.add('holiday');
            }

            // クリックイベント
            if (!dayEl.classList.contains('disabled') && !dayEl.classList.contains('past')) {
                dayEl.addEventListener('click', () => this.selectDate(dateStr, dayEl));
            }

            grid.appendChild(dayEl);
        }
    }

    selectDate(dateStr, dayEl) {
        // 既存の選択を解除
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // 新しい選択を設定
        dayEl.classList.add('selected');
        this.selectedDate = dateStr;
        state.reservation.date = dateStr;

        // 次へボタンを有効化
        const nextBtn = document.getElementById('date-next');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.onclick = () => goToStep(3);
        }
    }

    getSelectedDate() {
        return this.selectedDate;
    }
}

// グローバルカレンダーインスタンス
let calendar;
