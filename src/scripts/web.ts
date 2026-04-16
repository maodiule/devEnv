
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../ui/logger.js';
import spinner from '../ui/spinner.js';

/**
 * 启动可视化网页界面
 */
async function webCommand() {
  const projectRoot = path.join(process.cwd());

  spinner.start('启动可视化界面...');
  logger.blank();
  logger.info('正在启动 DevEnv 可视化界面...');
  logger.info('访问地址: http://localhost:3001');
  logger.blank();
  logger.info('按 Ctrl+C 停止服务器');
  logger.blank();

  spinner.succeed('可视化界面已就绪');

  try {
    // 使用绝对路径来确保无论在哪个目录执行命令，都能正确找到api/server.ts文件
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serverPath = path.join(__dirname, '../../api/server.ts');
    const child = spawn('npx', ['tsx', serverPath], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      logger.error(`启动可视化界面失败: ${error.message}`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`服务器退出，代码: ${code}`);
      } else {
        logger.info('服务器已停止');
      }
    });

  } catch (error) {
    logger.error('启动可视化界面失败');
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

export {
  webCommand
};

