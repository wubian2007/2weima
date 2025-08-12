// 多域名管理器
// 支持域名轮换和微信拦截检测

class MultiDomainManager {
    constructor() {
        // 域名列表配置
        this.domains = [
            '9gtu.com',
            '2weima.com',
            'qrcode.pay',
            'pay.9gtu.com',
            'qr.2weima.com',
            'pay.qrcode.com',
            'wechat.pay.com',
            'qr.payment.com',
            'pay.wechat.com',
            'qrcode.wechat.com'
        ];
        
        // 当前使用的域名索引
        this.currentDomainIndex = 0;
        
        // 域名状态记录
        this.domainStatus = new Map();
        
        // 微信拦截检测状态
        this.blockedDomains = new Set();
        
        // 从localStorage加载配置
        this.loadConfig();
        
        // 初始化
        this.init();
    }
    
    // 从localStorage加载配置
    loadConfig() {
        try {
            const savedIndex = localStorage.getItem('currentDomainIndex');
            const savedBlocked = localStorage.getItem('blockedDomains');
            
            if (savedIndex !== null) {
                this.currentDomainIndex = parseInt(savedIndex);
            }
            
            if (savedBlocked) {
                this.blockedDomains = new Set(JSON.parse(savedBlocked));
            }
        } catch (e) {
            console.warn('加载域名配置失败:', e);
        }
    }
    
    // 保存配置到localStorage
    saveConfig() {
        try {
            localStorage.setItem('currentDomainIndex', this.currentDomainIndex.toString());
            localStorage.setItem('blockedDomains', JSON.stringify(Array.from(this.blockedDomains)));
        } catch (e) {
            console.warn('保存域名配置失败:', e);
        }
    }
    
    // 初始化
    init() {
        // 检查当前域名是否被拦截
        this.checkCurrentDomain();
        
        // 定期检查域名状态
        setInterval(() => {
            this.checkAllDomains();
        }, 300000); // 每5分钟检查一次
    }
    
    // 获取当前域名
    getCurrentDomain() {
        return this.domains[this.currentDomainIndex];
    }
    
    // 获取下一个可用域名
    getNextAvailableDomain() {
        let attempts = 0;
        const maxAttempts = this.domains.length;
        
        while (attempts < maxAttempts) {
            this.currentDomainIndex = (this.currentDomainIndex + 1) % this.domains.length;
            const domain = this.domains[this.currentDomainIndex];
            
            if (!this.blockedDomains.has(domain)) {
                this.saveConfig();
                return domain;
            }
            
            attempts++;
        }
        
        // 如果所有域名都被拦截，重置状态
        this.resetAllDomains();
        return this.getCurrentDomain();
    }
    
    // 标记域名为被拦截
    markDomainAsBlocked(domain) {
        this.blockedDomains.add(domain);
        this.saveConfig();
        console.log(`域名 ${domain} 被标记为拦截状态`);
    }
    
    // 标记域名为可用
    markDomainAsAvailable(domain) {
        this.blockedDomains.delete(domain);
        this.saveConfig();
        console.log(`域名 ${domain} 被标记为可用状态`);
    }
    
    // 检查当前域名状态
    checkCurrentDomain() {
        const currentDomain = this.getCurrentDomain();
        
        // 检查是否被微信拦截
        if (this.isWechatBlocked()) {
            this.markDomainAsBlocked(currentDomain);
            this.switchToNextDomain();
        } else {
            this.markDomainAsAvailable(currentDomain);
        }
    }
    
    // 检查所有域名状态
    async checkAllDomains() {
        console.log('开始检查所有域名状态...');
        
        for (const domain of this.domains) {
            try {
                const isAvailable = await this.testDomain(domain);
                if (isAvailable) {
                    this.markDomainAsAvailable(domain);
                } else {
                    this.markDomainAsBlocked(domain);
                }
            } catch (error) {
                console.warn(`检查域名 ${domain} 失败:`, error);
                this.markDomainAsBlocked(domain);
            }
        }
    }
    
    // 测试域名可用性
    async testDomain(domain) {
        return new Promise((resolve) => {
            const testUrl = `https://${domain}/api/files`;
            const timeout = setTimeout(() => {
                resolve(false);
            }, 5000);
            
            fetch(testUrl, { mode: 'no-cors' })
                .then(() => {
                    clearTimeout(timeout);
                    resolve(true);
                })
                .catch(() => {
                    clearTimeout(timeout);
                    resolve(false);
                });
        });
    }
    
