
import { spawn } from 'child_process';
import ConfigLoader from '../config/loader.js';
import dockerContainerManager from '../docker/container.js';
import logger from '../ui/logger.js';
import spinner from '../ui/spinner.js';
import DockerClient from '../docker/client.js';

/**
 * 执行命令
 * 进入容器或在容器中执行命令
 */
async function execCommand(
  args,
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
  const containerRunning = await dockerContainerManager.isRunning(containerName);

  if (!containerExists) {
    spinner.fail('容器不存在');
    logger.error('请先运行 "devenv up" 启动开发环境');
    process.exit(1);
  }

  if (!containerRunning) {
    spinner.fail('容器未运行');
    logger.error('请先运行 "devenv up" 启动容器');
    process.exit(1);
  }
  spinner.succeed('容器状态正常');

  if (args.length > 0) {
    await executeCommandInContainer(containerName, args);
  } else {
    await enterInteractiveShell(containerName);
  }
}

async function executeCommandInContainer(
  containerName,
  args
) {
  const [command, ...commandArgs] = args;

  logger.info(`在容器中执行: ${command} ${commandArgs.join(' ')}`);
  logger.blank();

  try {
    const dockerArgs = ['exec', '-it', containerName, command, ...commandArgs];
    const child = spawn('docker', dockerArgs, {
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`执行命令失败: ${error.message}`);
    }
    process.exit(1);
  }
}

async function enterInteractiveShell(containerName) {
  logger.info('进入容器交互式 Shell...');
  logger.blank();

  // 尝试按顺序使用不同的 shell
  const shells = ['/bin/bash', '/bin/sh', '/bin/ash', '/bin/dash'];

  for (const shell of shells) {
    try {
      const child = spawn('docker', ['exec', '-it', containerName, shell], {
        stdio: 'inherit',
      });

      return new Promise((resolve) => {
        child.on('exit', (code) => {
          logger.blank();
          logger.info('已退出容器');
          process.exit(code || 0);
        });
      });
    } catch (error) {
      // 尝试下一个 shell
      continue;
    }
  }

  // 所有 shell 都失败了
  logger.error('无法进入容器，所有 shell 都不存在');
  process.exit(1);
}

export {
  execCommand
};
