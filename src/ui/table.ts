
import Table from 'cli-table3';
import chalk from 'chalk';

/**
 * 表格渲染类
 * 提供美观的终端表格输出功能
 */
class TableRenderer {
  /**
   * 创建并渲染表格
   * @param headers 表头数组
   * @param rows 数据行数组
   * @param options 可选配置项
   */
  render(
    headers,
    rows,
    options
  ) {
    const headColor = options?.headColor || 'cyan';
    const table = new Table({
      head: headers.map(h => {
        switch (headColor) {
          case 'cyan': return chalk.cyan(h);
          case 'yellow': return chalk.yellow(h);
          case 'green': return chalk.green(h);
          case 'red': return chalk.red(h);
          default: return chalk.cyan(h);
        }
      }),
      style: {
        head: [],
        border: [options?.borderColor || 'gray'],
        compact: options?.compact ?? false,
      },
    });

    table.push(...rows);
    console.log(table.toString());
  }

  /**
   * 渲染简单的键值对表格
   * @param data 键值对数据
   */
  renderKeyValue(data: Record<string, any>) {
    const table = new Table({
      style: {
        head: [],
        border: ['gray'],
        compact: true,
      },
    });

    Object.entries(data).forEach(([key, value]) => {
      table.push([chalk.yellow(key), value as any]);
    });

    console.log(table.toString());
  }
}

export default new TableRenderer();
