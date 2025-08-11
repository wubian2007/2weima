const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    }
});

// 路由：保存base64到文件
app.post('/api/save-base64', async (req, res) => {
    try {
        const { base64Data, fileName = 'image-base64.js' } = req.body;
        
        if (!base64Data) {
            return res.status(400).json({ error: '缺少base64数据' });
        }

        // 创建JavaScript文件内容
        const fileContent = `// 图片base64数据 - ${fileName}
const IMAGE_BASE64 = "${base64Data}";

// 导出图片数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IMAGE_BASE64;
} else {
    window.IMAGE_BASE64 = IMAGE_BASE64;
}
`;

        // 写入文件
        await fs.writeFile(fileName, fileContent, 'utf8');
        
        res.json({ 
            success: true, 
            message: `Base64数据已保存到 ${fileName}`,
            fileName: fileName
        });
        
    } catch (error) {
        console.error('保存文件错误:', error);
        res.status(500).json({ error: '保存文件失败' });
    }
});

// 路由：上传图片并转换为base64
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const file = req.file;
        const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        res.json({
            success: true,
            base64Data: base64Data,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype
        });
        
    } catch (error) {
        console.error('处理图片错误:', error);
        res.status(500).json({ error: '处理图片失败' });
    }
});

// 路由：获取文件列表
app.get('/api/files', async (req, res) => {
    try {
        const files = await fs.readdir('.');
        const jsFiles = files.filter(file => file.endsWith('.js'));
        
        res.json({
            success: true,
            files: jsFiles
        });
        
    } catch (error) {
        console.error('读取文件列表错误:', error);
        res.status(500).json({ error: '读取文件列表失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件服务已启动`);
    console.log(`🖼️ 图片转换工具: http://localhost:${PORT}/image-converter.html`);
});
