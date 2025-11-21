// system/error.kernel.los.js
class ErrorKernel {
    constructor() {
        this.isInitialized = false;
        this.currentError = null;
        this.timers = new Map();
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.createErrorOverlay();
        this.setupEventListeners();
        this.isInitialized = true;
        
        console.log("🚨 ErrorKernel инициализирован");
    }

    createErrorOverlay() {
        // Удаляем существующий overlay если есть
        const existingOverlay = document.getElementById('error-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlayHTML = `
            <div class="error-overlay" id="error-overlay" style="display: none;">
                <div class="error-dialog" id="error-dialog">
                    <div class="error-icon" id="error-icon">⚠️</div>
                    <div class="error-title" id="error-title">Ошибка</div>
                    <div class="error-message" id="error-message">Произошла ошибка</div>
                    <div class="error-buttons" id="error-buttons">
                        <button class="error-btn error-btn-ok" id="error-btn-ok">ОК</button>
                    </div>
                    <div class="error-progress" id="error-progress" style="display: none;">
                        <div class="error-progress-bar" id="error-progress-bar"></div>
                    </div>
                    <div class="error-technical" id="error-technical" style="display: none;"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);

        // Сохраняем ссылки на элементы
        this.overlay = document.getElementById('error-overlay');
        this.dialog = document.getElementById('error-dialog');
        this.icon = document.getElementById('error-icon');
        this.title = document.getElementById('error-title');
        this.message = document.getElementById('error-message');
        this.buttons = document.getElementById('error-buttons');
        this.progress = document.getElementById('error-progress');
        this.progressBar = document.getElementById('error-progress-bar');
        this.technical = document.getElementById('error-technical');
    }

