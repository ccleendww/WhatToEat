// 食物转盘核心逻辑
class FoodWheel {
    constructor() {
        this.canvas = document.getElementById('wheel');
        this.ctx = this.canvas.getContext('2d');
        this.spinBtn = document.getElementById('spinBtn');
        this.resultEl = document.getElementById('result');
        this.foodInput = document.getElementById('foodInput');
        this.addFoodBtn = document.getElementById('addFoodBtn');
        this.foodTags = document.getElementById('foodTags');
        this.themeToggle = document.getElementById('themeToggle');

        // 默认食物列表
        this.defaultFoods = [
            '火锅', '烧烤', '寿司', '披萨', '汉堡',
            '拉面', '炒饭', '饺子', '麻辣烫', '螺蛳粉',
            '烤肉', '日料', '韩餐', '泰餐', '沙拉'
        ];

        this.foods = this.loadFoods();
        this.isSpinning = false;
        this.currentRotation = 0;
        this.colors = this.generateColors();

        this.init();
    }

    init() {
        this.setupCanvas();
        this.drawWheel();
        this.bindEvents();
        this.renderFoodTags();
        this.initTheme();
        this.registerServiceWorker();
    }

    setupCanvas() {
        const size = Math.min(window.innerWidth * 0.8, 400);
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

    generateColors() {
        const baseColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF7F50'
        ];
        return baseColors;
    }

    getColor(index) {
        return this.colors[index % this.colors.length];
    }

    drawWheel() {
        const ctx = this.ctx;
        const centerX = this.centerX;
        const centerY = this.centerY;
        const radius = this.radius;
        const foods = this.foods;

        ctx.clearRect(0, 0, this.size, this.size);

        if (foods.length === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ddd';
            ctx.fill();
            ctx.fillStyle = '#999';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('请添加食物', centerX, centerY);
            return;
        }

        const sliceAngle = (2 * Math.PI) / foods.length;

        foods.forEach((food, index) => {
            const startAngle = index * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;

            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = this.getColor(index);
            ctx.fill();

            // 绘制分隔线
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制文字
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${this.getFontSize(food)}px sans-serif`;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(food, radius - 20, 0);
            ctx.restore();
        });

        // 中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 中心文字
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GO!', centerX, centerY);
    }

    getFontSize(text) {
        const baseSize = this.foods.length <= 8 ? 16 : this.foods.length <= 12 ? 14 : 12;
        if (text.length > 4) return baseSize - 2;
        return baseSize;
    }

    spin() {
        if (this.isSpinning || this.foods.length < 2) {
            if (this.foods.length < 2) {
                this.showResult('至少需要2种食物哦~');
            }
            return;
        }

        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.querySelector('.btn-text').textContent = '转动中...';
        this.resultEl.classList.remove('winner');
        this.showResult('转盘转动中...');

        // 随机选择结果
        const winnerIndex = Math.floor(Math.random() * this.foods.length);
        const sliceAngle = 360 / this.foods.length;

        // 计算旋转角度 - 让指针指向选中的扇形中心
        // 指针在顶部(12点钟方向)，扇形从-90度开始绘制
        const targetAngle = 360 - (winnerIndex * sliceAngle + sliceAngle / 2);
        const spins = 5 + Math.floor(Math.random() * 3); // 5-7圈
        const finalRotation = this.currentRotation + spins * 360 + targetAngle - (this.currentRotation % 360);

        this.currentRotation = finalRotation;
        this.canvas.style.transform = `rotate(${finalRotation}deg)`;

        // 动画结束后显示结果
        setTimeout(() => {
            this.isSpinning = false;
            this.spinBtn.disabled = false;
            this.spinBtn.querySelector('.btn-text').textContent = '再转一次';
            this.showResult(`🎉 ${this.foods[winnerIndex]}！`, true);
        }, 4000);
    }

    showResult(text, isWinner = false) {
        const resultP = this.resultEl.querySelector('p');
        resultP.textContent = text;
        if (isWinner) {
            this.resultEl.classList.add('winner');
        }
    }

    addFood(food) {
        food = food.trim();
        if (!food) return;
        if (this.foods.includes(food)) {
            alert('这个食物已经在列表里了~');
            return;
        }
        if (this.foods.length >= 20) {
            alert('最多添加20种食物哦~');
            return;
        }
        this.foods.push(food);
        this.saveFoods();
        this.renderFoodTags();
        this.drawWheel();
        this.foodInput.value = '';
    }

    removeFood(food) {
        const index = this.foods.indexOf(food);
        if (index > -1) {
            this.foods.splice(index, 1);
            this.saveFoods();
            this.renderFoodTags();
            this.drawWheel();
        }
    }

    renderFoodTags() {
        this.foodTags.innerHTML = '';
        this.foods.forEach(food => {
            const tag = document.createElement('span');
            tag.className = 'food-tag';
            tag.innerHTML = `
                <span>${food}</span>
                <button class="remove-btn" title="删除">×</button>
            `;
            tag.querySelector('.remove-btn').addEventListener('click', () => {
                this.removeFood(food);
            });
            this.foodTags.appendChild(tag);
        });
    }

    loadFoods() {
        const saved = localStorage.getItem('foodWheel_foods');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [...this.defaultFoods];
            }
        }
        return [...this.defaultFoods];
    }

    saveFoods() {
        localStorage.setItem('foodWheel_foods', JSON.stringify(this.foods));
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
        this.spinBtn.addEventListener('click', () => this.spin());

        this.addFoodBtn.addEventListener('click', () => {
            this.addFood(this.foodInput.value);
        });

        this.foodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addFood(this.foodInput.value);
            }
        });

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
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new FoodWheel();
});
