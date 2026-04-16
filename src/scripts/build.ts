
import ConfigLoader from '../config/loader.js';
import dockerImageManager from '../docker/image.js';
import logger from '../ui/logger.js';
import spinner from '../ui/spinner.js';
import DockerClient from '../docker/client.js';
import storage from '../utils/storage.js';
import crypto from 'crypto';

/**
 * 构建命令
 * 构建 Docker 镜像
 */
async function buildCommand(
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

  const config = loader.load();
  const imageName = loader.getImageName();

  spinner.start('检查镜像是否存在...');
  const imageExists = await dockerImageManager.exists(imageName);

  if (imageExists && !options.force) {
    spinner.succeed(`镜像已存在: ${imageName}`);
    logger.info('使用 --force 选项强制重新构建');
    return;
  }

  if (imageExists && options.force) {
    spinner.text('删除旧镜像...');
    await dockerImageManager.remove(imageName);
  }

  spinner.start('开始构建镜像...');
  logger.blank();
  logger.title('构建日志');

  try {
    await dockerImageManager.build(config, imageName, (chunk) => {
      if (chunk) {
        logger.log(`  ${chunk}`);
      }
    });

    spinner.succeed('镜像构建完成');
    logger.blank();
    logger.success(`镜像已创建: ${imageName}`);

    // 保存镜像记录
    const record = {
      id: crypto.randomUUID(),
      name: imageName.split(':')[0],
      tag: imageName.split(':')[1] || 'latest',
      created: new Date().toISOString(),
      language: config.language.name,
      version: config.language.version || 'latest',
      projectName: config.name,
    };
    storage.saveRecord(record);
    logger.info('镜像记录已保存');

  } catch (error) {
    spinner.fail('镜像构建失败');
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

export {
  buildCommand
};
