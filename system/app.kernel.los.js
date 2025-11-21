class AppKernel {
    constructor() {
        this.currentApp = null;
        this.appContainer = document.getElementById('app-container');
        this.desktop = document.getElementById('desktop');
        this.appIcons = [];
        this.loadTimeouts = new Map();
        this.backgroundTimeouts = new Map();
        this.init();
    }

    init() {
        console.log('🚀 Инициализация AppKernel');
        this.discoverApps();
        this.setupMessageHandler();
        this.startBackgroundCleanup();
        this.initGalleryWidget();
    }

    discoverApps() {
        this.appIcons = Array.from(this.desktop.querySelectorAll('.app-icon'));
        
        console.log(`📱 Обнаружено приложений: ${this.appIcons.length}`);
        
        this.appIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const appName = icon.dataset.app;
                this.launchApp(appName);
            });
        });
    }

    setupMessageHandler() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'app-close') {
                this.closeApp();
            }
        });
    }

    launchApp(appName) {
        console.log(`📱 Запуск приложения: ${appName}`);
        
        if (this.currentApp) {
            if (window.navigationKernel) {
                window.navigationKernel.addToRecentApps(this.currentApp);
            }
            this.closeApp();
        }

        const backgroundIframe = document.querySelector(`iframe[data-app-name="${appName}"]`);
        if (backgroundIframe) {
            this.restoreFromBackground(backgroundIframe);
        } else {
            const appUrl = this.getAppUrl(appName);
            this.loadApp(appUrl, appName);
        }
    }

    getAppUrl(appName) {
        return `app/com.${appName}.los.html`;
    }

    loadApp(appUrl, appName) {
        const iframe = document.createElement('iframe');
        iframe.className = 'app-frame';
        iframe.src = appUrl;
        iframe.dataset.appName = appName;

        const loadTimeout = setTimeout(() => {
            this.showAppTimeoutError(iframe, appName);
        }, 5000);

        this.loadTimeouts.set(appName, loadTimeout);

        iframe.onload = () => {
            console.log(`✅ Приложение "${appName}" загружено`);
            this.clearLoadTimeout(appName);
            this.currentApp = iframe;
            this.showAppContainer();
        };

        iframe.onerror = () => {
            console.error(`❌ Ошибка загрузки приложения: ${appUrl}`);
            this.clearLoadTimeout(appName);
            this.showAppError(appName);
            iframe.remove();
        };

        this.appContainer.innerHTML = '';
        this.appContainer.appendChild(iframe);
    }

    showAppTimeoutError(iframe, appName) {
        console.log(`⏰ Таймаут загрузки приложения: ${appName}`);
        
        this.createErrorOverlay(
            'Приложение не отвечает',
            `Приложение "${this.formatAppName(appName)}" долго загружается.`,
            [
                { text: 'ОК', action: () => this.handleErrorClose(iframe) },
                { text: 'Подождать', action: () => this.handleErrorWait(iframe, appName) }
            ]
        );
    }

    showAppError(appName) {
        console.log(`❌ Ошибка загрузки приложения: ${appName}`);
        
        this.createErrorOverlay(
            'Ошибка загрузки',
            `Не удалось загрузить приложение "${this.formatAppName(appName)}".`,
            [
                { text: 'ОК', action: () => this.hideErrorOverlay() }
            ]
        );
    }

    createErrorOverlay(title, message, buttons) {
        this.removeErrorOverlay();

        const overlay = document.createElement('div');
        overlay.className = 'error-overlay';
        overlay.id = 'app-error-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'error-dialog';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'error-title';
        titleEl.textContent = title;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'error-message';
        messageEl.textContent = message;
        
        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'error-buttons';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'error-btn';
            button.textContent = btn.text;
            button.addEventListener('click', btn.action);
            buttonsEl.appendChild(button);
        });
        
        dialog.appendChild(titleEl);
        dialog.appendChild(messageEl);
        dialog.appendChild(buttonsEl);
        overlay.appendChild(dialog);
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    }

    removeErrorOverlay() {
        const existingOverlay = document.getElementById('app-error-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }

    hideErrorOverlay() {
        const overlay = document.getElementById('app-error-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    handleErrorClose(iframe) {
        if (iframe) {
            iframe.remove();
        }
        this.hideErrorOverlay();
        this.hideAppContainer();
    }

    handleErrorWait(iframe, appName) {
        this.hideErrorOverlay();
        
        const waitTimeout = setTimeout(() => {
            this.showFinalTimeoutError(iframe, appName);
        }, 30000);

        this.loadTimeouts.set(appName + '_wait', waitTimeout);
    }

    showFinalTimeoutError(iframe, appName) {
        this.createErrorOverlay(
            'Приложение не отвечает',
            `Приложение "${this.formatAppName(appName)}" недоступно.`,
            [
                { text: 'ОК', action: () => this.handleErrorClose(iframe) }
            ]
        );
    }

    clearLoadTimeout(appName) {
        if (this.loadTimeouts.has(appName)) {
            clearTimeout(this.loadTimeouts.get(appName));
            this.loadTimeouts.delete(appName);
        }
        if (this.loadTimeouts.has(appName + '_wait')) {
            clearTimeout(this.loadTimeouts.get(appName + '_wait'));
            this.loadTimeouts.delete(appName + '_wait');
        }
    }

    showAppContainer() {
        this.appContainer.style.display = 'block';
        this.desktop.style.display = 'none';
    }

    hideAppContainer() {
        this.appContainer.style.display = 'none';
        this.desktop.style.display = 'grid';
    }

    closeApp() {
        if (!this.currentApp) {
            this.hideAppContainer();
            return;
        }

        console.log('🔒 Перемещение приложения в фон (за экран)');
        
        const iframe = this.currentApp;
        const appName = iframe.dataset.appName;
        
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        
        this.currentApp = null;
        this.hideAppContainer();
        
        this.startBackgroundTimeout(appName);
        
        console.log(`✅ Приложение "${appName}" перемещено в фон`);
    }

    restoreFromBackground(iframe) {
        console.log(`📱 Восстановление приложения из фона: ${iframe.dataset.appName}`);
        
        this.clearBackgroundTimeout(iframe.dataset.appName);
        
        iframe.style.position = '';
        iframe.style.top = '';
        iframe.style.left = '';
        iframe.style.width = '';
        iframe.style.height = '';
        iframe.style.opacity = '';
        iframe.style.pointerEvents = '';
        
        this.appContainer.innerHTML = '';
        this.appContainer.appendChild(iframe);
        this.currentApp = iframe;
        this.showAppContainer();
        
        console.log(`✅ Приложение восстановлено из фона`);
    }

    startBackgroundTimeout(appName) {
        this.clearBackgroundTimeout(appName);
        
        const timeout = setTimeout(() => {
            this.removeBackgroundApp(appName);
        }, 5 * 60 * 1000);
        
        this.backgroundTimeouts.set(appName, timeout);
        console.log(`⏰ Таймер удаления фонового приложения "${appName}" запущен (5 минут)`);
    }

    clearBackgroundTimeout(appName) {
        if (this.backgroundTimeouts.has(appName)) {
            clearTimeout(this.backgroundTimeouts.get(appName));
            this.backgroundTimeouts.delete(appName);
        }
    }

    removeBackgroundApp(appName) {
        const iframe = document.querySelector(`iframe[data-app-name="${appName}"]`);
        if (iframe) {
            iframe.remove();
            console.log(`💀 Фоновое приложение "${appName}" удалено (таймаут 5 минут)`);
        }
        this.backgroundTimeouts.delete(appName);
        
        if (window.navigationKernel) {
            window.navigationKernel.removeFromRecentApps(appName);
        }
    }

    startBackgroundCleanup() {
        setInterval(() => {
            this.cleanupBackgroundTimeouts();
        }, 60000);
    }

    cleanupBackgroundTimeouts() {
        console.log(`🕒 Активные таймеры фоновых приложений: ${this.backgroundTimeouts.size}`);
    }

    goBack() {
        if (this.currentApp && this.currentApp.contentWindow) {
            this.currentApp.contentWindow.postMessage({
                type: 'system-back'
            }, '*');
        }
    }

    formatAppName(appName) {
        const names = {
            'camera': 'Камера',
            'gallery': 'Галерея',
            'calcul': 'Калькулятор',
            'notes': 'Заметки',
            'security': 'Безопасность',
            'browser': 'Браузер',
            'mail': 'Почта'
        };
        return names[appName] || appName;
    }

    initGalleryWidget() {
        setTimeout(() => {
            this.galleryWidget = new GalleryWidget();
        }, 500);
    }
}

class GalleryWidget {
    constructor() {
        this.container = document.getElementById('random-photo-container');
        this.init();
    }

    async init() {
        await this.loadRandomPhoto();
    }

    async loadRandomPhoto() {
        try {
            const photos = await this.getPhotosFromDB();
            if (photos.length > 0) {
                const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
                this.displayPhoto(randomPhoto);
            } else {
                this.showPlaceholder();
            }
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
            this.showPlaceholder();
        }
    }

    async getPhotosFromDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('camera.user.storage', 1);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['media'], 'readonly');
                const store = transaction.objectStore('media');
                const index = store.index('type');
                const getRequest = index.getAll('photo');
                
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => reject(getRequest.error);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    displayPhoto(photoData) {
        const blobUrl = URL.createObjectURL(photoData.blob);
        
        this.container.innerHTML = `
            <div class="photo-container">
                <img src="${blobUrl}" alt="Случайное фото" class="widget-photo">
            </div>
        `;

        setTimeout(() => {
            if (this.container.querySelector('img')?.src === blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        }, 1000);
    }

    showPlaceholder() {
        this.container.innerHTML = `
            <div class="widget-placeholder">
                📷<br>
                Фото не найдено.<br>
                Сделайте любое фото, либо дождитесь загрузки, если фото у вас есть.
            </div>
        `;
    }
} 