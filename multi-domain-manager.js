// 多域名管理器
// 支持域名轮换和微信拦截检测

class MultiDomainManager {
    constructor() {
            // 域名列表配置 - 使用泛域名生成
    this.mainDomain = '2wei.top';
    this.domains = this.generateRandomDomains();
        
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
    
    // 生成随机域名列表
    generateRandomDomains() {
        const domains = [];
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        // 生成20个随机二级域名
        for (let i = 0; i < 20; i++) {
            let subdomain = '';
            for (let j = 0; j < 6; j++) {
                subdomain += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            domains.push(`${subdomain}.${this.mainDomain}`);
        }
        
        // 添加主域名
        domains.unshift(this.mainDomain);
        
        return domains;
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
        console.log('多域名管理器初始化...');
        
        // 延迟检查当前域名是否被拦截（等待页面完全加载）
        setTimeout(() => {
            this.checkCurrentDomain();
        }, 2000);
        
        // 再次检查（防止延迟加载的拦截页面）
        setTimeout(() => {
            this.checkCurrentDomain();
        }, 5000);
        
        // 定期检查域名状态
        setInterval(() => {
            this.checkAllDomains();
        }, 300000); // 每5分钟检查一次
        
        // 监听页面变化（检测动态拦截）
        this.observePageChanges();
    }
    
    // 监听页面变化
    observePageChanges() {
        // 监听DOM变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    // 页面内容发生变化，检查是否被拦截
                    setTimeout(() => {
                        this.checkCurrentDomain();
                    }, 1000);
                }
            });
        });
        
        // 开始监听
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // 页面重新可见时检查
                setTimeout(() => {
                    this.checkCurrentDomain();
                }, 1000);
            }
        });
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
        console.log(`检查当前域名: ${currentDomain}`);
        
        // 检查是否被微信拦截
        if (this.isWechatBlocked()) {
            console.log(`域名 ${currentDomain} 被微信拦截，准备切换...`);
            this.markDomainAsBlocked(currentDomain);
            this.switchToNextDomain();
        } else {
            console.log(`域名 ${currentDomain} 状态正常`);
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
            console.log('非微信浏览器，跳过拦截检测');
            return false;
        }
        
        console.log('检测到微信浏览器，开始拦截检测...');
        
        // 检查页面是否被拦截 - 多种检测方式
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
            '网页已被拦截',
            '网页包含风险内容',
            '网页已被投诉',
            '网页已被删除',
            '网页已被下架',
            '网页已被冻结',
            '网页存在风险',
            '网页已被标记',
            '网页已被警告',
            '网页已被暂停',
            '网页已被终止'
        ];
        
        // 检查页面文本
        const pageText = document.body.innerText.toLowerCase();
        const pageHtml = document.body.innerHTML.toLowerCase();
        const title = document.title.toLowerCase();
        
        // 检查页面标题
        const titleBlocked = blockedIndicators.some(indicator => 
            title.includes(indicator.toLowerCase())
        );
        
        // 检查页面文本
        const textBlocked = blockedIndicators.some(indicator => 
            pageText.includes(indicator.toLowerCase())
        );
        
        // 检查页面HTML
        const htmlBlocked = blockedIndicators.some(indicator => 
            pageHtml.includes(indicator.toLowerCase())
        );
        
        // 检查URL特征
        const urlBlocked = window.location.href.includes('weixin.qq.com') && 
                          (window.location.href.includes('safecenter') || 
                           window.location.href.includes('blocked') ||
                           window.location.href.includes('warning'));
        
        // 检查页面结构特征
        const structureBlocked = this.checkBlockedPageStructure();
        
        const isBlocked = titleBlocked || textBlocked || htmlBlocked || urlBlocked || structureBlocked;
        
        if (isBlocked) {
            console.log('检测到微信拦截！');
            console.log('标题检测:', titleBlocked);
            console.log('文本检测:', textBlocked);
            console.log('HTML检测:', htmlBlocked);
            console.log('URL检测:', urlBlocked);
            console.log('结构检测:', structureBlocked);
        } else {
            console.log('未检测到微信拦截');
        }
        
        return isBlocked;
    }
    
    // 检查被拦截页面的结构特征
    checkBlockedPageStructure() {
        // 检查是否有微信安全中心的特征元素
        const wechatElements = [
            'wechat-safecenter',
            'wechat-warning',
            'wechat-blocked',
            'wechat-error',
            'wechat-security'
        ];
        
        // 检查页面中的class和id
        const hasWechatElements = wechatElements.some(className => 
            document.querySelector(`.${className}`) || 
            document.querySelector(`#${className}`)
        );
        
        // 检查页面是否重定向到微信安全页面
        const isRedirectedToWechat = window.location.hostname.includes('weixin.qq.com') ||
                                    window.location.hostname.includes('wechat.com');
        
        // 检查页面内容是否被替换
        const pageContent = document.body.innerText;
        const isContentReplaced = pageContent.length < 100 && 
                                 (pageContent.includes('微信') || 
                                  pageContent.includes('安全') || 
                                  pageContent.includes('警告'));
        
        return hasWechatElements || isRedirectedToWechat || isContentReplaced;
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
