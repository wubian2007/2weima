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

// 配置磁盘存储
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 创建uploads目录
        const uploadDir = path.join(__dirname, 'uploads');
        fs.mkdir(uploadDir, { recursive: true }).then(() => {
            cb(null, uploadDir);
        }).catch(err => {
            cb(err);
        });
    },
    filename: function (req, file, cb) {
        // 使用原始文件名或自定义名称
        const fileName = req.body.name || file.originalname;
        cb(null, fileName);
    }
});

const uploadToDisk = multer({ 
    storage: diskStorage,
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

// 路由：上传图片到服务器
app.post('/upload', uploadToDisk.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const file = req.file;
        const imageUrl = `/uploads/${file.filename}`;
        
        res.json({
            success: true,
            message: '图片上传成功',
            fileName: file.filename,
            fileSize: file.size,
            mimeType: file.mimetype,
            imageUrl: imageUrl
        });
        
    } catch (error) {
        console.error('上传图片错误:', error);
        res.status(500).json({ error: '上传图片失败' });
    }
});

// 路由：获取图片状态信息
app.get('/api/image-status', async (req, res) => {
    try {
        // 读取uploads目录中的最新图片
        const uploadsDir = path.join(__dirname, 'uploads');
        
        try {
            const files = await fs.readdir(uploadsDir);
            const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
            );
            
            if (imageFiles.length > 0) {
                // 按修改时间排序，获取最新的图片
                const fileStats = await Promise.all(
                    imageFiles.map(async (file) => {
                        const filePath = path.join(uploadsDir, file);
                        const stats = await fs.stat(filePath);
                        return { file, stats };
                    })
                );
                
                fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
                const latestImage = fileStats[0].file;
                const imageUrl = `/uploads/${latestImage}`;
                
                res.json({
                    success: true,
                    imageUrl: imageUrl,
                    fileName: latestImage,
                    lastModified: fileStats[0].stats.mtime.toISOString(),
                    totalImages: imageFiles.length
                });
            } else {
                // 没有图片文件，返回默认状态
                res.json({
                    success: true,
                    imageUrl: null,
                    message: '没有找到图片文件',
                    totalImages: 0
                });
            }
        } catch (error) {
            // uploads目录不存在，返回默认状态
            res.json({
                success: true,
                imageUrl: null,
                message: 'uploads目录不存在',
                totalImages: 0
            });
        }
        
    } catch (error) {
        console.error('获取图片状态错误:', error);
        res.status(500).json({ 
            success: false,
            error: '获取图片状态失败' 
        });
    }
});

// 路由：提供uploads目录的静态文件访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件服务已启动`);
    console.log(`🖼️ 图片转换工具: http://localhost:${PORT}/image-converter.html`);
    console.log(`📊 图片状态API: http://localhost:${PORT}/api/image-status`);
});
