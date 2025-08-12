// 自动跳转到随机2级域名 - 防止主域名被封
(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        mainDomain: '2wei.top',
        subdomainPrefix: 'abc', // 2级域名前缀
        subdomainLength: 6, // 随机字符长度
        redirectDelay: 100, // 跳转延迟（毫秒）
        localStorageKey: 'lastRedirectTime',
        redirectInterval: 300000 // 5分钟内不重复跳转
    };
    
    // 生成随机2级域名
    function generateRandomSubdomain() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = CONFIG.subdomainPrefix;
        
        for (let i = 0; i < CONFIG.subdomainLength; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result + '.' + CONFIG.mainDomain;
    }
    
    // 检查是否需要跳转
    function shouldRedirect() {
        const currentDomain = window.location.hostname;
        
        // 如果已经是2级域名，不需要跳转
        if (currentDomain.includes('.') && currentDomain !== CONFIG.mainDomain) {
            return false;
        }
        
        // 检查是否在主域名
        if (currentDomain === CONFIG.mainDomain) {
            // 检查是否有禁用跳转的参数
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('noRedirect') || urlParams.has('admin')) {
                console.log('检测到禁用跳转参数，跳过自动跳转');
                return false;
            }
            
            // 检查是否在管理后台页面
            if (window.location.pathname.includes('admin-server.html')) {
                console.log('检测到管理后台页面，跳过自动跳转');
                return false;
            }
            
            // 每次访问主域名都跳转（移除时间间隔限制）
            return true;
        }
        
        return false;
    }
    
    // 执行跳转
    function performRedirect() {
        const randomSubdomain = generateRandomSubdomain();
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        const newUrl = 'https://' + randomSubdomain + currentPath;
        
        console.log('🔄 自动跳转到随机2级域名:', newUrl);
        
        // 记录跳转时间
        localStorage.setItem(CONFIG.localStorageKey, Date.now().toString());
        
        // 延迟跳转，避免页面闪烁
        setTimeout(() => {
            window.location.href = newUrl;
        }, CONFIG.redirectDelay);
    }
    
    // 检测微信浏览器
    function isWechatBrowser() {
        const ua = navigator.userAgent.toLowerCase();
        return ua.includes('micromessenger');
    }
    
    // 检测移动设备
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // 主函数
    function initAutoRedirect() {
        // 只在主域名上执行跳转
        if (shouldRedirect()) {
            console.log('🚀 启动自动跳转保护...');
            
            // 在微信浏览器中，延迟更长时间
            const delay = isWechatBrowser() ? 500 : CONFIG.redirectDelay;
            
            setTimeout(() => {
                performRedirect();
            }, delay);
        } else {
            console.log('✅ 当前域名安全，无需跳转');
        }
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoRedirect);
    } else {
        initAutoRedirect();
    }
    
    // 导出配置，供其他脚本使用
    window.AUTO_REDIRECT_CONFIG = CONFIG;
    
})();
