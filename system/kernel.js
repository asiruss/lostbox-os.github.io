// system/kernel.js
class LoadingScreen {
    static show() {
        // Сохраняем оригинальный контент если он еще не сохранен
        if (!window.originalContent) {
            window.originalContent = document.body.innerHTML;
        }
        
        // Создаем контейнер для загрузчика поверх основного контента
        const loadingHTML = `
            <div id="loading-screen" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000000;
                color: #ffffff;
                font-family: sans-serif;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            ">
                <div class="loading-container" style="
                    max-width: 400px;
                    width: 90%;
                ">
                    <div class="loading-logo" style="text-align: center; margin-bottom: 40px;">
                        <div class="logo-icon" style="font-size: 4rem; margin-bottom: 10px;">LostBox OS</div>
                        <div class="logo-text" style="font-size: 2rem; font-weight: bold; color: #00cccc; text-shadow: 0 2px 10px rgba(0, 204, 204, 0.3);">Launch Kernel...</div>
                    </div>
                    
                    <div class="loading-spinner" style="display: flex; justify-content: center; margin-bottom: 30px;">
                        <div class="spinner-circle" style="
                            width: 50px;
                            height: 50px;
                            border: 4px solid rgba(255, 255, 255, 0.2);
                            border-top: 4px solid #00cccc;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        "></div>
                    </div>
                    
                    <div class="loading-text" id="loading-text" style="font-size: 1.2rem; margin-bottom: 20px; color: rgba(255, 255, 255, 0.9);">Загрузка системы...</div>
                    
                    <div class="loading-progress" style="margin-bottom: 25px;">
                        <div class="progress-bar" style="
                            width: 100%;
                            height: 6px;
                            background: rgba(255, 255, 255, 0.2);
                            border-radius: 3px;
                            overflow: hidden;
                            margin-bottom: 10px;
                        ">
                            <div class="progress-fill" id="progress-fill" style="
                                height: 100%;
                                background: linear-gradient(90deg, #008080, #00cccc);
                                border-radius: 3px;
                                width: 0%;
                                transition: width 0.3s ease;
                            "></div>
                        </div>
                        <div class="progress-text" id="progress-text" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">0%</div>
                    </div>
                    
                    <div class="loading-details" id="loading-details" style="
                        font-size: 0.8rem;
                        color: rgba(255, 255, 255, 0.6);
                        margin-bottom: 30px;
                        min-height: 20px;
                    ">Инициализация ядра...</div>
                    
                    <div class="loading-footer" style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); margin-top: 20px;">
                        by Nixak
                    </div>
                </div>
                
                <style>
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
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        
        // Сохраняем ссылки на элементы для обновления
        window.loadingElements = {
            text: document.getElementById('loading-text'),
            progress: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            details: document.getElementById('loading-details'),
            screen: document.getElementById('loading-screen')
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
        if (window.loadingElements && window.loadingElements.screen) {
            // Плавное исчезновение загрузчика
            window.loadingElements.screen.style.opacity = '0';
            window.loadingElements.screen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                if (window.loadingElements.screen) {
                    window.loadingElements.screen.remove();
                    window.loadingElements = null;
                }
            }, 500);
        }
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
        this.totalModules = 5;
        this.init();
    }

    async init() {
        try {
            LoadingScreen.show();
            LoadingScreen.update(10, 'Инициализация ядра...', 'Запуск основной системы');

            // Модули для загрузки
            const criticalModules = [
                { 
                    name: 'SystemStatus', 
                    check: () => typeof SystemStatus !== 'undefined',
                    load: () => new SystemStatus(),
                    progress: 20,
                    text: 'Системное время'
                },
                { 
                    name: 'LockscreenKernel', 
                    check: () => typeof LockscreenKernel !== 'undefined',
                    load: () => window.lockscreenKernel = new LockscreenKernel(),
                    progress: 40,
                    text: 'Экран блокировки'
                },
                { 
                    name: 'AppKernel', 
                    check: () => typeof AppKernel !== 'undefined',
                    load: () => window.appKernel = new AppKernel(),
                    progress: 60,
                    text: 'Менеджер приложений'
                },
                { 
                    name: 'NavigationKernel', 
                    check: () => typeof NavigationKernel !== 'undefined',
                    load: () => window.navigationKernel = new NavigationKernel(window.appKernel),
                    progress: 80,
                    text: 'Навигация'
                },
                { 
                    name: 'ErrorKernel', 
                    check: () => typeof ErrorKernel !== 'undefined',
                    load: () => window.errorKernel = new ErrorKernel(),
                    progress: 95,
                    text: 'Обработка ошибок'
                }
            ];

            // Загружаем модули последовательно
            for (const module of criticalModules) {
                LoadingScreen.update(
                    module.progress, 
                    `Загрузка ${module.text}...`,
                    `Модуль: ${module.name}`
                );

                if (!module.check()) {
                    throw { 
                        componentName: module.name,
                        error: new Error(`Модуль ${module.name} не найден`)
                    };
                }

                try {
                    await this.loadModule(module);
                    this.loadedModules.add(module.name);
                    
                    // Искусственная задержка для плавности
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (error) {
                    throw {
                        componentName: module.name,
                        error: error
                    };
                }
            }

            // Финальный этап
            LoadingScreen.update(100, 'Система готова!', 'Запуск рабочего стола...');
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Скрываем загрузчик
            LoadingScreen.hide();
            
            console.log('✅ Все компоненты ядра инициализированы');
            
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

// 🔥 Улучшенная инициализация
let systemReady = false;
let initializationStarted = false;

function initializeSystem() {
    if (initializationStarted) return;
    initializationStarted = true;
    
    console.log('⚙️ Начало инициализации системы...');
    
    try {
        window.mainKernel = new MainKernel();
    } catch (error) {
        console.error('❌ Ошибка инициализации MainKernel:', error);
        KernelPanic.showPanic('MainKernel', error);
    }
}

// Запускаем когда DOM готов
window.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен');
    
    // Даем небольшую задержку для загрузки скриптов
    setTimeout(initializeSystem, 100);
});

// Если страница полностью загружена, но система еще не инициализирована
window.addEventListener('load', function() {
    console.log('🚀 Страница полностью загружена');
    systemReady = true;
    
    if (!initializationStarted) {
        initializeSystem();
    }
});

// Резервная проверка на случай если что-то пошло не так
setTimeout(() => {
    if (!initializationStarted && !document.getElementById('loading-screen')) {
        console.log('⏰ Резервная инициализация');
        initializeSystem();
    }
}, 2000);

// Глобальный обработчик ошибок
window.addEventListener('error', (event) => {
    console.error('🚨 Глобальная ошибка:', event.error);
    
    if (!initializationStarted) {
        KernelPanic.showPanic('UnhandledError', event.error);
    }
});