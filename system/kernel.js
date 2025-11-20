class KernelPanic {
    static showPanic(missingComponent, error = null) {
        // 🔥 Полный сброс страницы
        document.body.innerHTML = '';
        document.body.style.cssText = `
            background: #000000;
            color: #ffffff;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 40px 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            line-height: 1.4;
            cursor: pointer;
        `;

        // 🔥 Собираем дополнительную информацию об ошибке
        const errorDetails = error ? `
            [ERROR] ${error.message || 'Unknown error'}<br>
            [STACK] ${error.stack ? error.stack.split('\n')[1]?.trim() : 'No stack'}
        ` : '';

        const panicHTML = `
            <div style="font-size: 24px; color: #ff4444; margin-bottom: 20px; font-weight: bold;">
               Kernel panic!
            </div>
            
            <div style="font-size: 16px; color: #ffffff; margin-bottom: 15px;">
                It looks like some script didn't load or wasn't found.
            </div>
            
            <div style="font-size: 14px; color: #44ff44; margin-bottom: 15px;">
                Try reloading the site.
            </div>
            
            ${missingComponent ? `
            <div style="font-size: 13px; color: #ff8844; margin-bottom: 25px;">
                Failed to load: ${missingComponent}
            </div>
            ` : '<div style="margin-bottom: 25px;"></div>'}
            
            <div style="font-size: 12px; color: #ffffff; opacity: 0.7;">
                LostBox Kernel && Main Kernel © 2025
            </div>
            
            <!-- Детальный дебаг лог -->
            <div style="
                font-size: 10px; 
                color: #666666; 
                margin-top: 40px; 
                text-align: left; 
                max-width: 600px;
                border-top: 1px solid #333;
                padding-top: 10px;
                line-height: 1.3;
            ">
                [KERNEL] State: PANIC_MODE<br>
                [TIME] ${new Date().toLocaleString()}<br>
                [URL] ${window.location.href}<br>
                [USER_AGENT] ${navigator.userAgent.substring(0, 50)}...<br>
                ${missingComponent ? `[MISSING] ${missingComponent}<br>` : ''}
                ${errorDetails}
                [ACTION] Click anywhere to reload
            </div>
        `;

        document.body.innerHTML = panicHTML;

        // 🔥 Клик для перезагрузки
        document.body.addEventListener('click', () => {
            location.reload();
        });

        // 🔥 Авто-релоад через 15 секунд
        setTimeout(() => {
            location.reload();
        }, 15000);
    }
}

// 🔥 ОБНОВЛЁННЫЙ Main Kernel с паникой вместо логов
class MainKernel {
    constructor() {
        this.init();
    }

    async init() {
        try {
            console.log('⚙️ Инициализация MainKernel...');

            // 🔥 Проверяем ВСЕ критические зависимости
            const criticalModules = [
                { name: 'SystemStatus', check: () => typeof SystemStatus !== 'undefined' },
                { name: 'LockscreenKernel', check: () => typeof LockscreenKernel !== 'undefined' },
                { name: 'AppKernel', check: () => typeof AppKernel !== 'undefined' },
                { name: 'NavigationKernel', check: () => typeof NavigationKernel !== 'undefined' },
                { name: 'ErrorKernel', check: () => typeof ErrorKernel !== 'undefined' }
            ];

            // Проверяем каждый модуль
            for (const module of criticalModules) {
                if (!module.check()) {
                    throw { 
                        componentName: module.name,
                        error: new Error(`Module ${module.name} is not defined`)
                    };
                }
            }

            // 🔥 Пытаемся инициализировать модули
            try {
                new SystemStatus();
                window.lockscreenKernel = new LockscreenKernel();
                window.appKernel = new AppKernel();
                window.navigationKernel = new NavigationKernel(window.appKernel);
                window.errorKernel = new ErrorKernel();
            } catch (initError) {
                throw {
                    componentName: 'ModuleInitialization',
                    error: initError
                };
            }
            
            console.log('✅ Все компоненты ядра инициализированы');
            
        } catch (error) {
            // 🔥 ВМЕСТО ЛОГА - ПОЛНОЦЕННАЯ ПАНИКА!
            KernelPanic.showPanic(error.componentName, error.error);
        }
    }
}

// 🔥 Запускаем MainKernel после полной загрузки страницы
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        try {
            window.mainKernel = new MainKernel();
        } catch (error) {
            console.error('❌ Ошибка инициализации MainKernel:', error);
            KernelPanic.showPanic('MainKernel', error);
        }
    }, 100);
});

// 🔥 Защита на случай если MainKernel тоже не загрузился
setTimeout(() => {
    if (!window.mainKernel && !document.body.classList.contains('kernel-panic')) {
        KernelPanic.showPanic('MainKernel');
    }
}, 3000);

// 🔥 Глобальный обработчик ошибок для перехвата непойманных исключений
window.addEventListener('error', (event) => {
    if (!document.body.classList.contains('kernel-panic')) {
        KernelPanic.showPanic('UnhandledError', event.error);
    }
});