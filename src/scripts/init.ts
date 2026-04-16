
import path from 'path';
import ConfigLoader from '../config/loader.js';
import logger from '../ui/logger.js';
import fsUtils from '../utils/fs.js';

/**
 * 初始化命令
 * 生成示例配置文件
 */
async function initCommand(configPath?: string): Promise<void> {
  const loader = new ConfigLoader(configPath);
  const targetPath = loader.getConfigPath();

  if (loader.configExists()) {
    logger.warn(`配置文件已存在: ${targetPath}`);
    logger.info('如需重新生成，请先删除现有配置文件');
    return;
  }

  const templateContent = `# DevEnv 配置文件 - 简单版
# 项目名称
name: my-project

# 开发语言环境（必选）
# 支持的语言: node, python, java, go, rust, php, ruby
language:
  name: node
  version: "20"

# 端口映射（可选）
ports:
  - 3000
  - 8080

# 卷挂载（可选）
volumes:
  - host: ~/.ssh
    container: /root/.ssh

# 环境变量（可选）
env:
  NODE_ENV: development
  EDITOR: vim

# 额外安装的系统包（可选）
packages:
  - git
  - curl
  - vim

# 工作目录（可选，默认为 /workspace）
workspace: /workspace
`;

  fsUtils.writeFile(targetPath, templateContent);
  logger.success(`配置文件已创建: ${targetPath}`);
  logger.info('请根据您的项目需求编辑此配置文件');
  logger.blank();
  logger.info('支持的语言环境:');
  logger.log('  - node    (Node.js)');
  logger.log('  - python  (Python)');
  logger.log('  - java    (Java)');
  logger.log('  - go      (Go)');
  logger.log('  - rust    (Rust)');
  logger.log('  - php     (PHP)');
  logger.log('  - ruby    (Ruby)');
  logger.blank();
  logger.info('接下来的步骤:');
  logger.log('  1. 编辑 devenv.yaml 配置您的开发环境');
  logger.log('  2. 运行 "devenv build" 构建 Docker 镜像');
  logger.log('  3. 运行 "devenv up" 启动开发环境');
  logger.log('  4. 运行 "devenv exec" 进入容器');
}

export {
  initCommand
};
