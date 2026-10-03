// 食物转盘核心逻辑
class FoodWheel {
    constructor() {
        this.canvas = document.getElementById('wheel');
        this.ctx = this.canvas.getContext('2d');
        this.themeToggle = document.getElementById('themeToggle');

        // 固定食物列表（带权重）
        this.foods = [
            { name: '食堂-二楼', weight: 40, color: '#FF6B6B' },
            { name: '食堂-三楼', weight: 20, color: '#4ECDC4' },
            { name: '马记永', weight: 20, color: '#45B7D1' },
            { name: '饭团', weight: 20, color: '#96CEB4' }
        ];

        this.isSpinning = false;
        this.currentRotation = 0;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.drawWheel();
        this.bindEvents();
        this.initTheme();
        this.registerServiceWorker();
        this.createResultPopup();
    }

    setupCanvas() {
        const size = Math.min(window.innerWidth * 0.85, 480);
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.ctx.scale(dpr, dpr);
        this.size = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = size / 2 - 10;
    }

    drawWheel() {
        const ctx = this.ctx;
        const centerX = this.centerX;
        const centerY = this.centerY;
        const radius = this.radius;

        ctx.clearRect(0, 0, this.size, this.size);

        const totalWeight = this.foods.reduce((sum, f) => sum + f.weight, 0);
        let startAngle = -Math.PI / 2; // 从顶部开始

        this.foods.forEach((food) => {
            const sliceAngle = (food.weight / totalWeight) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = food.color;
            ctx.fill();

            // 绘制分隔线
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 绘制文字
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${this.getFontSize(food.name)}px sans-serif`;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(food.name, radius - 25, 0);
            ctx.restore();

            startAngle = endAngle;
        });

        // 中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 中心图标
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍽️', centerX, centerY);
    }

    getFontSize(text) {
        if (text.length <= 3) return 20;
        if (text.length <= 5) return 18;
        return 16;
    }

    // 加权随机选择
    weightedRandom() {
        const totalWeight = this.foods.reduce((sum, f) => sum + f.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < this.foods.length; i++) {
            random -= this.foods[i].weight;
            if (random <= 0) {
                return i;
            }
        }
        return this.foods.length - 1;
    }

    spin() {
        if (this.isSpinning) return;

        this.isSpinning = true;
        this.hideResult();

        // 加权随机选择结果
        const winnerIndex = this.weightedRandom();
        const totalWeight = this.foods.reduce((sum, f) => sum + f.weight, 0);
        
        // 计算选中扇形的中心角度
        let startDegree = 0;
        for (let i = 0; i < winnerIndex; i++) {
            startDegree += (this.foods[i].weight / totalWeight) * 360;
        }
        const sliceDegree = (this.foods[winnerIndex].weight / totalWeight) * 360;
        const centerDegree = startDegree + sliceDegree / 2;

        // 指针在顶部(0度)，需要让选中扇形转到顶部
        // 转盘顺时针旋转，目标角度 = 360 - centerDegree
        const targetAngle = 360 - centerDegree;
        const spins = 5 + Math.floor(Math.random() * 3); // 5-7圈
        
        // 在扇形内加一点随机偏移（避免总是正中）
        const randomOffset = (Math.random() - 0.5) * sliceDegree * 0.6;
        
        const finalRotation = this.currentRotation + spins * 360 + targetAngle + randomOffset - (this.currentRotation % 360);

        this.currentRotation = finalRotation;
        this.canvas.style.transform = `rotate(${finalRotation}deg)`;

        // 动画结束后显示结果
        setTimeout(() => {
            this.isSpinning = false;
            this.showResult(this.foods[winnerIndex].name);
        }, 4000);
    }

    createResultPopup() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        this.overlay.addEventListener('click', () => this.hideResult());
        document.body.appendChild(this.overlay);

        // 创建结果弹窗
        this.popup = document.createElement('div');
        this.popup.className = 'result-popup';
        this.popup.innerHTML = `
            <p id="resultText"></p>
            <div class="sub">点击任意处关闭</div>
        `;
        this.popup.addEventListener('click', () => this.hideResult());
        document.body.appendChild(this.popup);
    }

    showResult(text) {
        const resultText = this.popup.querySelector('#resultText');
        resultText.textContent = text;
        this.overlay.classList.add('show');
        this.popup.classList.add('show');
    }

    hideResult() {
        this.overlay.classList.remove('show');
        this.popup.classList.remove('show');
    }

    initTheme() {
        const savedTheme = localStorage.getItem('foodWheel_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('foodWheel_theme', theme);
        const icon = this.themeToggle.querySelector('.theme-icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
    }

    bindEvents() {
        // 点击转盘转动
        this.canvas.addEventListener('click', () => this.spin());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.spin();
        }, { passive: false });

        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // 窗口大小改变时重绘
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                this.drawWheel();
            }, 200);
        });

        // 键盘空格/回车也能触发
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.spin();
            }
        });
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new FoodWheel();
});
