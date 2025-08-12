// 随机二级域名生成器
// 用于防止微信域名拦截

class RandomDomainGenerator {
    constructor() {
        // 主域名
        this.mainDomain = '2wei.top';
        
        // 随机字符串生成字符集
        this.chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        // 二级域名长度
        this.subdomainLength = 6;
        
        // 已使用的域名缓存（避免重复）
        this.usedDomains = new Set();
        
        // 从localStorage加载已使用的域名
        this.loadUsedDomains();
    }
    
    // 生成随机字符串
    generateRandomString(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
        }
        return result;
    }
    
    // 生成随机二级域名
    generateRandomSubdomain() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const subdomain = this.generateRandomString(this.subdomainLength);
            const fullDomain = `${subdomain}.${this.mainDomain}`;
            
            // 检查是否已使用
            if (!this.usedDomains.has(fullDomain)) {
                this.usedDomains.add(fullDomain);
                this.saveUsedDomains();
                return fullDomain;
            }
            
            attempts++;
        }
        
        // 如果尝试次数过多，清空缓存重新开始
        this.usedDomains.clear();
        this.saveUsedDomains();
        const subdomain = this.generateRandomString(this.subdomainLength);
        const fullDomain = `${subdomain}.${this.mainDomain}`;
        this.usedDomains.add(fullDomain);
        this.saveUsedDomains();
        return fullDomain;
    }
    
    // 保存已使用的域名到localStorage
    saveUsedDomains() {
        try {
            localStorage.setItem('usedRandomDomains', JSON.stringify(Array.from(this.usedDomains)));
        } catch (e) {
            console.warn('无法保存已使用的域名到localStorage:', e);
        }
    }
    
    // 从localStorage加载已使用的域名
    loadUsedDomains() {
        try {
            const saved = localStorage.getItem('usedRandomDomains');
            if (saved) {
                this.usedDomains = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('无法从localStorage加载已使用的域名:', e);
            this.usedDomains = new Set();
        }
    }
    
    // 清理过期的域名记录（保留最近100个）
    cleanupOldDomains() {
        if (this.usedDomains.size > 100) {
            const domainsArray = Array.from(this.usedDomains);
            this.usedDomains = new Set(domainsArray.slice(-50)); // 保留最近50个
            this.saveUsedDomains();
        }
    }
    
    // 获取当前页面的完整URL
    getCurrentUrl() {
        return window.location.href;
    }
    
    // 生成随机域名的完整URL
    generateRandomUrl() {
        const randomDomain = this.generateRandomSubdomain();
        const currentUrl = this.getCurrentUrl();
        const urlObj = new URL(currentUrl);
        
        // 构建新的URL
        const newUrl = `${urlObj.protocol}//${randomDomain}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        
        return {
            domain: randomDomain,
            url: newUrl
        };
    }
}

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RandomDomainGenerator;
}
