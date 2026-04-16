
import inquirer from 'inquirer';
import chalk from 'chalk';
import storage from '../utils/storage.js';
import logger from '../ui/logger.js';
import { execSync } from 'child_process';
import dockerContainerManager from '../docker/container.js';
import dockerImageManager from '../docker/image.js';

/**
 * 启动可视化界面
 */
async function uiCommand() {
  logger.title('DevEnv 可视化界面');
  logger.blank();

  while (true) {
    const records = storage.readRecords();
    
    const choices = [
      ...records.map((record) => ({
        name: `${chalk.cyan(record.projectName)} (${record.language} ${record.version}) - ${record.created.split('T')[0]}`,
        value: record,
      })),
      new inquirer.Separator(),
      { name: '🔄 刷新列表', value: 'refresh' },
      { name: '🚪 退出', value: 'exit' },
    ];

    if (records.length === 0) {
      choices.unshift({ name: '📦 暂无镜像，请先构建镜像', value: 'empty' });
    }

    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: '选择一个镜像进行操作:',
      choices,
    });

    if (action === 'refresh') {
      continue;
    }

    if (action === 'exit') {
      logger.blank();
      logger.info('已退出可视化界面');
      break;
    }

    if (action === 'empty') {
      logger.blank();
      logger.info('请运行 "devenv build" 构建镜像');
      continue;
    }

    await handleImageAction(action);
  }
}

/**
 * 处理镜像操作
 * @param record 镜像记录
 */
async function handleImageAction(record) {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: `选择操作 (${record.projectName}):`,
    choices: [
      { name: '🚀 启动容器', value: 'up' },
      { name: '📟 进入容器', value: 'exec' },
      { name: '🛑 停止容器', value: 'down' },
      { name: '📋 查看状态', value: 'status' },
      { name: '🗑️ 删除镜像', value: 'remove' },
      { name: '🔙 返回', value: 'back' },
    ],
  });

  if (action === 'back') {
    return;
  }

  try {
    const containerName = `devenv-${record.projectName}`;
    const imageName = `${record.name}:${record.tag}`;

    switch (action) {
      case 'up':
        logger.blank();
        logger.title('启动容器');
        execSync(`docker run -d --name ${containerName} -v "${process.cwd()}:/workspace" ${imageName}`, { stdio: 'inherit' });
        logger.success('容器已启动');
        break;

      case 'exec':
        logger.blank();
        logger.title('进入容器');
        execSync(`docker exec -it ${containerName} /bin/bash`, { stdio: 'inherit' });
        break;

      case 'down':
        logger.blank();
        logger.title('停止容器');
        if (await dockerContainerManager.exists(containerName)) {
          await dockerContainerManager.remove(containerName, true);
          logger.success('容器已停止并删除');
        } else {
          logger.info('容器不存在');
        }
        break;

      case 'status':
        logger.blank();
        logger.title('容器状态');
        const running = await dockerContainerManager.isRunning(containerName);
        const exists = await dockerContainerManager.exists(containerName);
        
        if (running) {
          logger.success('容器正在运行');
        } else if (exists) {
          logger.warn('容器已停止');
        } else {
          logger.info('容器不存在');
        }
        
        const imageExists = await dockerImageManager.exists(imageName);
        if (imageExists) {
          logger.success('镜像存在');
        } else {
          logger.error('镜像不存在');
        }
        break;

      case 'remove':
        const { confirm } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirm',
          message: `确定要删除镜像 ${imageName} 吗？`,
          default: false,
        });

        if (confirm) {
          logger.blank();
          logger.title('删除镜像');
          
          // 停止并删除容器
          if (await dockerContainerManager.exists(containerName)) {
            await dockerContainerManager.remove(containerName, true);
          }
          
          // 删除镜像
          await dockerImageManager.remove(imageName);
          
          // 从存储中删除记录
          storage.deleteRecord(record.id);
          
          logger.success('镜像已删除');
        }
        break;
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    }
  }

  // 操作完成后等待用户按回车返回
  await inquirer.prompt({
    type: 'input',
    name: 'continue',
    message: '按回车键返回...',
  });
}

export {
  uiCommand
};
