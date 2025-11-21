// system/kernel.js
console.log('The Main Kernel has started.');

class Kernel {
    constructor() {
        this.init();
    }

    async init() {
        console.log('⚙️ Kernel initialization started');
        
        // Даем время всем скриптам загрузиться
        await this.delay(800);
        
        try {
            // SystemStatus - всегда должен быть первым
            if (typeof SystemStatus !== 'undefined') {
                new SystemStatus();
                console.log('✅ SystemStatus loaded');
            } else {
                console.warn('⚠️ SystemStatus not found');
            }
            
            // LockscreenKernel - проверяем не создан ли уже
            if (typeof LockscreenKernel !== 'undefined' && !window.lockscreenKernel) {
                window.lockscreenKernel = new LockscreenKernel();
                console.log('✅ LockscreenKernel loaded');
                
                // Гарантируем показ локскрина
                if (window.lockscreenKernel.lockscreenElement) {
                    window.lockscreenKernel.showLockScreen();
                }
            } else if (window.lockscreenKernel) {
                console.log('✅ LockscreenKernel already exists');
                // Переиспользуем существующий экземпляр
                if (window.lockscreenKernel.lockscreenElement) {
                    window.lockscreenKernel.showLockScreen();
                }
            } else {
                console.error('❌ LockscreenKernel NOT FOUND');
                this.debugScripts();
                return;
            }
            
            // AppKernel
            if (typeof AppKernel !== 'undefined' && !window.appKernel) {
                window.appKernel = new AppKernel();
                console.log('✅ AppKernel loaded');
            } else if (window.appKernel) {
                console.log('✅ AppKernel already exists');
            }
            
            // NavigationKernel
            if (typeof NavigationKernel !== 'undefined' && window.appKernel && !window.navigationKernel) {
                window.navigationKernel = new NavigationKernel(window.appKernel);
                console.log('✅ NavigationKernel loaded');
            } else if (window.navigationKernel) {
                console.log('✅ NavigationKernel already exists');
            } else {
                console.warn('⚠️ NavigationKernel not loaded - buttons will not work');
            }
            
            // ErrorKernel
            if (typeof ErrorKernel !== 'undefined' && !window.errorKernel) {
                window.errorKernel = new ErrorKernel();
                console.log('✅ ErrorKernel loaded');
            } else if (window.errorKernel) {
                console.log('✅ ErrorKernel already exists');
            }
            
            console.log('🎉 All systems ready!');
            
        } catch (error) {
            console.error('💥 Kernel panic:', error);
            this.showError(error);
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    debugScripts() {
        console.log('🔍 Debug: Checking loaded scripts...');
        const scripts = Array.from(document.scripts);
        scripts.forEach(script => {
            console.log(`📜 Script: ${script.src || 'inline'}`, script.readyState);
        });
        
        const availableClasses = Object.keys(window).filter(key => 
            typeof window[key] === 'function' && /[A-Z]/.test(key[0])
        );
        console.log('🏷️ Available classes:', availableClasses);
    }
    
    showError(error) {
        const errorHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: #000;
                color: #f00;
                font-family: monospace;
                padding: 20px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            ">
                <div style="font-size: 2rem; margin-bottom: 20px;">Kernel panic!</div>
                <div style="margin-bottom: 20px; color: #fff;">${error.message}</div>
                <button onclick="location.reload()" style="
                    background: #f00;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    font-size: 1rem;
                    cursor: pointer;
                    border-radius: 5px;
                ">Restart</button>
                <p>LostBox OS && Main Kernel</p>
            </div>
        `;
        document.body.innerHTML = errorHTML;
    }
}

// 🔥 ГЛАВНЫЙ ЗАПУСК
function startKernel() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => new Kernel(), 100);
        });
    } else {
        setTimeout(() => new Kernel(), 100);
    }
}

// Запускаем ядро
startKernel();

// Резервный запуск через 3 секунды
setTimeout(() => {
    if (!window.lockscreenKernel) {
        console.log('🕒 Fallback kernel start...');
        new Kernel();
    }
}, 3000);