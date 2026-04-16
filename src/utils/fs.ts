
import fs from 'fs';
import path from 'path';

/**
 * 文件系统工具类
 * 提供常用的文件系统操作方法
 */
class FsUtils {
  /**
   * 检查文件是否存在
   * @param filePath 文件路径
   * @returns 文件是否存在
   */
  fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * 检查目录是否存在
   * @param dirPath 目录路径
   * @returns 目录是否存在
   */
  dirExists(dirPath: string): boolean {
    try {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 读取文件内容
   * @param filePath 文件路径
   * @param encoding 文件编码，默认为 utf-8
   * @returns 文件内容
   */
  readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
    return fs.readFileSync(filePath, encoding);
  }

  /**
   * 写入文件内容
   * @param filePath 文件路径
   * @param content 文件内容
   */
  writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!this.dirExists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * 复制文件
   * @param srcPath 源文件路径
   * @param destPath 目标文件路径
   */
  copyFile(srcPath: string, destPath: string): void {
    const dir = path.dirname(destPath);
    if (!this.dirExists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(srcPath, destPath);
  }

  /**
   * 删除文件
   * @param filePath 文件路径
   */
  deleteFile(filePath: string): void {
    if (this.fileExists(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * 获取当前工作目录
   * @returns 当前工作目录路径
   */
  getCwd(): string {
    return process.cwd();
  }

  /**
   * 解析绝对路径
   * @param filePath 文件路径
   * @returns 绝对路径
   */
  resolvePath(filePath: string): string {
    return path.resolve(this.getCwd(), filePath);
  }
}

export default new FsUtils();
