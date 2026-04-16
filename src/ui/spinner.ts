
import ora from 'ora';

/**
 * 加载动画管理类
 * 封装 ora 库，提供统一的加载状态显示
 */
class Spinner {
  private spinner;

  constructor() {
    this.spinner = ora();
  }

  /**
   * 开始加载动画
   * @param text 加载提示文字
   */
  start(text) {
    this.spinner.start(text);
  }

  /**
   * 更新加载提示文字
   * @param text 新的提示文字
   */
  text(text) {
    this.spinner.text = text;
  }

  /**
   * 显示成功状态
   * @param text 成功提示文字
   */
  succeed(text) {
    this.spinner.succeed(text);
  }

  /**
   * 显示失败状态
   * @param text 失败提示文字
   */
  fail(text) {
    this.spinner.fail(text);
  }

  /**
   * 显示警告状态
   * @param text 警告提示文字
   */
  warn(text) {
    this.spinner.warn(text);
  }

  /**
   * 显示信息状态
   * @param text 信息提示文字
   */
  info(text) {
    this.spinner.info(text);
  }

  /**
   * 停止加载动画
   */
  stop() {
    this.spinner.stop();
  }
}

export default new Spinner();
