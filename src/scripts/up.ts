import { spawn } from 'child_process';
import ConfigLoader from '../config/loader.js';
import dockerImageManager from '../docker/image.js';
import dockerContainerManager from '../docker/container.js';
import logger from '../ui/logger.js';
import spinner from '../ui/spinner.js';
import DockerClient from '../docker/client.js';

/**
 * 启动命令
 * 启动开发环境容器
 */
async function upCommand(options) {
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
  const workspace = loader.getWorkspace();

  spinner.start('检查镜像...');
  const imageExists = await dockerImageManager.exists(imageName);

  if (!imageExists || options.build) {
    spinner.stop();
    logger.info('镜像不存在或需要重新构建');
    await buildImage(loader);
  } else {
    spinner.succeed(`镜像已就绪: ${imageName}`);
  }

  spinner.start('检查容器状态...');
  const containerExists = await dockerContainerManager.exists(containerName);
  const containerRunning = await dockerContainerManager.isRunning(containerName);

  if (containerRunning) {
    spinner.succeed(`容器已在运行: ${containerName}`);
    logger.info('使用 "devenv exec" 进入容器');
    return;
  }

  if (containerExists && !containerRunning) {
    spinner.text('启动现有容器...');
    await dockerContainerManager.start(containerName);
    spinner.succeed('容器已启动');
    showAccessInfo(config);
    return;
  }

  spinner.text('创建容器...');
  await dockerContainerManager.create(config, imageName, containerName, workspace);

  spinner.text('启动容器...');
  await dockerContainerManager.start(containerName);

  spinner.succeed('开发环境已启动');
  showAccessInfo(config);
}

async function buildImage(loader) {
  const config = loader.load();
  const imageName = loader.getImageName();

  spinner.start('构建镜像...');
  logger.blank();
  logger.title('构建日志');

  try {
    await dockerImageManager.build(config, imageName, (chunk) => {
      if (chunk) {
        logger.log(`  ${chunk}`);
      }
    });
    spinner.succeed('镜像构建完成');
  } catch (error) {
    spinner.fail('镜像构建失败');
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

function showAccessInfo(config) {
  logger.blank();
  logger.title('访问信息');

  if (config.ports && config.ports.length > 0) {
    logger.info('端口映射:');
    config.ports.forEach((port: number) => {
      logger.log(`  - http://localhost:${port}`);
    });
  }

  logger.blank();
  logger.info('进入容器:');
  logger.log('  devenv exec');
  logger.blank();
  logger.success('开发环境已就绪！');
}

export {
  upCommand
};
