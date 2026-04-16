
import ConfigLoader from '../config/loader.js';
import dockerContainerManager from '../docker/container.js';
import logger from '../ui/logger.js';
import spinner from '../ui/spinner.js';
import DockerClient from '../docker/client.js';

/**
 * 停止命令
 * 停止并删除容器
 */
async function downCommand(
  options
) {
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

  const containerName = loader.getContainerName();

  spinner.start('检查容器状态...');
  const containerExists = await dockerContainerManager.exists(containerName);

  if (!containerExists) {
    spinner.succeed('容器不存在，无需清理');
    return;
  }

  const containerRunning = await dockerContainerManager.isRunning(containerName);

  if (containerRunning) {
    spinner.text('停止容器...');
    await dockerContainerManager.stop(containerName);
  }

  spinner.text('删除容器...');
  await dockerContainerManager.remove(containerName, options.volumes);

  spinner.succeed('容器已清理');
  logger.success(`开发环境已停止: ${containerName}`);

  if (options.volumes) {
    logger.info('关联的数据卷也已删除');
  }
}

export {
  downCommand
};
