
import Docker from 'dockerode';
import path from 'path';
import os from 'os';

import fsUtils from '../utils/fs.js';
import DockerClient from './client.js';

/**
 * 语言环境预设配置
 */
const LANGUAGE_PRESETS: Record<
  string,
  { baseImage: string; defaultTag: string }
> = {
  node: {
    baseImage: 'node',
    defaultTag: '20-slim',
  },
  python: {
    baseImage: 'python',
    defaultTag: '3.12-slim',
  },
  java: {
    baseImage: 'eclipse-temurin',
    defaultTag: '21-jdk',
  },
  go: {
    baseImage: 'golang',
    defaultTag: '1.22-bookworm',
  },
  rust: {
    baseImage: 'rust',
    defaultTag: '1.76-slim',
  },
  php: {
    baseImage: 'php',
    defaultTag: '8.3-cli',
  },
  ruby: {
    baseImage: 'ruby',
    defaultTag: '3.3-slim',
  },
};

/**
 * Docker 镜像管理器
 * 负责构建、检查和删除 Docker 镜像
 */
class DockerImageManager {
  private docker;
  private tempDir;

  constructor() {
    this.docker = DockerClient.getInstance().getDocker();
    this.tempDir = path.join(os.tmpdir(), 'devenv');
  }

  /**
   * 获取语言预设配置
   * @param config DevEnv 配置
   * @returns 语言预设配置
   */
  private getLanguagePreset(config) {
    const preset = LANGUAGE_PRESETS[config.language.name];
    if (!preset) {
      throw new Error(`不支持的语言: ${config.language.name}`);
    }
    return preset;
  }

  /**
   * 检测包管理器
   * @param tag 镜像标签
   * @returns 包管理器名称
   */
  private detectPackageManager(tag: string): string {
    if (tag.includes('alpine')) {
      return 'apk';
    }
    return 'apt';
  }

  /**
   * 生成 Dockerfile 内容
   * @param config 配置对象
   * @returns Dockerfile 内容
   */
  private generateDockerfile(config) {
    const preset = this.getLanguagePreset(config);
    const tag = config.language.version || preset.defaultTag;
    const baseImage = `${preset.baseImage}:${tag}`;
    const packageManager = this.detectPackageManager(tag);

    let dockerfile = `FROM ${baseImage}\n\n`;
    dockerfile += '# 设置工作目录\n';
    const workspace = config.workspace || '/workspace';
    dockerfile += `WORKDIR ${workspace}\n\n`;

    // 合并用户指定的包和默认包（包括 bash）
    const defaultPackages = ['bash'];
    const userPackages = config.packages || [];
    const allPackages = [...new Set([...defaultPackages, ...userPackages])];

    if (allPackages.length > 0) {
      dockerfile += '# 安装系统包\n';
      if (packageManager === 'apt') {
        dockerfile += 'RUN apt-get update && apt-get install -y \\\n';
        allPackages.forEach((pkg, index) => {
          const suffix = index === allPackages.length - 1 ? '' : ' \\\n';
          dockerfile += `  ${pkg}${suffix}`;
        });
        dockerfile += '\n';
        dockerfile += 'RUN rm -rf /var/lib/apt/lists/*\n';
      } else if (packageManager === 'apk') {
        dockerfile += 'RUN apk add --no-cache \\\n';
        allPackages.forEach((pkg, index) => {
          const suffix = index === allPackages.length - 1 ? '' : ' \\\n';
          dockerfile += `  ${pkg}${suffix}`;
        });
        dockerfile += '\n';
      }
      dockerfile += '\n';
    }

    if (config.env && Object.keys(config.env).length > 0) {
      dockerfile += '# 设置环境变量\n';
      Object.entries(config.env).forEach(([key, value]) => {
        dockerfile += `ENV ${key}="${value}"\n`;
      });
      dockerfile += '\n';
    }

    return dockerfile;
  }

  /**
   * 检查镜像是否存在
   * @param imageName 镜像名称
   * @returns 镜像是否存在
   */
  async exists(imageName) {
    try {
      const images = await this.docker.listImages();
      return images.some((image) =>
        image.RepoTags?.some((tag) => tag === imageName)
      );
    } catch {
      return false;
    }
  }

  /**
   * 构建 Docker 镜像
   * @param config 配置对象
   * @param imageName 镜像名称
   * @param onProgress 进度回调函数
   */
  async build(
    config,
    imageName,
    onProgress
  ) {
    const dockerfileContent = this.generateDockerfile(config);
    const dockerfilePath = path.join(this.tempDir, 'Dockerfile');

    if (!fsUtils.dirExists(this.tempDir)) {
      fsUtils.writeFile(dockerfilePath, dockerfileContent);
    } else {
      fsUtils.writeFile(dockerfilePath, dockerfileContent);
    }

    return new Promise((resolve, reject) => {
      this.docker.buildImage(
        {
          context: this.tempDir,
          src: ['Dockerfile'],
        },
        { t: imageName },
        (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          if (!stream) {
            reject(new Error('构建流未创建'));
            return;
          }

          this.docker.modem.followProgress(
            stream,
            (err, output) => {
              if (err) {
                reject(err);
              } else {
                resolve(undefined);
              }
            },
            (event) => {
              if (onProgress && event.stream) {
                onProgress(event.stream.trim());
              }
            }
          );
        }
      );
    });
  }

  /**
   * 删除 Docker 镜像
   * @param imageName 镜像名称
   */
  async remove(imageName) {
    const image = this.docker.getImage(imageName);
    await image.remove();
  }
}

export default new DockerImageManager();
