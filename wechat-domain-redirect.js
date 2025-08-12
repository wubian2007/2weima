// 微信访问检测和随机域名跳转
// 防止域名被微信拦截

class WechatDomainRedirect {
    constructor() {
        this.domainGenerator = new RandomDomainGenerator();
        this.isWechat = this.detectWechat();
        this.isRedirected = this.checkIfRedirected();
        
        // 初始化
        this.init();
    }
    
    // 检测是否为微信浏览器
    detectWechat() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('micromessenger') || 
               userAgent.includes('wechat') ||
               userAgent.includes('weixin');
    }
    
    // 检查是否已经跳转过（避免无限跳转）
    checkIfRedirected() {
        return sessionStorage.getItem('wechatRedirected') === 'true';
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
    
    // 初始化
    init() {
        // 如果是微信访问且未跳转过
        if (this.isWechat && !this.isRedirected && !this.isRandomSubdomain()) {
            this.performRedirect();
        }
        
        // 如果是随机域名，标记为已跳转
        if (this.isRandomSubdomain()) {
            sessionStorage.setItem('wechatRedirected', 'true');
        }
        
        // 定期清理过期域名记录
        setInterval(() => {
            this.domainGenerator.cleanupOldDomains();
        }, 60000); // 每分钟清理一次
    }
    
    // 执行跳转
    performRedirect() {
        try {
            const randomUrl = this.domainGenerator.generateRandomUrl();
            
            console.log('检测到微信访问，跳转到随机域名:', randomUrl.domain);
            
            // 显示跳转提示
            this.showRedirectNotice(randomUrl.domain);
            
            // 延迟跳转，让用户看到提示
            setTimeout(() => {
                window.location.href = randomUrl.url;
            }, 1500);
            
        } catch (error) {
            console.error('域名跳转失败:', error);
        }
    }
    
    // 显示跳转提示
    showRedirectNotice(domain) {
        // 创建提示元素
        const notice = document.createElement('div');
        notice.id = 'wechat-redirect-notice';
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
                        🔄 正在跳转...
                    </div>
                    <div style="
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 20px;
                        line-height: 1.5;
                    ">
                        检测到微信访问，正在跳转到安全域名<br>
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
        if (!this.isWechat) {
            alert('当前不是微信浏览器，无需跳转');
            return;
        }
        
        this.performRedirect();
    }
    
    // 获取当前状态信息
    getStatus() {
        return {
            isWechat: this.isWechat,
            isRedirected: this.isRedirected,
            isRandomSubdomain: this.isRandomSubdomain(),
            currentDomain: window.location.hostname,
            userAgent: navigator.userAgent
        };
    }
    
    // 重置跳转状态（用于测试）
    resetRedirectStatus() {
        sessionStorage.removeItem('wechatRedirected');
        this.isRedirected = false;
        console.log('跳转状态已重置');
    }
}

// 自动初始化
let wechatRedirect;

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        wechatRedirect = new WechatDomainRedirect();
    });
} else {
    wechatRedirect = new WechatDomainRedirect();
}

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WechatDomainRedirect;
}
