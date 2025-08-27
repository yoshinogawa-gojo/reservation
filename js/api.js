// API通信処理
const api = {
    // 基本的なリクエスト処理
    request: async (endpoint, options = {}) => {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },

    // 祝日データを取得
    getHolidays: async () => {
        try {
            const response = await fetch(CONFIG.HOLIDAY_API);
            const holidays = await response.json();
            return holidays;
        } catch (error) {
            console.warn('祝日データの取得に失敗しました:', error);
            return {};
        }
    },

    // 予約可能な時間スロットを取得
    getAvailableSlots: async (date, guestCount) => {
        return await api.request(`/slots?date=${date}&guestCount=${guestCount}`);
    },

    // 席の空き状況を取得
    getSeatAvailability: async (date, time, guestCount) => {
        return await api.request(`/seats?date=${date}&time=${time}&guestCount=${guestCount}`);
    },

    // 予約を作成
    createReservation: async (reservationData) => {
        return await api.request('/reservations', {
            method: 'POST',
            body: JSON.stringify(reservationData)
        });
    },

    // 予約を確認
    getReservation: async (reservationNumber, phoneNumber) => {
        return await api.request(`/reservations/${reservationNumber}?phone=${encodeURIComponent(phoneNumber)}`);
    },

    // 席タイプ設定を取得
    getSeatTypes: async () => {
        return await api.request('/seat-types');
    },

    // 営業時間設定を取得
    getBusinessHours: async () => {
        return await api.request('/business-hours');
    }
};
