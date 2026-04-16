
import chalk from 'chalk';

/**
 * 日志输出类
 * 提供统一的终端日志输出功能，支持多种颜色和格式
 */
class Logger {
  /**
   * 输出信息日志（蓝色）
   * @param message 日志消息
   */
  info(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  /**
   * 输出成功日志（绿色）
   * @param message 日志消息
   */
  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  /**
   * 输出警告日志（黄色）
   * @param message 日志消息
   */
  warn(message: string): void {
    console.log(chalk.yellow(`⚠ ${message}`));
  }

  /**
   * 输出错误日志（红色）
   * @param message 日志消息
   */
  error(message: string): void {
    console.error(chalk.red(`✗ ${message}`));
  }

  /**
   * 输出普通文本
   * @param message 文本内容
   */
  log(message: string): void {
    console.log(message);
  }

  /**
   * 输出空行
   */
  blank(): void {
    console.log();
  }

  /**
   * 输出分隔线
   * @param char 分隔线字符，默认为 '-'
   * @param length 分隔线长度，默认为 50
   */
  separator(char: string = '-', length: number = 50): void {
    console.log(chalk.gray(char.repeat(length)));
  }

  /**
   * 输出标题
   * @param title 标题内容
   */
  title(title: string): void {
    this.blank();
    console.log(chalk.bold.cyan(title));
    this.separator('=', 40);
  }
}

export default new Logger();
