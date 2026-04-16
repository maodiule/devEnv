
import Docker from 'dockerode';

/**
 * Docker 客户端
 * 单例模式，提供 Docker API 连接
 */
class DockerClient {
  private static instance;
  private docker;

  private constructor() {
    this.docker = new Docker();
  }

  /**
   * 获取 DockerClient 实例
   * @returns DockerClient 单例
   */
  static getInstance() {
    if (!DockerClient.instance) {
      DockerClient.instance = new DockerClient();
    }
    return DockerClient.instance;
  }

  /**
   * 获取 Dockerode 实例
   * @returns Dockerode 实例
   */
  getDocker() {
    return this.docker;
  }

  /**
   * 检查 Docker 是否可用
   * @returns Docker 是否可用
   */
  async isAvailable() {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }
}

export default DockerClient;
