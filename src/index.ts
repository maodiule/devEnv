
import { Command } from 'commander';
import { initCommand } from './scripts/init';
import { buildCommand } from './scripts/build';
import { upCommand } from './scripts/up';
import { execCommand } from './scripts/exec';
import { downCommand } from './scripts/down';
import { statusCommand } from './scripts/status';
import { removeCommand } from './scripts/remove';
import { uiCommand } from './scripts/ui';
import { webCommand } from './scripts/web';
import logger from './ui/logger';
import spinner from './ui/spinner';

const program = new Command();

program
  .name('devenv')
  .description('一键 Docker 开发环境管理工具')
  .version('1.0.0');

program
  .command('init')
  .description('初始化配置文件')
  .argument('[path]', '配置文件路径，默认为 ./devenv.yaml')
  .option('-c, --config <path>', '指定配置文件路径')
  .action(async (path: string | undefined, options: { config?: string }) => {
    try {
      await initCommand(path || options.config);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('build')
  .description('构建 Docker 镜像')
  .option('-f, --force', '强制重新构建镜像')
  .option('-c, --config <path>', '指定配置文件路径')
  .action(async (options: { force?: boolean; config?: string }) => {
    try {
      await buildCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('up')
  .description('启动开发环境')
  .option('-b, --build', '构建镜像后再启动')
  .option('-c, --config <path>', '指定配置文件路径')
  .action(async (options: { build?: boolean; config?: string }) => {
    try {
      await upCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('exec')
  .description('进入容器或执行命令')
  .argument('[command...]', '要执行的命令，不指定则进入交互式 shell')
  .option('-c, --config <path>', '指定配置文件路径')
  .action(async (args: string[], options: { config?: string }) => {
    try {
      await execCommand(args, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('down')
  .description('停止并删除容器')
  .option('-v, --volumes', '同时删除关联的数据卷')
  .option('-c, --config <path>', '指定配置文件路径')
  .action(async (options: { volumes?: boolean; config?: string }) => {
    try {
      await downCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('status')
  .description('查看开发环境状态')
  .option('-c, --config <path>', '指定配置文件路径')
  .action(async (options: { config?: string }) => {
    try {
      await statusCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('remove')
  .description('删除 Docker 镜像')
  .argument('[id]', '镜像 ID')
  .option('-c, --config <path>', '指定配置文件路径')
  .option('-a, --all', '删除所有镜像')
  .action(async (id: string | undefined, options: { config?: string; all?: boolean }) => {
    try {
      await removeCommand(id, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('ui')
  .description('启动可视化界面')
  .action(async () => {
    try {
      await uiCommand();
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('web')
  .description('启动Web服务')
  .action(async () => {
    try {
      await webCommand();
    } catch (error) {
      handleError(error);
    }
  });

function handleError(error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error('发生未知错误');
  }
  process.exit(1);
}

program.parseAsync(process.argv).catch(handleError);
