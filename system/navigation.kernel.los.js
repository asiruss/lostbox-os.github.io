// system/navigation.kernel.los.js
class NavigationKernel {
    constructor(appKernel) {
        if (!appKernel) {
            console.error('❌ NavigationKernel: appKernel не передан');
            return;
        }
        
        this.appKernel = appKernel;
        this.recentApps = [];
        this.maxRecentApps = 4;
        this.processTimeouts = new Map();
        this.init();
    }

    init() {
        console.log('🧭 Инициализация NavigationKernel');
        this.setupEventListeners();
        this.loadRecentApps();
    }

    setupEventListeners() {
        const homeBtn = document.getElementById('home-btn');
        const backBtn = document.getElementById('back-btn');
        const closeBtn = document.getElementById('close-btn');

        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                console.log('🟦 Квадрат нажат - показ последних приложений');
                this.toggleRecentApps();
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('🔴 Круг нажат - выход из приложения');
                if (this.appKernel.currentApp) {
                    this.addToRecentApps(this.appKernel.currentApp);
                }
                this.appKernel.closeApp();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('▶️ Треугольник нажат - назад в приложении');
                this.appKernel.goBack();
            });
        }
    }

    addToRecentApps(iframe) {
        const appName = iframe.dataset.appName;
        console.log(`📸 Добавление в последние приложения: ${appName}`);
        
        this.createFallbackScreenshot(appName).then(screenshot => {
            this.recentApps = this.recentApps.filter(app => app.name !== appName);
            
            this.recentApps.unshift({
                name: appName,
                url: iframe.src,
                screenshot: screenshot,
                timestamp: Date.now()
            });
            
            if (this.recentApps.length > this.maxRecentApps) {
                this.recentApps.pop();
            }
            
            this.saveRecentApps();
            this.startProcessTimeout(appName);
        });
    }

    createFallbackScreenshot(appName) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 120;
            
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            const bgColor = this.getAppBackground(appName);
            gradient.addColorStop(0, bgColor);
            gradient.addColorStop(1, this.darkenColor(bgColor));
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            this.drawAppInterface(appName, canvas, ctx);
            
            const appIcon = this.getAppIcon(appName);
            if (appIcon) {
                const img = new Image();
                img.onload = () => {
                    const iconSize = 24;
                    ctx.drawImage(img, 10, 10, iconSize, iconSize);
                    resolve(canvas.toDataURL());
                };
                img.src = appIcon;
                img.onerror = () => {
                    resolve(canvas.toDataURL());
                };
            } else {
                resolve(canvas.toDataURL());
            }
        });
    }

    drawAppInterface(appName, canvas, ctx) {
        switch(appName) {
            case 'camera':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(canvas.width - 30, canvas.height - 30, 20, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(20, 20, canvas.width - 80, canvas.height - 70);
                break;
                
            case 'gallery':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 2; j++) {
                        ctx.fillRect(15 + i * 55, 15 + j * 40, 50, 35);
                    }
                }
                break;
                
            case 'calcul':
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(10, 10, canvas.width - 20, 30);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = '12px monospace';
                ctx.fillText('123.45', 15, 30);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        ctx.fillRect(15 + i * 40, 50 + j * 15, 35, 12);
                    }
                }
                break;
                
            case 'notes':
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.font = '10px sans-serif';
                ctx.fillText('• Заметка 1', 15, 25);
                ctx.fillText('• Заметка 2', 15, 40);
                ctx.fillText('• Список дел...', 15, 55);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    ctx.moveTo(10, 30 + i * 15);
                    ctx.lineTo(canvas.width - 10, 30 + i * 15);
                }
                ctx.stroke();
                break;
                
            default:
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(this.formatAppName(appName), canvas.width / 2, canvas.height / 2);
                break;
        }
    }

    getAppBackground(appName) {
        const backgrounds = {
            'camera': '#1a1a1a',
            'gallery': '#2d2d2d',
            'calcul': '#202020',
            'notes': '#f5f5dc',
            'security': '#2d4f4f',
            'browser': '#ffffff'
        };
        return backgrounds[appName] || '#006666';
    }

    darkenColor(color) {
        if (color.startsWith('#')) {
            let r = parseInt(color.substr(1, 2), 16);
            let g = parseInt(color.substr(3, 2), 16);
            let b = parseInt(color.substr(5, 2), 16);
            
            r = Math.max(0, r - 30);
            g = Math.max(0, g - 30);
            b = Math.max(0, b - 30);
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    getAppIcon(appName) {
        const appIcon = document.querySelector(`.app-icon[data-app="${appName}"] .app-img`);
        return appIcon ? appIcon.src : null;
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

    startProcessTimeout(appName) {
        if (this.processTimeouts.has(appName)) {
            clearTimeout(this.processTimeouts.get(appName));
        }
        
        const timeout = setTimeout(() => {
            this.removeFromRecentApps(appName);
        }, 5 * 60 * 1000);
        
        this.processTimeouts.set(appName, timeout);
    }

    removeFromRecentApps(appName) {
        this.recentApps = this.recentApps.filter(app => app.name !== appName);
        this.saveRecentApps();
        this.processTimeouts.delete(appName);
        
        console.log(`🗑️ Приложение "${appName}" удалено из последних`);
    }

    toggleRecentApps() {
        const overlay = document.querySelector('.recent-apps-overlay');
        if (overlay && overlay.style.display === 'flex') {
            this.hideRecentApps();
        } else {
            this.showRecentApps();
        }
    }

    showRecentApps() {
        this.createRecentAppsOverlay();
        const overlay = document.querySelector('.recent-apps-overlay');
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.backdropFilter = 'blur(10px)';
        }, 10);
    }

    hideRecentApps() {
        const overlay = document.querySelector('.recent-apps-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.backdropFilter = 'blur(0px)';
            
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    createRecentAppsOverlay() {
        let overlay = document.querySelector('.recent-apps-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'recent-apps-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = '';
        
        const title = document.createElement('div');
        title.className = 'recent-apps-title';
        title.textContent = 'Последние приложения';
        overlay.appendChild(title);
        
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'recent-apps-scroll-container';
        
        const container = document.createElement('div');
        container.className = 'recent-apps-container';
        
        if (this.recentApps.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'recent-apps-empty';
            emptyMessage.textContent = 'Последних приложений нет.';
            container.appendChild(emptyMessage);
        } else {
            this.recentApps.forEach(app => {
                const appElement = this.createRecentAppElement(app);
                container.appendChild(appElement);
            });
        }
        
        scrollContainer.appendChild(container);
        overlay.appendChild(scrollContainer);
        
        const closeButton = document.createElement('div');
        closeButton.className = 'recent-apps-close';
        closeButton.innerHTML = '✕';
        closeButton.addEventListener('click', () => this.hideRecentApps());
        overlay.appendChild(closeButton);
        
        const footer = document.createElement('div');
        footer.className = 'recent-apps-footer';
        footer.innerHTML = `
            <button class="close-all-btn">
                <span>✕</span>
                Закрыть все
            </button>
        `;
        footer.querySelector('.close-all-btn').addEventListener('click', () => {
            this.closeAllRecentApps();
        });
        overlay.appendChild(footer);
    }

    createRecentAppElement(app) {
        const appElement = document.createElement('div');
        appElement.className = 'recent-app-item';
        appElement.setAttribute('data-app-name', app.name);
        
        appElement.innerHTML = `
            <img src="${app.screenshot}" alt="${app.name}" class="recent-app-screenshot">
            <span class="recent-app-name">${this.formatAppName(app.name)}</span>
            <div class="recent-app-delete">✕</div>
        `;
        
        appElement.addEventListener('click', (e) => {
            if (!e.target.closest('.recent-app-delete')) {
                this.launchRecentApp(app);
                this.hideRecentApps();
            }
        });
        
        const deleteBtn = appElement.querySelector('.recent-app-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeAppWithAnimation(appElement, app.name);
        });
        
        return appElement;
    }

    removeAppWithAnimation(appElement, appName) {
        appElement.style.transform = 'translateX(-100%)';
        appElement.style.opacity = '0';
        
        setTimeout(() => {
            this.removeFromRecentApps(appName);
        }, 300);
    }

    closeAllRecentApps() {
        const appItems = document.querySelectorAll('.recent-app-item');
        
        appItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transform = 'translateX(-100%)';
                item.style.opacity = '0';
            }, index * 100);
        });
        
        setTimeout(() => {
            this.recentApps = [];
            this.saveRecentApps();
            
            this.processTimeouts.forEach((timeout, appName) => {
                clearTimeout(timeout);
            });
            this.processTimeouts.clear();
            
            this.showRecentApps();
        }, appItems.length * 100 + 300);
    }

    launchRecentApp(app) {
        console.log(`📱 Запуск последнего приложения: ${app.name}`);
        this.appKernel.launchApp(app.name);
        this.startProcessTimeout(app.name);
    }

    saveRecentApps() {
        try {
            localStorage.setItem('recentApps', JSON.stringify(this.recentApps));
        } catch (error) {
            console.error('Ошибка сохранения последних приложений:', error);
        }
    }

    loadRecentApps() {
        try {
            const saved = localStorage.getItem('recentApps');
            if (saved) {
                this.recentApps = JSON.parse(saved);
                
                const now = Date.now();
                this.recentApps = this.recentApps.filter(app => {
                    if (now - app.timestamp < 5 * 60 * 1000) {
                        return true;
                    } else {
                        this.processTimeouts.delete(app.name);
                        return false;
                    }
                });
                
                this.saveRecentApps();
            }
        } catch (error) {
            console.error('Ошибка загрузки последних приложений:', error);
            this.recentApps = [];
        }
    }
} 