// system/lockscreen.kernel.js
class LockscreenKernel {
    constructor() {
        this.isLocked = true;
        this.lockscreenElement = document.getElementById('lockscreen');
        this.swipeStartY = 0;
        this.swipeDistance = 0;
        this.isSwiping = false;
        this.hasPassword = false;
        this.passwordType = null;
        this.passwordHash = '';
        this.tempPasswordDisabled = false;
        this.init();
    }
    
    async init() {
        if (!this.lockscreenElement) {
            console.error("❌ Элемент lockscreen не найден!");
            return;
        }
        
        console.log("🔒 LockscreenKernel инициализирован");
        await this.checkPassword();
        this.setupEventListeners();
        this.showLockScreen();
        this.syncWithSystemStatus();
    }
    
    async checkPassword() {
        try {
            const passwordData = await this.getStoredPassword();
            if (passwordData) {
                this.hasPassword = true;
                this.passwordType = passwordData.type;
                this.passwordHash = passwordData.hash;
                console.log(`🔐 Статус пароля: ${this.passwordType} установлен`);
            } else {
                this.hasPassword = false;
                this.passwordType = null;
                this.passwordHash = '';
            }
        } catch (error) {
            console.error('Ошибка проверки пароля:', error);
            this.hasPassword = false;
        }
    }
    
