
import { DevEnvConfig } from '../types/index.js';

/**
 * 支持的语言列表
 */
const SUPPORTED_LANGUAGES = ['node', 'python', 'java', 'go', 'rust', 'php', 'ruby'];

/**
 * 验证工具类
 * 提供配置验证等功能
 */
class ValidateUtils {
  /**
   * 验证配置文件
   * @param config 配置对象
   * @returns 验证结果，包含错误信息数组
   */
  validateConfig(config) {
    const errors: string[] = [];

    if (!config.name) {
      errors.push('配置文件缺少必填项: name');
    }

    if (!config.language) {
      errors.push('配置文件缺少必填项: language');
    } else {
      if (!config.language.name) {
        errors.push('配置文件缺少必填项: language.name');
      } else if (!SUPPORTED_LANGUAGES.includes(config.language.name)) {
        errors.push(
          `不支持的语言: ${config.language.name}。支持的语言有: ${SUPPORTED_LANGUAGES.join(', ')}`
        );
      }
    }

    if (config.ports && !Array.isArray(config.ports)) {
      errors.push('ports 必须是数组');
    }

    if (config.volumes && !Array.isArray(config.volumes)) {
      errors.push('volumes 必须是数组');
    } else if (config.volumes) {
      config.volumes.forEach((volume, index) => {
        if (!volume.host) {
          errors.push(`volumes[${index}] 缺少必填项: host`);
        }
        if (!volume.container) {
          errors.push(`volumes[${index}] 缺少必填项: container`);
        }
        if (volume.mode && !['rw', 'ro'].includes(volume.mode)) {
          errors.push(`volumes[${index}].mode 必须是 rw 或 ro`);
        }
      });
    }

    if (config.env && typeof config.env !== 'object') {
      errors.push('env 必须是对象');
    }

    if (config.packages && !Array.isArray(config.packages)) {
      errors.push('packages 必须是数组');
    }

    if (config.network && typeof config.network !== 'object') {
      errors.push('network 必须是对象');
    }

    if (config.container && typeof config.container !== 'object') {
      errors.push('container 必须是对象');
    } else if (config.container) {
      if (config.container.restart && !['no', 'always', 'on-failure', 'unless-stopped'].includes(config.container.restart)) {
        errors.push('container.restart 必须是 no, always, on-failure 或 unless-stopped');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查 Docker 是否可用
   * @returns Docker 是否可用
   */
  async isDockerAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync('docker --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

export default new ValidateUtils();
