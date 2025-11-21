class SystemStatus {
    constructor() {
        this.timeElement = document.getElementById('time');
        this.lockscreenTimeElement = document.getElementById('lockscreen-time');
        this.batteryElement = document.getElementById('battery-percent');
        this.batteryBar = document.getElementById('battery');
        this.init();
    }

    init() {
        this.updateTime();
        this.initBattery();
        this.startTimers();
    }

    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        this.timeElement.textContent = timeString;
        
        // Обновляем время на экране блокировки
        if (this.lockscreenTimeElement) {
            this.lockscreenTimeElement.textContent = timeString;
        }
        
        // Обновляем время в верхней панели экрана блокировки
        const lockscreenTimeSmall = document.getElementById('lockscreen-time-small');
        if (lockscreenTimeSmall) {
            lockscreenTimeSmall.textContent = timeString;
        }
    }

    async initBattery() {
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                this.updateBatteryStatus(battery);
                
                battery.addEventListener('levelchange', () => {
                    this.updateBatteryStatus(battery);
                });

                battery.addEventListener('chargingchange', () => {
                    this.updateBatteryStatus(battery);
                });

            } catch (error) {
                this.showBatteryError();
            }
        } else {
            this.showBatteryError();
        }
    }

    updateBatteryStatus(battery) {
        const level = Math.floor(battery.level * 100);
        const isCharging = battery.charging;
        
        let batteryText = `${level}%`;
        if (isCharging) {
            batteryText += ' ⚡';
        }
        
        this.batteryElement.textContent = batteryText;
        
        if (this.batteryBar) {
            this.batteryBar.style.width = `${level}%`;
        }
        
        let color;
        if (level > 70) {
            color = '#00ff00';
        } else if (level > 30) {
            color = '#ffff00';
        } else {
            color = '#ff4444';
        }
        
        this.batteryElement.style.color = color;
        if (this.batteryBar) {
            this.batteryBar.style.backgroundColor = color;
        }
        
        // Синхронизируем с экраном блокировки
        const lockscreenBatteryPercent = document.getElementById('lockscreen-battery-percent');
        const lockscreenBatteryLevel = document.getElementById('lockscreen-battery-level');
        
        if (lockscreenBatteryPercent) {
            lockscreenBatteryPercent.textContent = batteryText;
        }
        
        if (lockscreenBatteryLevel) {
            lockscreenBatteryLevel.style.width = `${level}%`;
            lockscreenBatteryLevel.style.backgroundColor = color;
        }
    }

    showBatteryError() {
        this.batteryElement.textContent = 'N/A';
        this.batteryElement.style.color = '#888';
        
        if (this.batteryBar) {
            this.batteryBar.style.width = '0%';
            this.batteryBar.style.backgroundColor = '#888';
        }
        
        // Синхронизируем ошибку с экраном блокировки
        const lockscreenBatteryPercent = document.getElementById('lockscreen-battery-percent');
        const lockscreenBatteryLevel = document.getElementById('lockscreen-battery-level');
        
        if (lockscreenBatteryPercent) {
            lockscreenBatteryPercent.textContent = 'N/A';
            lockscreenBatteryPercent.style.color = '#888';
        }
        
        if (lockscreenBatteryLevel) {
            lockscreenBatteryLevel.style.width = '0%';
            lockscreenBatteryLevel.style.backgroundColor = '#888';
        }
    }

    startTimers() {
        setInterval(() => {
            this.updateTime();
        }, 1000);

        setInterval(() => {
            if (navigator.getBattery) {
                navigator.getBattery().then(battery => {
                    this.updateBatteryStatus(battery);
                });
            }
        }, 60000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SystemStatus();
});