    async getStoredPassword() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SecurityDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['passwords'], 'readonly');
                const store = transaction.objectStore('passwords');
                const getRequest = store.get('lockPassword');
                
                getRequest.onerror = () => reject(getRequest.error);
                getRequest.onsuccess = () => resolve(getRequest.result);
            };
        });
    }
    
    setupEventListeners() {
        if (!this.lockscreenElement) return;
        
        this.lockscreenElement.addEventListener('mousedown', this.handleSwipeStart.bind(this));
        this.lockscreenElement.addEventListener('mousemove', this.handleSwipeMove.bind(this));
        this.lockscreenElement.addEventListener('mouseup', this.handleSwipeEnd.bind(this));
        this.lockscreenElement.addEventListener('mouseleave', this.handleSwipeEnd.bind(this));
        
        this.lockscreenElement.addEventListener('touchstart', this.handleSwipeStart.bind(this));
        this.lockscreenElement.addEventListener('touchmove', this.handleSwipeMove.bind(this));
        this.lockscreenElement.addEventListener('touchend', this.handleSwipeEnd.bind(this));
        
        window.addEventListener('message', (event) => {
            if (event.data.type === 'password-changed') {
                this.hasPassword = event.data.hasPassword;
                if (!this.hasPassword) {
                    this.passwordType = null;
                    this.passwordHash = '';
                }
                this.tempPasswordDisabled = false;
                this.updateLockscreenUI();
            }
        });
    }
    
    updateLockscreenUI() {
        if (!this.lockscreenElement) return;
        
        const unlockContent = this.lockscreenElement.querySelector('.unlock-content');
        
        if (!unlockContent) {
            this.createUnlockContent();
            return;
        }
        
        unlockContent.innerHTML = '';
        
        if (this.hasPassword && !this.tempPasswordDisabled) {
            if (this.passwordType === 'pin') {
                this.createPasswordInput(unlockContent);
            } else if (this.passwordType === 'pattern') {
                this.createPatternLock(unlockContent);
            }
        } else {
            this.createUnlockSlider(unlockContent);
        }
    }
    
    createUnlockContent() {
        if (!this.lockscreenElement) return;
        
        const unlockArea = this.lockscreenElement.querySelector('.unlock-area');
        if (!unlockArea) return;
        
        const unlockContent = document.createElement('div');
        unlockContent.className = 'unlock-content';
        unlockArea.appendChild(unlockContent);
        this.updateLockscreenUI();
    }
    
    createPasswordInput(container) {
        if (!container) return;
        
        const passwordHTML = `
            <div class="password-input-container">
                <div class="password-field">
                    <input type="password" class="password-input" id="lockscreen-password" 
                           maxlength="4" placeholder="____">
                    <button class="password-ok-btn" id="password-ok-btn">OK</button>
                </div>
                <div class="password-hint">Пароль: 4 цифры</div>
            </div>
        `;
        
        container.innerHTML = passwordHTML;
        
        const passwordInput = document.getElementById('lockscreen-password');
        const okBtn = document.getElementById('password-ok-btn');
        
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
            
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkPasswordInput();
                }
            });
        }
        
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                this.checkPasswordInput();
            });
        }
        
        setTimeout(() => {
            if (passwordInput) passwordInput.focus();
        }, 100);
    }
    
    createPatternLock(container) {
        if (!container) return;
        
        const patternHTML = `
            <div class="pattern-lock-container">
                <div class="pattern-grid" id="pattern-grid">
                    <div class="pattern-dot" data-dot="0"></div>
                    <div class="pattern-dot" data-dot="1"></div>
                    <div class="pattern-dot" data-dot="2"></div>
                    <div class="pattern-dot" data-dot="3"></div>
                    <div class="pattern-dot" data-dot="4"></div>
                    <div class="pattern-dot" data-dot="5"></div>
                    <div class="pattern-dot" data-dot="6"></div>
                    <div class="pattern-dot" data-dot="7"></div>
                    <div class="pattern-dot" data-dot="8"></div>
                </div>
                <div class="pattern-hint">Нарисуйте графический пароль</div>
            </div>
        `;
        
        container.innerHTML = patternHTML;
        this.setupPatternLock();
    }
    
    setupPatternLock() {
        const grid = document.getElementById('pattern-grid');
        if (!grid) return;
        
        const dots = grid.querySelectorAll('.pattern-dot');
        let pattern = [];
        let isDrawing = false;
        
        const startDrawing = (dot) => {
            isDrawing = true;
            pattern = [parseInt(dot.dataset.dot)];
            dot.classList.add('active');
            
            document.querySelectorAll('.pattern-line').forEach(line => line.remove());
        };
        
        const addToPattern = (dot) => {
            if (!isDrawing) return;
            
            const dotIndex = parseInt(dot.dataset.dot);
            if (!pattern.includes(dotIndex)) {
                pattern.push(dotIndex);
                dot.classList.add('active');
                
                if (pattern.length > 1) {
                    this.drawPatternLine(pattern);
                }
            }
        };
        
        const endDrawing = () => {
            if (!isDrawing) return;
            isDrawing = false;
            
            if (pattern.length > 0) {
                this.checkPatternInput(pattern.join(''));
            }
            
            setTimeout(() => {
                pattern = [];
                dots.forEach(dot => {
                    dot.classList.remove('active');
                });
                document.querySelectorAll('.pattern-line').forEach(line => line.remove());
            }, 1000);
        };
        
        dots.forEach(dot => {
            dot.addEventListener('mousedown', () => startDrawing(dot));
            dot.addEventListener('mouseenter', () => addToPattern(dot));
        });
        
        grid.addEventListener('mouseup', endDrawing);
        grid.addEventListener('mouseleave', endDrawing);
        
        dots.forEach(dot => {
            dot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startDrawing(dot);
            });
            
            dot.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.classList.contains('pattern-dot')) {
                    addToPattern(element);
                }
            });
        });
        
        grid.addEventListener('touchend', endDrawing);
    }
    
    drawPatternLine(pattern) {
        if (pattern.length < 2) return;
        
        const grid = document.getElementById('pattern-grid');
        if (!grid) return;
        
        const prevDotIndex = pattern[pattern.length - 2];
        const currentDotIndex = pattern[pattern.length - 1];
        
        const prevDot = document.querySelector(`[data-dot="${prevDotIndex}"]`);
        const currentDot = document.querySelector(`[data-dot="${currentDotIndex}"]`);
        
        if (prevDot && currentDot) {
            const oldLine = document.querySelector(`[data-line="${prevDotIndex}-${currentDotIndex}"]`);
            if (oldLine) oldLine.remove();
            
            const prevRect = prevDot.getBoundingClientRect();
            const currentRect = currentDot.getBoundingClientRect();
            
            const gridRect = grid.getBoundingClientRect();
            
            const x1 = prevRect.left + prevRect.width / 2 - gridRect.left;
            const y1 = prevRect.top + prevRect.height / 2 - gridRect.top;
            const x2 = currentRect.left + currentRect.width / 2 - gridRect.left;
            const y2 = currentRect.top + currentRect.height / 2 - gridRect.top;
            
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            const line = document.createElement('div');
            line.className = 'pattern-line';
            line.style.width = length + 'px';
            line.style.left = x1 + 'px';
            line.style.top = y1 + 'px';
            line.style.transform = `rotate(${angle}deg)`;
            line.setAttribute('data-line', `${prevDotIndex}-${currentDotIndex}`);
            
            grid.appendChild(line);
        }
    }
    
    async checkPasswordInput() {
        const input = document.getElementById('lockscreen-password');
        if (!input) return;
        
        const enteredPassword = input.value;
        
        if (enteredPassword.length !== 4) {
            this.shakePasswordInput();
            return;
        }
        
        const enteredHash = await this.hashPassword(enteredPassword);
        if (enteredHash === this.passwordHash) {
            this.tempPasswordDisabled = true;
            this.updateLockscreenUI();
        } else {
            this.shakePasswordInput();
            input.value = '';
            input.focus();
        }
    }
    
    async checkPatternInput(pattern) {
        if (pattern.length < 4) {
            this.shakePatternLock();
            return;
        }
        
        const enteredHash = await this.hashPassword(pattern);
        if (enteredHash === this.passwordHash) {
            this.tempPasswordDisabled = true;
            this.updateLockscreenUI();
        } else {
            this.shakePatternLock();
        }
    }
    
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    shakePasswordInput() {
        const input = document.getElementById('lockscreen-password');
        if (!input) return;
        
        input.classList.add('shake');
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }
    
    shakePatternLock() {
        const container = document.querySelector('.pattern-lock-container');
        if (!container) return;
        
        container.classList.add('shake');
        setTimeout(() => {
            container.classList.remove('shake');
        }, 500);
    }
    
    createUnlockSlider(container) {
        if (!container) return;
        
        const sliderHTML = `
            <div class="unlock-slider">
                <div class="unlock-arrow">↑</div>
            </div>
        `;
        
        container.innerHTML = sliderHTML;
        
        const unlockSlider = container.querySelector('.unlock-slider');
        if (unlockSlider) {
            unlockSlider.addEventListener('click', this.handleUnlockAttempt.bind(this));
        }
    }
    
    handleSwipeStart(e) {
        if (!this.tempPasswordDisabled && this.hasPassword) return;
        
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        
        if (clientY < window.innerHeight - 150) return;
        
        this.swipeStartY = clientY;
        this.swipeDistance = 0;
        this.isSwiping = true;
        
        this.createSwipeLine();
    }
    
    handleSwipeMove(e) {
        if (!this.isSwiping || (!this.tempPasswordDisabled && this.hasPassword)) return;
        
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        this.swipeDistance = this.swipeStartY - clientY;
        
        this.swipeDistance = Math.max(0, Math.min(this.swipeDistance, 200));
        
        this.updateSwipeLine(this.swipeDistance);
        
        if (this.swipeDistance > 120) {
            this.handleUnlockAttempt();
        }
    }
    
    handleSwipeEnd() {
        if (!this.isSwiping || (!this.tempPasswordDisabled && this.hasPassword)) return;
        
        this.isSwiping = false;
        
        if (this.swipeDistance > 60) {
            this.completeUnlock();
        } else {
            this.resetSwipe();
        }
    }
    
    createSwipeLine() {
        this.removeSwipeLine();
        
        this.swipeLine = document.createElement('div');
        this.swipeLine.className = 'swipe-line';
        if (this.lockscreenElement) {
            this.lockscreenElement.appendChild(this.swipeLine);
        }
    }
    
    updateSwipeLine(distance) {
        if (this.swipeLine) {
            this.swipeLine.style.height = distance + 'px';
        }
    }
    
    removeSwipeLine() {
        if (this.swipeLine) {
            this.swipeLine.remove();
            this.swipeLine = null;
        }
    }
    
    resetSwipe() {
        if (this.swipeLine) {
            this.swipeLine.style.transition = 'height 0.3s ease';
            this.swipeLine.style.height = '0px';
            
            setTimeout(() => {
                this.removeSwipeLine();
            }, 300);
        }
    }
    
    completeUnlock() {
        if (this.swipeLine) {
            this.swipeLine.style.transition = 'all 0.4s ease';
            this.swipeLine.style.height = '200px';
            this.swipeLine.style.opacity = '0';
            
            setTimeout(() => {
                this.removeSwipeLine();
                this.unlock();
            }, 400);
        } else {
            this.unlock();
        }
    }
    
    handleUnlockAttempt() {
        if (this.hasPassword && !this.tempPasswordDisabled) {
            this.updateLockscreenUI();
        } else {
            this.completeUnlock();
        }
    }
    
    showLockScreen() {
        if (this.lockscreenElement) {
            this.lockscreenElement.style.display = 'flex';
        }
        this.isLocked = true;
        this.tempPasswordDisabled = false;
        this.updateLockscreenUI();
    }
    
    hideLockScreen() {
        if (this.lockscreenElement) {
            this.lockscreenElement.style.display = 'none';
        }
        this.isLocked = false;
        this.tempPasswordDisabled = false;
    }
    
    /**
     * @override
     * Разблокировка устройства.
     * Скрывает локскрин и явно показывает рабочий стол и его панели.
     */
    unlock() {
        if (this.lockscreenElement) {
            this.lockscreenElement.style.animation = 'swipeUp 0.5s ease forwards';
        }
        
        setTimeout(() => {
            this.hideLockScreen();
            if (this.lockscreenElement) {
                this.lockscreenElement.style.animation = '';
            }
            
            // 🔥 ЯВНО ПОКАЗЫВАЕМ ЭЛЕМЕНТЫ РАБОЧЕГО СТОЛА ПОСЛЕ РАЗБЛОКИРОВКИ
            const desktopElement = document.getElementById('desktop');
            const topBarElement = document.querySelector('.top-bar');
            const bottomBarElement = document.querySelector('.bottom-bar');
            
            if (desktopElement) {
                // Возвращаем display: grid (согласно mainscreen.app.ui.los.css)
                desktopElement.style.display = 'grid'; 
            }
            if (topBarElement) {
                // Возвращаем display: flex (согласно mainscreen.ui.los.css)
                topBarElement.style.display = 'flex'; 
            }
            if (bottomBarElement) {
                // Возвращаем display: flex (согласно mainscreen.ui.los.css)
                bottomBarElement.style.display = 'flex'; 
            }
            // ---------------------------------------------------------
            
            const unlockEvent = new CustomEvent('deviceUnlocked');
            document.dispatchEvent(unlockEvent);
        }, 500);
    }
    
    lock() {
        this.showLockScreen();
        
        const lockEvent = new CustomEvent('deviceLocked');
        document.dispatchEvent(lockEvent);
    }
    
    syncWithSystemStatus() {
        const mainTimeElement = document.getElementById('time');
        if (mainTimeElement) {
            const timeSmallElement = document.getElementById('lockscreen-time-small');
            const timeBigElement = document.getElementById('lockscreen-time');
            
            if (timeSmallElement) timeSmallElement.textContent = mainTimeElement.textContent;
            if (timeBigElement) timeBigElement.textContent = mainTimeElement.textContent;
        }
        
        const mainBatteryElement = document.getElementById('battery-percent');
        const mainBatteryBar = document.getElementById('battery');
        
        if (mainBatteryElement) {
            const batteryPercent = document.getElementById('lockscreen-battery-percent');
            if (batteryPercent) batteryPercent.textContent = mainBatteryElement.textContent;
        }
        
        if (mainBatteryBar) {
            const batteryLevel = document.getElementById('lockscreen-battery-level');
            if (batteryLevel) {
                batteryLevel.style.width = mainBatteryBar.style.width;
                batteryLevel.style.backgroundColor = mainBatteryBar.style.backgroundColor;
            }
        }
        
        this.updateDate();
    }
    
    updateDate() {
        const now = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const dateString = now.toLocaleDateString('ru-RU', options);
        
        if (!this.lockscreenElement) return;
        
        const dateElement = this.lockscreenElement.querySelector('.lockscreen-date');
        if (!dateElement) {
            const dateEl = document.createElement('div');
            dateEl.className = 'lockscreen-date';
            dateEl.textContent = dateString;
            const timeContainer = this.lockscreenElement.querySelector('.lockscreen-time-container');
            if (timeContainer) {
                timeContainer.appendChild(dateEl);
            }
        } else {
            dateElement.textContent = dateString;
        }
    }
    
    updateBatteryStatus(battery) {
        const level = Math.floor(battery.level * 100);
        const isCharging = battery.charging;
        
        let batteryText = `${level}%`;
        if (isCharging) {
            batteryText += ' ⚡';
        }
        
        const batteryPercent = document.getElementById('lockscreen-battery-percent');
        if (batteryPercent) {
            batteryPercent.textContent = batteryText;
        }
        
        const batteryLevel = document.getElementById('lockscreen-battery-level');
        if (batteryLevel) {
            batteryLevel.style.width = `${level}%`;
            
            let color;
            if (level > 70) {
                color = '#00ff00';
            } else if (level > 30) {
                color = '#ffff00';
            } else {
                color = '#ff4444';
            }
            batteryLevel.style.backgroundColor = color;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.lockscreenKernel = new LockscreenKernel();
    
    setInterval(() => {
        if (window.lockscreenKernel && document.getElementById('lockscreen')?.style.display === 'flex') {
            window.lockscreenKernel.syncWithSystemStatus();
        }
    }, 1000);
});

if (typeof window !== 'undefined') {
    window.LockscreenKernel = LockscreenKernel;
}