    // 检测微信拦截
    isWechatBlocked() {
        // 检测微信浏览器
        const isWechat = this.detectWechat();
        
        if (!isWechat) {
            return false;
        }
        
        // 检查页面是否被拦截
        const blockedIndicators = [
            '微信安全中心',
            '网页包含恶意内容',
            '网页包含欺诈内容',
            '网页包含违规内容',
            '网页已被举报',
            '网页已被屏蔽',
            '网页无法访问',
            '网页已被封禁',
            '网页已被限制',
            '网页已被拦截'
        ];
        
        const pageText = document.body.innerText.toLowerCase();
        return blockedIndicators.some(indicator => 
            pageText.includes(indicator.toLowerCase())
        );
    }
    
    // 检测微信浏览器
    detectWechat() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('micromessenger') || 
               userAgent.includes('wechat') ||
               userAgent.includes('weixin');
    }
    
    // 切换到下一个域名
    switchToNextDomain() {
        const nextDomain = this.getNextAvailableDomain();
        const currentUrl = window.location.href;
        const urlObj = new URL(currentUrl);
        
        // 构建新URL
        const newUrl = `${urlObj.protocol}//${nextDomain}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        
        console.log(`切换到下一个域名: ${nextDomain}`);
        
        // 显示切换提示
        this.showDomainSwitchNotice(nextDomain);
        
        // 延迟跳转
        setTimeout(() => {
            window.location.href = newUrl;
        }, 2000);
    }
    
    // 显示域名切换提示
    showDomainSwitchNotice(domain) {
        const notice = document.createElement('div');
        notice.id = 'domain-switch-notice';
        notice.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    max-width: 80%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                ">
                    <div style="
                        font-size: 24px;
                        color: #333;
                        margin-bottom: 15px;
                        font-weight: bold;
                    ">
                        🔄 域名切换中...
                    </div>
                    <div style="
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 20px;
                        line-height: 1.5;
                    ">
                        检测到域名被拦截，正在切换到安全域名<br>
                        <strong style="color: #667eea;">${domain}</strong>
                    </div>
                    <div style="
                        font-size: 14px;
                        color: #999;
                    ">
                        请稍候，即将自动跳转...
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notice);
        
        // 5秒后自动移除提示
        setTimeout(() => {
            if (notice.parentNode) {
                notice.parentNode.removeChild(notice);
            }
        }, 5000);
    }
    
    // 重置所有域名状态
    resetAllDomains() {
        this.blockedDomains.clear();
        this.currentDomainIndex = 0;
        this.saveConfig();
        console.log('所有域名状态已重置');
    }
    
    // 手动切换域名
    manualSwitch() {
        this.switchToNextDomain();
    }
    
    // 获取域名状态信息
    getDomainStatus() {
        return {
            currentDomain: this.getCurrentDomain(),
            currentIndex: this.currentDomainIndex,
            totalDomains: this.domains.length,
            blockedDomains: Array.from(this.blockedDomains),
            availableDomains: this.domains.filter(domain => !this.blockedDomains.has(domain)),
            isWechat: this.detectWechat(),
            isBlocked: this.isWechatBlocked()
        };
    }
    
    // 添加新域名
    addDomain(domain) {
        if (!this.domains.includes(domain)) {
            this.domains.push(domain);
            this.saveConfig();
            console.log(`添加新域名: ${domain}`);
        }
    }
    
    // 移除域名
    removeDomain(domain) {
        const index = this.domains.indexOf(domain);
        if (index > -1) {
            this.domains.splice(index, 1);
            this.blockedDomains.delete(domain);
            
            // 调整当前索引
            if (this.currentDomainIndex >= this.domains.length) {
                this.currentDomainIndex = 0;
            }
            
            this.saveConfig();
            console.log(`移除域名: ${domain}`);
        }
    }
}

// 自动初始化
let multiDomainManager;

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        multiDomainManager = new MultiDomainManager();
    });
} else {
    multiDomainManager = new MultiDomainManager();
}

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiDomainManager;
}
