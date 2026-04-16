
import yaml from 'js-yaml';
import path from 'path';
import { DevEnvConfig } from '../types';
import fsUtils from '../utils/fs.js';
import validateUtils from '../utils/validate.js';

/**
 * 配置加载器
 * 负责加载、解析和验证配置文件
 */
class ConfigLoader {
  private configPath: string;
  private config = null;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(fsUtils.getCwd(), 'devenv.yaml');
  }

  /**
   * 获取配置文件路径
   * @returns 配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 检查配置文件是否存在
   * @returns 配置文件是否存在
   */
  configExists(): boolean {
    return fsUtils.fileExists(this.configPath);
  }

  /**
   * 加载配置文件
   * @returns 配置对象
   */
  load() {
    if (this.config) {
      return this.config;
    }

    if (!this.configExists()) {
      throw new Error(`配置文件不存在: ${this.configPath}`);
    }

    try {
      const content = fsUtils.readFile(this.configPath);
      const config = yaml.load(content);

      const validation = validateUtils.validateConfig(config);
      if (!validation.valid) {
        throw new Error(`配置文件验证失败:\n${validation.errors.join('\n')}`);
      }

      this.config = config;
      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`解析配置文件失败: ${this.configPath}`);
    }
  }

  /**
   * 获取镜像名称
   * @returns 完整的镜像名称
   */
  getImageName(): string {
    const config = this.load();
    const tag = config.language.version || 'latest';
    return `devenv-${config.name}:${tag}`;
  }

  /**
   * 获取容器名称
   * @returns 容器名称
   */
  getContainerName(): string {
    const config = this.load();
    return `devenv-${config.name}`;
  }

  /**
   * 获取工作目录
   * @returns 工作目录路径
   */
  getWorkspace(): string {
    const config = this.load();
    return config.workspace || '/workspace';
  }
}

export default ConfigLoader;
