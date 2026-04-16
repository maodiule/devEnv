
import chalk from 'chalk';
import ConfigLoader from '../config/loader.js';
import dockerContainerManager from '../docker/container.js';
import dockerImageManager from '../docker/image.js';
import logger from '../ui/logger.js';
import spinner from '../ui/spinner.js';
import table from '../ui/table.js';
import DockerClient from '../docker/client.js';

/**
 * 状态命令
 * 查看容器状态
 */
async function statusCommand(options) {
  const loader = new ConfigLoader(options.config);

  if (!loader.configExists()) {
    logger.error('配置文件不存在，请先运行 "devenv init" 初始化');
    process.exit(1);
  }

  spinner.start('检查 Docker 连接...');
  const dockerClient = DockerClient.getInstance();
  const dockerAvailable = await dockerClient.isAvailable();

  if (!dockerAvailable) {
    spinner.fail('Docker 不可用');
    logger.error('请确保 Docker 已安装并正在运行');
    process.exit(1);
  }
  spinner.succeed('Docker 连接正常');

  const config = loader.load();
  const imageName = loader.getImageName();
  const containerName = loader.getContainerName();

  logger.title('DevEnv 状态');

  const imageExists = await dockerImageManager.exists(imageName);
  const containerExists = await dockerContainerManager.exists(containerName);
  const containerRunning = await dockerContainerManager.isRunning(containerName);

  const statusData: Record<string, string> = {
    '项目名称': config.name,
    '镜像名称': imageName,
    '镜像状态': imageExists ? chalk.green('已构建') : chalk.yellow('未构建'),
    '容器名称': containerName,
    '容器状态': getContainerStatus(containerExists, containerRunning),
    '工作目录': config.workspace || '/workspace',
  };

  table.renderKeyValue(statusData);

  if (config.ports && config.ports.length > 0) {
    logger.blank();
    logger.info('端口映射:');
    const portRows = config.ports.map((port) => [
      `${port}`,
      `http://localhost:${port}`,
    ]);
    table.render(['容器端口', '访问地址'], portRows, { compact: true });
  }

  if (config.packages && config.packages.length > 0) {
    logger.blank();
    logger.info('已配置包:');
    const packageRows = config.packages.map((pkg) => [
      pkg,
      'latest',
    ]);
    table.render(['包名称', '版本'], packageRows, { compact: true });
  }

  logger.blank();
  if (containerRunning) {
    logger.success('开发环境正在运行！');
    logger.info('使用 "devenv exec" 进入容器');
  } else if (containerExists) {
    logger.warn('容器已存在但未运行');
    logger.info('使用 "devenv up" 启动容器');
  } else if (imageExists) {
    logger.info('镜像已构建，容器未创建');
    logger.info('使用 "devenv up" 启动开发环境');
  } else {
    logger.warn('镜像和容器都不存在');
    logger.info('使用 "devenv build" 构建镜像，然后使用 "devenv up" 启动');
  }
}

function getContainerStatus(exists, running) {
  if (!exists) {
    return chalk.gray('不存在');
  }
  if (running) {
    return chalk.green('运行中');
  }
  return chalk.yellow('已停止');
}

export {
  statusCommand
};
