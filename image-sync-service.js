/**
 * 图片同步服务 - 确保所有二级域名都能实时同步图片更新
 * 解决localStorage跨域问题和事件传递问题
 */

class ImageSyncService {
    constructor() {
        this.syncInterval = null;
        this.lastImageUrl = '';
        this.syncEnabled = true;
        this.syncIntervalMs = 3000; // 3秒检查一次
        this.apiEndpoint = 'https://2wei.top/api/image-status'; // 图片状态API端点
        
        this.init();
    }
    
    init() {
        console.log('图片同步服务初始化...');
        this.startSync();
        this.setupEventListeners();
    }
    
    // 启动同步
    startSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            if (this.syncEnabled) {
                this.checkForUpdates();
            }
        }, this.syncIntervalMs);
        
        console.log('图片同步服务已启动，检查间隔:', this.syncIntervalMs + 'ms');
    }
    
    // 停止同步
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('图片同步服务已停止');
        }
    }
    
    // 检查更新
    async checkForUpdates() {
        try {
            console.log('=== 图片同步服务检查更新 ===');
            
            // 方法1: 检查localStorage（同域名）
            const localImageUrl = localStorage.getItem('imageUrl');
            console.log('localStorage中的图片地址:', localImageUrl);
            console.log('上次记录的图片地址:', this.lastImageUrl);
            
            if (localImageUrl && localImageUrl !== this.lastImageUrl) {
                console.log('检测到localStorage图片地址更新:', localImageUrl);
                this.lastImageUrl = localImageUrl;
                this.notifyUpdate(localImageUrl, 'localStorage');
                return;
            }
            
            // 方法2: 检查服务器API（跨域名）
            const serverImageUrl = await this.getServerImageUrl();
            console.log('服务器API返回的图片地址:', serverImageUrl);
            
            if (serverImageUrl && serverImageUrl !== this.lastImageUrl) {
                console.log('检测到服务器图片地址更新:', serverImageUrl);
                this.lastImageUrl = serverImageUrl;
                localStorage.setItem('imageUrl', serverImageUrl);
                this.notifyUpdate(serverImageUrl, 'server');
                return;
            }
            
            console.log('没有检测到图片地址更新');
            
        } catch (error) {
            console.error('检查图片更新时出错:', error);
        }
    }
    
    // 从服务器获取最新图片地址
    async getServerImageUrl() {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.imageUrl;
            }
        } catch (error) {
            console.log('无法从服务器获取图片地址:', error);
        }
        
        return null;
    }
    
    // 通知更新
    notifyUpdate(imageUrl, source) {
        console.log(`图片地址更新通知 (来源: ${source}):`, imageUrl);
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('imageUrlUpdated', {
            detail: { imageUrl, source }
        }));
        
        // 触发storage事件
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'imageUrl',
            newValue: imageUrl,
            oldValue: this.lastImageUrl,
            url: window.location.href
        }));
        
        // 使用BroadcastChannel广播
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const channel = new BroadcastChannel('image-updates');
                channel.postMessage({
                    type: 'imageUrlUpdated',
                    imageUrl: imageUrl,
                    source: source,
                    timestamp: Date.now()
                });
                channel.close();
            } catch (e) {
                console.log('BroadcastChannel广播失败:', e);
            }
        }
        
        // 向所有iframe发送消息
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'imageUrlUpdated',
                    imageUrl: imageUrl,
                    source: source
                }, '*');
            } catch (e) {
                console.log('向iframe发送消息失败:', e);
            }
        });
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 监听BroadcastChannel消息
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const channel = new BroadcastChannel('image-updates');
                channel.onmessage = (event) => {
                    if (event.data.type === 'imageUrlUpdated') {
                        console.log('收到BroadcastChannel图片更新:', event.data);
                        this.lastImageUrl = event.data.imageUrl;
                        localStorage.setItem('imageUrl', event.data.imageUrl);
                        this.notifyUpdate(event.data.imageUrl, 'broadcast');
                    }
                };
            } catch (e) {
                console.log('BroadcastChannel监听设置失败:', e);
            }
        }
        
        // 监听postMessage消息
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'imageUrlUpdated') {
                console.log('收到postMessage图片更新:', event.data);
                this.lastImageUrl = event.data.imageUrl;
                localStorage.setItem('imageUrl', event.data.imageUrl);
                this.notifyUpdate(event.data.imageUrl, 'postMessage');
            }
        });
        
        // 监听storage事件
        window.addEventListener('storage', (event) => {
            if (event.key === 'imageUrl' && event.newValue) {
                console.log('收到storage图片更新:', event.newValue);
                this.lastImageUrl = event.newValue;
                this.notifyUpdate(event.newValue, 'storage');
            }
        });
    }
    
    // 手动更新图片地址
    updateImageUrl(imageUrl) {
        console.log('手动更新图片地址:', imageUrl);
        this.lastImageUrl = imageUrl;
        localStorage.setItem('imageUrl', imageUrl);
        this.notifyUpdate(imageUrl, 'manual');
    }
    
    // 获取当前图片地址
    getCurrentImageUrl() {
        return this.lastImageUrl || localStorage.getItem('imageUrl');
    }
    
    // 设置同步间隔
    setSyncInterval(ms) {
        this.syncIntervalMs = ms;
        if (this.syncInterval) {
            this.startSync();
        }
    }
    
    // 启用/禁用同步
    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
        console.log('图片同步服务状态:', enabled ? '已启用' : '已禁用');
    }
    
    // 销毁服务
    destroy() {
        this.stopSync();
        console.log('图片同步服务已销毁');
    }
}

// 全局实例
window.imageSyncService = new ImageSyncService();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageSyncService;
}
