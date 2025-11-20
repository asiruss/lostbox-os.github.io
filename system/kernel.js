// system/kernel.js
class LoadingScreen {
    static show() {
        document.body.innerHTML = '';
        document.body.style.cssText = `
            background: linear-gradient(135deg, #004f4f 0%, #003737 100%);
            color: #ffffff;
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            line-height: 1.4;
        `;

        const loadingHTML = `
            <div class="loading-container">
                <div class="loading-logo">
                    <div class="logo-icon">LostBox OS</div>
                    <div class="logo-text">Start Kernel...</div>
                </div>
                
                <div class="loading-spinner">
                    <div class="spinner-circle"></div>
                </div>
                
                <div class="loading-text" id="loading-text">Загрузка системы...</div>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-text" id="progress-text">0%</div>
                </div>
                
                <div class="loading-details" id="loading-details">
                    Инициализация ядра...
                </div>
                
                <div class="loading-footer">
                    LostBox OS © 2025
                </div>
            </div>
            
            <style>
                .loading-container {
                    max-width: 400px;
                    width: 90%;
                    animation: fadeIn 0.5s ease;
                }
                
                .loading-logo {
                    text-align: center;
                    margin-bottom: 40px;
                }
                
                .logo-icon {
                    font-size: 4rem;
                    margin-bottom: 10px;
                    animation: bounce 2s infinite;
                }
                
                .logo-text {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #00cccc;
                    text-shadow: 0 2px 10px rgba(0, 204, 204, 0.3);
                }
                
                .loading-spinner {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 30px;
                }
                
                .spinner-circle {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255, 255, 255, 0.2);
                    border-top: 4px solid #00cccc;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                .loading-text {
                    font-size: 1.2rem;
                    margin-bottom: 20px;
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .loading-progress {
                    margin-bottom: 25px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #008080, #00cccc);
                    border-radius: 3px;
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .progress-text {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.7);
                }
                
                .loading-details {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 30px;
                    min-height: 20px;
                }
                
                .loading-footer {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: 20px;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            </style>
        `;

        document.body.innerHTML = loadingHTML;
        
        // Сохраняем ссылки на элементы для обновления
        window.loadingElements = {
            text: document.getElementById('loading-text'),
            progress: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            details: document.getElementById('loading-details')
        };
    }

    static update(progress, text, details) {
        if (!window.loadingElements) return;
        
        if (progress !== undefined) {
            window.loadingElements.progress.style.width = progress + '%';
            window.loadingElements.progressText.textContent = Math.round(progress) + '%';
        }
        
        if (text) {
            window.loadingElements.text.textContent = text;
        }
        
        if (details) {
            window.loadingElements.details.textContent = details;
        }
    }

    static hide() {
        document.body.style.opacity = '0';
        setTimeout(() => {
            location.reload();
        }, 500);
    }
}

class KernelPanic {
    static showPanic(missingComponent, error = null) {
        LoadingScreen.show();
        
        LoadingScreen.update(100, 'Ошибка загрузки системы', `
            Не удалось загрузить: ${missingComponent}
            ${error ? error.message : ''}
            Перезагрузка через 10 секунд...
        `);

        // Заменяем спиннер на иконку ошибки
        const spinner = document.querySelector('.spinner-circle');
        if (spinner) {
            spinner.style.animation = 'none';
            spinner.style.border = '4px solid #ff4444';
            spinner.innerHTML = '❌';
            spinner.style.display = 'flex';
            spinner.style.alignItems = 'center';
            spinner.style.justifyContent = 'center';
            spinner.style.fontSize = '1.5rem';
        }

        setTimeout(() => {
            location.reload();
        }, 10000);
    }
}

class MainKernel {
    constructor() {
        this.loadedModules = new Set();
        this.totalModules = 5; // SystemStatus, LockscreenKernel, AppKernel, NavigationKernel, ErrorKernel
        this.init();
    }

    async init() {
        try {
            LoadingScreen.show();
            LoadingScreen.update(10, 'Инициализация ядра...', 'Запуск основной системы');

            // 🔥 Проверяем ВСЕ критические зависимости с прогрессом
            const criticalModules = [
                { 
                    name: 'SystemStatus', 
                    check: () => typeof SystemStatus !== 'undefined',
                    load: () => new SystemStatus(),
                    progress: 20
                },
                { 
                    name: 'LockscreenKernel', 
                    check: () => typeof LockscreenKernel !== 'undefined',
                    load: () => window.lockscreenKernel = new LockscreenKernel(),
                    progress: 40
                },
                { 
                    name: 'AppKernel', 
                    check: () => typeof AppKernel !== 'undefined',
                    load: () => window.appKernel = new AppKernel(),
                    progress: 60
                },
                { 
                    name: 'NavigationKernel', 
                    check: () => typeof NavigationKernel !== 'undefined',
                    load: () => window.navigationKernel = new NavigationKernel(window.appKernel),
                    progress: 80
                },
                { 
                    name: 'ErrorKernel', 
                    check: () => typeof ErrorKernel !== 'undefined',
                    load: () => window.errorKernel = new ErrorKernel(),
                    progress: 95
                }
            ];

            // Загружаем модули последовательно с обновлением прогресса
            for (const module of criticalModules) {
                LoadingScreen.update(
                    module.progress, 
                    `Загрузка ${module.name}...`,
                    `Инициализация системного модуля`
                );

                if (!module.check()) {
                    throw { 
                        componentName: module.name,
                        error: new Error(`Module ${module.name} is not defined`)
                    };
                }

                try {
                    await this.loadModule(module);
                    this.loadedModules.add(module.name);
                    
                    // Искусственная задержка для плавности анимации
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                } catch (error) {
                    throw {
                        componentName: module.name,
                        error: error
                    };
                }
            }

            // Финальный этап
            LoadingScreen.update(100, 'Система готова!', 'Запуск рабочего стола...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Плавное исчезновение загрузочного экрана
            document.body.style.opacity = '0';
            setTimeout(() => {
                // Восстанавливаем оригинальную страницу
                location.reload();
            }, 500);
            
        } catch (error) {
            console.error('❌ Ошибка инициализации MainKernel:', error);
            KernelPanic.showPanic(error.componentName, error.error);
        }
    }

    async loadModule(module) {
        return new Promise((resolve, reject) => {
            try {
                module.load();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
}

// 🔥 Улучшенная проверка готовности системы
let systemReady = false;
let loadingTimeout = null;

window.addEventListener('DOMContentLoaded', function() {
    // Показываем загрузчик сразу
    LoadingScreen.show();
    LoadingScreen.update(5, 'Подготовка системы...', 'Загрузка ресурсов');

    // Даем время на загрузку основных скриптов
    loadingTimeout = setTimeout(() => {
        if (!systemReady) {
            try {
                window.mainKernel = new MainKernel();
            } catch (error) {
                console.error('❌ Ошибка инициализации MainKernel:', error);
                KernelPanic.showPanic('MainKernel', error);
            }
        }
    }, 100);
});

// 🔥 Отслеживаем успешную загрузку всех скриптов
window.addEventListener('load', function() {
    systemReady = true;
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
    }
});

// 🔥 Глобальный обработчик ошибок
window.addEventListener('error', (event) => {
    if (!systemReady && !document.querySelector('.loading-container')) {
        KernelPanic.showPanic('UnhandledError', event.error);
    }
});

// 🔥 Резервная проверка
setTimeout(() => {
    if (!systemReady && !document.querySelector('.loading-container')) {
        KernelPanic.showPanic('LoadingTimeout');
    }
}, 15000);