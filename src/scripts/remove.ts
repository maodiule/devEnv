
import ConfigLoader from '../config/loader.js';
import dockerImageManager from '../docker/image.js';
import dockerContainerManager from '../docker/container.js';
import logger from '../ui/logger.js';
import spinner from '../ui/spinner.js';
import DockerClient from '../docker/client.js';
import storage from '../utils/storage.js';

/**
 * 删除命令
 * 删除 Docker 镜像
 */
async function removeCommand(
  id: string | undefined,
  options
) {
  spinner.start('检查 Docker 连接...');
  const dockerClient = DockerClient.getInstance();
  const dockerAvailable = await dockerClient.isAvailable();

  if (!dockerAvailable) {
    spinner.fail('Docker 不可用');
    logger.error('请确保 Docker 已安装并正在运行');
    process.exit(1);
  }
  spinner.succeed('Docker 连接正常');

  if (options.all) {
    await removeAllImages();
    return;
  }

  if (id) {
    await removeImageById(id);
    return;
  }

  const loader = new ConfigLoader(options.config);
  if (!loader.configExists()) {
    logger.error('配置文件不存在，请先运行 "devenv init" 初始化');
    process.exit(1);
  }

  const config = loader.load();
  const imageName = loader.getImageName();
  const containerName = loader.getContainerName();

  // 检查并停止容器
  const containerExists = await dockerContainerManager.exists(containerName);
  if (containerExists) {
    spinner.text('停止并删除容器...');
    try {
      await dockerContainerManager.remove(containerName, true);
      spinner.succeed('容器已删除');
    } catch (error) {
      spinner.fail('删除容器失败');
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
  }

  // 删除镜像
  spinner.start('删除镜像...');
  try {
    await dockerImageManager.remove(imageName);
    spinner.succeed(`镜像已删除: ${imageName}`);

    // 从存储中删除记录
    const records = storage.readRecords();
    const record = records.find(r => r.projectName === config.name);
    if (record) {
      storage.deleteRecord(record.id);
      logger.info('镜像记录已从存储中移除');
    }

  } catch (error) {
    spinner.fail('删除镜像失败');
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * 通过 ID 删除镜像
 */
async function removeImageById(id: string) {
  const records = storage.readRecords();
  const record = records.find(r => r.id === id);

  if (!record) {
    logger.error(`镜像 ID 不存在: ${id}`);
    process.exit(1);
  }

  const imageName = `${record.name}:${record.tag}`;
  const containerName = `devenv-${record.projectName}`;

  // 检查并停止容器
  const containerExists = await dockerContainerManager.exists(containerName);
  if (containerExists) {
    spinner.text('停止并删除容器...');
    try {
      await dockerContainerManager.remove(containerName, true);
      spinner.succeed('容器已删除');
    } catch (error) {
      spinner.fail('删除容器失败');
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
  }

  // 删除镜像
  spinner.start('删除镜像...');
  try {
    await dockerImageManager.remove(imageName);
    spinner.succeed(`镜像已删除: ${imageName}`);

    // 从存储中删除记录
    storage.deleteRecord(id);
    logger.info('镜像记录已从存储中移除');

  } catch (error) {
    spinner.fail('删除镜像失败');
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * 删除所有镜像
 */
async function removeAllImages() {
  const records = storage.readRecords();
  
  if (records.length === 0) {
    logger.info('没有镜像记录');
    return;
  }

  spinner.start(`删除 ${records.length} 个镜像...`);

  for (const record of records) {
    try {
      // 尝试删除镜像
      await dockerImageManager.remove(`${record.name}:${record.tag}`);
      // 从存储中删除记录
      storage.deleteRecord(record.id);
    } catch (error) {
      // 忽略错误，继续删除其他镜像
      continue;
    }
  }

  spinner.succeed('所有镜像已删除');
  logger.info('镜像记录已清空');
}

export {
  removeCommand
};
