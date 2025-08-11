const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// GitHub API 配置
const GITHUB_API_BASE = 'https://api.github.com';

// 更新GitHub文件的函数
async function updateGitHubFile(username, repo, branch, filePath, content, email, message) {
    return new Promise((resolve, reject) => {
        // 使用Git命令行操作
        const tempDir = path.join(__dirname, 'temp', `${Date.now()}`);
        
        // 创建临时目录
        if (!fs.existsSync(path.dirname(tempDir))) {
            fs.mkdirSync(path.dirname(tempDir), { recursive: true });
        }
        
        const commands = [
            // 克隆仓库
            `git clone https://github.com/${username}/${repo}.git "${tempDir}"`,
            // 切换到指定分支
            `cd "${tempDir}" && git checkout ${branch}`,
            // 创建或更新文件
            `echo '${content}' > "${path.join(tempDir, filePath)}"`,
            // 配置Git用户
            `cd "${tempDir}" && git config user.name "${username}" && git config user.email "${email}"`,
            // 添加文件
            `cd "${tempDir}" && git add "${filePath}"`,
            // 提交更改
            `cd "${tempDir}" && git commit -m "${message}"`,
            // 推送到GitHub
            `cd "${tempDir}" && git push origin ${branch}`,
            // 清理临时目录
            `rm -rf "${tempDir}"`
        ];
        
        let currentCommand = 0;
        
        function executeNextCommand() {
            if (currentCommand >= commands.length) {
                resolve({ success: true, message: '文件更新成功' });
                return;
            }
            
            const command = commands[currentCommand];
            console.log(`执行命令: ${command}`);
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`命令执行失败: ${error.message}`);
                    // 清理临时目录
                    if (fs.existsSync(tempDir)) {
                        exec(`rm -rf "${tempDir}"`);
                    }
                    reject({ success: false, error: error.message, command });
                    return;
                }
                
                currentCommand++;
                executeNextCommand();
            });
        }
        
        executeNextCommand();
    });
}

// API路由

// 测试GitHub连接
app.get('/api/github/test/:username/:repo', async (req, res) => {
    try {
        const { username, repo } = req.params;
        const response = await fetch(`${GITHUB_API_BASE}/repos/${username}/${repo}`);
        
        if (response.ok) {
            res.json({ success: true, message: 'GitHub连接测试成功' });
        } else {
            res.status(404).json({ success: false, message: '仓库不存在或无访问权限' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '连接测试失败', error: error.message });
    }
});

// 更新image-base64.js文件
app.post('/api/github/update-file', async (req, res) => {
    try {
        const { username, repo, branch, filePath, content, email, message } = req.body;
        
        if (!username || !repo || !branch || !filePath || !content || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: '缺少必要的参数' 
            });
        }
        
        const result = await updateGitHubFile(username, repo, branch, filePath, content, email, message);
        res.json(result);
        
    } catch (error) {
        console.error('更新文件错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '文件更新失败', 
            error: error.message 
        });
    }
});

// 获取文件内容
app.get('/api/github/file/:username/:repo/:branch/:filePath(*)', async (req, res) => {
    try {
        const { username, repo, branch, filePath } = req.params;
        const response = await fetch(
            `${GITHUB_API_BASE}/repos/${username}/${repo}/contents/${filePath}?ref=${branch}`
        );
        
        if (response.ok) {
            const data = await response.json();
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            res.json({ success: true, content });
        } else {
            res.status(404).json({ success: false, message: '文件不存在' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '获取文件失败', error: error.message });
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`GitHub API 服务器运行在端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