    setupEventListeners() {
        // Обработчик для клика вне диалога
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Обработчик Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.style.display === 'flex') {
                this.hide();
            }
        });
    }

    showAppTimeout(iframe, appName, appUrl) {
        this.currentError = {
            type: 'app-timeout',
            iframe: iframe,
            appName: appName,
            appUrl: appUrl,
            stage: 'first'
        };

        this.title.textContent = 'Приложение не отвечает';
        this.message.textContent = `Приложение "${this.formatAppName(appName)}" долго загружается.`;
        this.icon.textContent = '⏳';

        this.buttons.innerHTML = `
            <button class="error-btn error-btn-ok" id="error-btn-cancel">ОК</button>
            <button class="error-btn error-btn-wait" id="error-btn-wait">Подождать</button>
        `;

        this.updateButtonHandlers();
        this.hideProgress();
        this.hideTechnical();

        this.show();

        // Автоматический переход на второй этап через 10 секунд
        this.setTimer('auto-final', () => {
            if (this.currentError && this.currentError.stage === 'first') {
                this.showFinalTimeout(iframe, appName);
            }
        }, 10000);
    }

    showFinalTimeout(iframe, appName) {
        this.currentError = {
            type: 'app-timeout',
            iframe: iframe,
            appName: appName,
            stage: 'final'
        };

        this.title.textContent = 'Приложение не отвечает';
        this.message.textContent = `Приложение "${this.formatAppName(appName)}" недоступно.`;
        this.icon.textContent = '❌';

        this.buttons.innerHTML = `
            <button class="error-btn error-btn-ok" id="error-btn-ok">ОК</button>
        `;

        this.updateButtonHandlers();
        this.hideProgress();
        this.show();

        this.clearTimer('auto-final');
    }

    showNetworkError(iframe, appName, appUrl) {
        this.currentError = {
            type: 'network-error',
            iframe: iframe,
            appName: appName,
            appUrl: appUrl
        };

        this.title.textContent = 'Ошибка сети';
        this.message.textContent = `Не удалось загрузить приложение "${this.formatAppName(appName)}".`;
        this.icon.textContent = '📡';

        this.buttons.innerHTML = `
            <button class="error-btn error-btn-ok" id="error-btn-ok">ОК</button>
            <button class="error-btn error-btn-retry" id="error-btn-retry">Повторить</button>
        `;

        this.updateButtonHandlers();
        this.hideProgress();
        this.show();
    }

    showGenericError(title, message, options = {}) {
        this.currentError = {
            type: 'generic',
            title: title,
            message: message,
            options: options
        };

        this.title.textContent = title;
        this.message.textContent = message;
        this.icon.textContent = options.icon || '⚠️';

        let buttonsHTML = '';
        if (options.buttons) {
            options.buttons.forEach(btn => {
                buttonsHTML += `<button class="error-btn error-btn-${btn.type}" id="error-btn-${btn.id}">${btn.text}</button>`;
            });
        } else {
            buttonsHTML = '<button class="error-btn error-btn-ok" id="error-btn-ok">ОК</button>';
        }

        this.buttons.innerHTML = buttonsHTML;
        this.updateButtonHandlers();
        this.hideProgress();
        this.show();
    }

    startWaiting(duration = 30000) {
        this.showProgress();
        this.progressBar.style.width = '100%';

        this.message.textContent = 'Ожидание загрузки...';

        const waitBtn = document.getElementById('error-btn-wait');
        if (waitBtn) {
            waitBtn.disabled = true;
            waitBtn.textContent = 'Ожидание...';
        }

        let timeLeft = duration;
        const updateProgress = () => {
            timeLeft -= 100;
            const progressPercent = (timeLeft / duration) * 100;
            this.progressBar.style.width = `${progressPercent}%`;

            if (timeLeft <= 0) {
                this.clearTimer('progress');
                if (this.currentError && this.currentError.iframe) {
                    this.showFinalTimeout(this.currentError.iframe, this.currentError.appName);
                }
            }
        };

        this.setTimer('progress', updateProgress, 100, true);
        this.setTimer('timeout', () => {
            if (this.currentError && this.currentError.iframe) {
                this.showFinalTimeout(this.currentError.iframe, this.currentError.appName);
            }
        }, duration);
    }

    updateButtonHandlers() {
        // Удаляем старые обработчики
        this.buttons.querySelectorAll('button').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        // Добавляем новые обработчики
        const okBtn = document.getElementById('error-btn-ok');
        const cancelBtn = document.getElementById('error-btn-cancel');
        const waitBtn = document.getElementById('error-btn-wait');
        const retryBtn = document.getElementById('error-btn-retry');

        if (okBtn) {
            okBtn.addEventListener('click', () => this.handleOk());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        if (waitBtn) {
            waitBtn.addEventListener('click', () => this.handleWait());
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.handleRetry());
        }

        // Обработчики для кастомных кнопок
        this.buttons.querySelectorAll('[id^="error-btn-"]').forEach(btn => {
            const btnId = btn.id.replace('error-btn-', '');
            if (!['ok', 'cancel', 'wait', 'retry'].includes(btnId)) {
                btn.addEventListener('click', () => this.handleCustomButton(btnId));
            }
        });
    }

    handleOk() {
        this.cleanupCurrentError();
        this.hide();
    }

    handleCancel() {
        this.cleanupCurrentError();
        this.hide();
    }

    handleWait() {
        this.startWaiting();
    }

    handleRetry() {
        if (this.currentError && this.currentError.iframe && this.currentError.appUrl) {
            const iframe = this.currentError.iframe;
            const appUrl = this.currentError.appUrl;
            
            // Перезагружаем iframe
            iframe.src = appUrl;
            this.hide();
        } else {
            this.hide();
        }
    }

    handleCustomButton(buttonId) {
        if (this.currentError && this.currentError.options && this.currentError.options.onButtonClick) {
            this.currentError.options.onButtonClick(buttonId);
        }
        this.hide();
    }

    cleanupCurrentError() {
        if (this.currentError && this.currentError.iframe && this.currentError.type !== 'network-error') {
            this.currentError.iframe.remove();
        }
        this.currentError = null;
        this.clearAllTimers();
    }

    show() {
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 10);
    }

    hide() {
        this.overlay.classList.remove('active');
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.cleanupCurrentError();
            
            // Всегда показываем рабочий стол после скрытия ошибки
            if (window.appKernel) {
                window.appKernel.hideAppContainer();
            }
        }, 300);
    }

    showProgress() {
        this.progress.style.display = 'block';
    }

    hideProgress() {
        this.progress.style.display = 'none';
        this.clearTimer('progress');
    }

    showTechnical(info) {
        this.technical.textContent = info;
        this.technical.style.display = 'block';
    }

    hideTechnical() {
        this.technical.style.display = 'none';
    }

    setTimer(name, callback, delay, interval = false) {
        this.clearTimer(name);
        
        if (interval) {
            this.timers.set(name, setInterval(callback, delay));
        } else {
            this.timers.set(name, setTimeout(callback, delay));
        }
    }

    clearTimer(name) {
        if (this.timers.has(name)) {
            const timer = this.timers.get(name);
            if (timer) {
                if (name.includes('progress') || name.includes('interval')) {
                    clearInterval(timer);
                } else {
                    clearTimeout(timer);
                }
            }
            this.timers.delete(name);
        }
    }

    clearAllTimers() {
        this.timers.forEach((timer, name) => {
            if (timer) {
                if (name.includes('progress') || name.includes('interval')) {
                    clearInterval(timer);
                } else {
                    clearTimeout(timer);
                }
            }
        });
        this.timers.clear();
    }

    formatAppName(appName) {
        const names = {
            'camera': 'Камера',
            'gallery': 'Галерея',
            'calcul': 'Калькулятор',
            'notes': 'Заметки',
            'security': 'Безопасность',
            'browser': 'Браузер'
        };
        return names[appName] || appName;
    }

    // Проверка если iframe загрузился во время ожидания
    checkIframeLoaded(iframe) {
        if (iframe.contentWindow && this.overlay.style.display === 'flex' && 
            this.currentError && this.currentError.iframe === iframe) {
            this.hide();
        }
    }

    // Универсальный метод для показа ошибок
    showError(config) {
        if (!this.isInitialized) {
            this.init();
        }

        const {
            type = 'generic',
            title = 'Ошибка',
            message = 'Произошла ошибка',
            icon = '⚠️',
            buttons = [{ id: 'ok', text: 'ОК', type: 'ok' }],
            iframe = null,
            appName = null,
            appUrl = null,
            onButtonClick = null,
            technical = null
        } = config;

        this.currentError = {
            type,
            title,
            message,
            iframe,
            appName,
            appUrl,
            options: { buttons, onButtonClick }
        };

        this.title.textContent = title;
        this.message.textContent = message;
        this.icon.textContent = icon;

        let buttonsHTML = '';
        buttons.forEach(btn => {
            buttonsHTML += `<button class="error-btn error-btn-${btn.type}" id="error-btn-${btn.id}">${btn.text}</button>`;
        });

        this.buttons.innerHTML = buttonsHTML;
        this.updateButtonHandlers();

        if (technical) {
            this.showTechnical(technical);
        } else {
            this.hideTechnical();
        }

        this.hideProgress();
        this.show();
    }
}

// Создаем глобальный экземпляр
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            window.errorKernel = new ErrorKernel();
            console.log("🚨 ErrorKernel готов к работе");
        } catch (error) {
            console.error('❌ Ошибка инициализации ErrorKernel:', error);
        }
    }, 100);
});