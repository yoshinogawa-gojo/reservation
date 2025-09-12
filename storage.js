// Hair Works天 予約サイト - 顧客情報保存機能

// 顧客情報のキー名
const STORAGE_KEY = 'hairworks_customer_info';

// 保存期間の設定（日数）
const STORAGE_RETENTION_DAYS = 365; // 1年間保存に変更

// 顧客情報の保存
function saveCustomerInfo() {
    try {
        const customerInfo = {
            lastName: document.getElementById('last-name').value.trim(),
            phoneNumber: document.getElementById('first-name').value.trim(),
            email: document.getElementById('email').value.trim(),
            savedAt: new Date().toISOString()
        };
        
        // 空の情報は保存しない
        if (!customerInfo.lastName || !customerInfo.phoneNumber || !customerInfo.email) {
            return false;
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customerInfo));
        console.log('顧客情報を保存しました:', customerInfo);
        return true;
    } catch (error) {
        console.error('顧客情報の保存に失敗しました:', error);
        return false;
    }
}

// 顧客情報の読み込み
function loadCustomerInfo() {
    try {
        const savedInfo = localStorage.getItem(STORAGE_KEY);
        if (!savedInfo) {
            return null;
        }
        
        const customerInfo = JSON.parse(savedInfo);
        
        // 保存期間のチェック（設定された日数間）
        const savedDate = new Date(customerInfo.savedAt);
        const now = new Date();
        const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > STORAGE_RETENTION_DAYS) {
            console.log(`保存期間（${STORAGE_RETENTION_DAYS}日間）が過ぎているため、顧客情報を削除します`);
            clearCustomerInfo();
            return null;
        }
        
        console.log('保存された顧客情報を読み込みました:', customerInfo);
        return customerInfo;
    } catch (error) {
        console.error('顧客情報の読み込みに失敗しました:', error);
        return null;
    }
}

// 顧客情報の削除
function clearCustomerInfo() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('顧客情報を削除しました');
        return true;
    } catch (error) {
        console.error('顧客情報の削除に失敗しました:', error);
        return false;
    }
}

// フォームに顧客情報を自動入力
function autoFillCustomerInfo() {
    const savedInfo = loadCustomerInfo();
    if (!savedInfo) {
        return false;
    }
    
    const lastNameField = document.getElementById('last-name');
    const phoneField = document.getElementById('first-name');
    const emailField = document.getElementById('email');
    
    if (lastNameField && phoneField && emailField) {
        lastNameField.value = savedInfo.lastName;
        phoneField.value = savedInfo.phoneNumber;
        emailField.value = savedInfo.email;
        
        // 自動入力されたことをユーザーに通知
        showAutoFillNotification();
        return true;
    }
    
    return false;
}

// 自動入力通知の表示
function showAutoFillNotification() {
    // 既存の通知があれば削除
    const existingNotification = document.querySelector('.autofill-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'autofill-notification';
    notification.innerHTML = `
        <div class="autofill-content">
            <span class="autofill-icon">💾</span>
            <span class="autofill-text">前回入力された情報を自動入力しました</span>
            <button class="autofill-clear-btn" onclick="clearSavedInfo()">削除</button>
        </div>
    `;
    
    // フォームコンテナの上に挿入
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.insertBefore(notification, formContainer.firstChild);
        
        // 5秒後に自動で非表示
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

// 保存された情報の削除（ユーザー操作）
function clearSavedInfo() {
    if (confirm('保存された顧客情報を削除してもよろしいですか？')) {
        clearCustomerInfo();
        
        // フォームをクリア
        document.getElementById('last-name').value = '';
        document.getElementById('first-name').value = '';
        document.getElementById('email').value = '';
        
        // 通知を削除
        const notification = document.querySelector('.autofill-notification');
        if (notification) {
            notification.remove();
        }
        
        alert('保存された情報を削除しました。');
    }
}

// 情報入力ページの初期化時に自動入力
function initCustomerInfoAutoFill() {
    // ページが情報入力ページの場合のみ実行
    if (currentPage === 'info-page') {
        setTimeout(() => {
            autoFillCustomerInfo();
        }, 100); // 少し遅延させてDOM更新を待つ
    }
}

// 予約完了時に顧客情報を保存（オプション機能）
function showSaveInfoOption() {
    const saveOption = document.createElement('div');
    saveOption.className = 'save-info-option';
    saveOption.innerHTML = `
        <div class="save-info-content">
            <label class="save-info-checkbox">
                <input type="checkbox" id="save-info-checkbox" checked>
                <span class="save-checkmark"></span>
                次回入力を省略するため、お客様情報を保存する（1年間）
            </label>
            <div class="save-info-note">
                ※ 情報はお使いのブラウザにのみ保存され、外部に送信されることはありません
            </div>
        </div>
    `;
    
    // 確認ページの重要なお願いセクションの前に挿入
    const agreementSection = document.querySelector('.important-agreement');
    if (agreementSection) {
        agreementSection.parentNode.insertBefore(saveOption, agreementSection);
    }
}

// 予約送信時に保存オプションをチェック
function handleCustomerInfoSave() {
    const saveCheckbox = document.getElementById('save-info-checkbox');
    if (saveCheckbox && saveCheckbox.checked) {
        const saved = saveCustomerInfo();
        if (saved) {
            console.log('顧客情報が正常に保存されました');
        }
    }
}

// プライバシー保護のための情報表示
function showPrivacyInfo() {
    return `
        <div class="privacy-info">
            <h4>🔒 プライバシー保護について</h4>
            <ul>
                <li>お客様の情報は、お使いのブラウザ内にのみ保存されます</li>
                <li>情報が外部のサーバーに送信されることはありません</li>
                <li>保存期間は1年間で、その後自動的に削除されます</li>
                <li>いつでも手動で削除することができます</li>
            </ul>
        </div>
    `;
}

// 保存期間の取得（外部から参照可能）
function getStorageRetentionDays() {
    return STORAGE_RETENTION_DAYS;
}

// 保存された情報の有効期限を取得
function getStorageExpiryDate() {
    const savedInfo = localStorage.getItem(STORAGE_KEY);
    if (!savedInfo) {
        return null;
    }
    
    try {
        const customerInfo = JSON.parse(savedInfo);
        const savedDate = new Date(customerInfo.savedAt);
        const expiryDate = new Date(savedDate.getTime() + (STORAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000));
        return expiryDate;
    } catch (error) {
        console.error('保存情報の解析に失敗しました:', error);
        return null;
    }
}

// 保存された情報の残り日数を取得
function getRemainingDays() {
    const expiryDate = getStorageExpiryDate();
    if (!expiryDate) {
        return null;
    }
    
    const now = new Date();
    const remainingMs = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, remainingDays);
}

// ブラウザサポートチェック
function isLocalStorageSupported() {
    try {
        const test = 'localStorage_test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.warn('LocalStorageがサポートされていません:', error);
        return false;
    }
}
