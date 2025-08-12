// 测试配置文件更新
const fs = require('fs').promises;
const path = require('path');

async function testConfigUpdate() {
    try {
        // 读取当前配置文件
        const configPath = path.join(__dirname, 'image-config.js');
        const content = await fs.readFile(configPath, 'utf8');
        
        console.log('=== 当前配置文件内容 ===');
        console.log(content);
        
        // 提取图片地址
        const urlMatch = content.match(/window\.CURRENT_IMAGE_URL\s*=\s*['"]([^'"]+)['"]/);
        const timeMatch = content.match(/\/\/ 更新时间: (.+)/);
        
        if (urlMatch) {
            console.log('\n=== 配置信息 ===');
            console.log('图片地址:', urlMatch[1]);
            console.log('更新时间:', timeMatch ? timeMatch[1] : '未知');
        } else {
            console.log('\n❌ 无法解析配置文件');
        }
        
    } catch (error) {
        console.error('❌ 读取配置文件失败:', error.message);
    }
}

testConfigUpdate();
