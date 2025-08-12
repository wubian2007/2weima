// 自动跳转管理器
// 每次访问时自动跳转到随机二级域名，保护主域名

class AutoRedirectManager {
    constructor() {
        this.mainDomain = '2wei.top';
        this.chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        this.subdomainLength = 6;
        
        // 检查是否已经跳转（避免无限跳转）
        this.isRedirected = this.checkIfRedirected();
        
        // 初始化
        this.init();
    }
    
    // 检查是否已经跳转
    checkIfRedirected() {
        return sessionStorage.getItem('autoRedirected') === 'true';
    }
    
    // 检查当前是否为随机二级域名
    isRandomSubdomain() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        // 检查是否为二级域名且不是www
        if (parts.length === 3 && parts[0] !== 'www') {
            const subdomain = parts[0];
            // 检查是否为6位随机字符串
            return /^[a-z0-9]{6}$/.test(subdomain);
        }
        
        return false;
    }
    
    // 检查当前是否为主域名
    isMainDomain() {
        const hostname = window.location.hostname;
        return hostname === this.mainDomain || hostname === `www.${this.mainDomain}`;
    }
    
    // 生成随机二级域名
    generateRandomSubdomain() {
        let subdomain = '';
        for (let i = 0; i < this.subdomainLength; i++) {
            subdomain += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
        }
        return `${subdomain}.${this.mainDomain}`;
    }
    
    // 初始化
    init() {
        console.log('自动跳转管理器初始化...');
        console.log('当前域名:', window.location.hostname);
        console.log('是否已跳转:', this.isRedirected);
        console.log('是否随机域名:', this.isRandomSubdomain());
        console.log('是否主域名:', this.isMainDomain());
        
        // 如果是主域名且未跳转，执行跳转
        if (this.isMainDomain() && !this.isRedirected) {
            this.performRedirect();
        }
        
        // 如果是随机域名，标记为已跳转
        if (this.isRandomSubdomain()) {
            sessionStorage.setItem('autoRedirected', 'true');
            console.log('已标记为跳转状态');
        }
    }
    
    // 执行跳转
    performRedirect() {
        try {
            const randomDomain = this.generateRandomSubdomain();
            const currentUrl = window.location.href;
            const urlObj = new URL(currentUrl);
            
            // 构建新的URL
            const newUrl = `${urlObj.protocol}//${randomDomain}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            
            console.log('自动跳转到随机域名:', randomDomain);
            console.log('跳转URL:', newUrl);
            
            // 显示跳转提示
            this.showRedirectNotice(randomDomain);
            
            // 延迟跳转，让用户看到提示
            setTimeout(() => {
                window.location.href = newUrl;
            }, 1500);
            
        } catch (error) {
            console.error('自动跳转失败:', error);
        }
    }
    
    // 显示跳转提示
    showRedirectNotice(domain) {
        // 创建提示元素
        const notice = document.createElement('div');
        notice.id = 'auto-redirect-notice';
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
                        🔄 自动跳转中...
                    </div>
                    <div style="
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 20px;
                        line-height: 1.5;
                    ">
                        正在跳转到安全域名<br>
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
        
        // 添加到页面
        document.body.appendChild(notice);
        
        // 3秒后自动移除提示
        setTimeout(() => {
            if (notice.parentNode) {
                notice.parentNode.removeChild(notice);
            }
        }, 3000);
    }
    
    // 手动触发跳转（用于测试）
    manualRedirect() {
        console.log('手动触发自动跳转...');
        this.performRedirect();
    }
    
    // 重置跳转状态（用于测试）
    resetRedirectStatus() {
        sessionStorage.removeItem('autoRedirected');
        this.isRedirected = false;
        console.log('跳转状态已重置');
    }
    
    // 获取当前状态信息
    getStatus() {
        return {
            currentDomain: window.location.hostname,
            isMainDomain: this.isMainDomain(),
            isRandomSubdomain: this.isRandomSubdomain(),
            isRedirected: this.isRedirected,
            mainDomain: this.mainDomain
        };
    }
}

// 自动初始化
let autoRedirectManager;

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        autoRedirectManager = new AutoRedirectManager();
    });
} else {
    autoRedirectManager = new AutoRedirectManager();
}

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoRedirectManager;
}
