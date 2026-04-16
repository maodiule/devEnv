
import Docker from 'dockerode';
import fsUtils from '../utils/fs.js';
import DockerClient from './client.js';

/**
 * Docker 容器管理器
 * 负责创建、启动、停止和删除容器
 */
class DockerContainerManager {
  private docker;

  constructor() {
    this.docker = DockerClient.getInstance().getDocker();
  }

  /**
   * 检查容器是否存在
   * @param containerName 容器名称
   * @returns 容器是否存在
   */
  async exists(containerName) {
    try {
      const containers = await this.docker.listContainers({ all: true });
      return containers.some((container) =>
        container.Names?.some((name) => name === `/${containerName}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * 检查容器是否正在运行
   * @param containerName 容器名称
   * @returns 容器是否正在运行
   */
  async isRunning(containerName) {
    try {
      const containers = await this.docker.listContainers();
      return containers.some((container) =>
        container.Names?.some((name) => name === `/${containerName}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * 创建容器
   * @param config 配置对象
   * @param imageName 镜像名称
   * @param containerName 容器名称
   * @param workspace 工作目录
   */
  async create(
    config,
    imageName,
    containerName,
    workspace
  ) {
    const hostPath = fsUtils.getCwd();

    const binds: string[] = [`${hostPath}:${workspace}`];

    if (config.volumes) {
      config.volumes.forEach((vol) => {
        const hostVolPath = fsUtils.resolvePath(vol.host);
        const mode = vol.mode || 'rw';
        binds.push(`${hostVolPath}:${vol.container}:${mode}`);
      });
    }

    const ports: Record<string, Array<{ HostPort: string }>> = {};
    const exposedPorts: Record<string, {}> = {};

    if (config.ports) {
      config.ports.forEach((port) => {
        let hostPort: string;
        let containerPort: string;

        if (typeof port === 'string' && port.includes(':')) {
          // 格式: "hostPort:containerPort"
          const [hp, cp] = port.split(':');
          hostPort = hp;
          containerPort = cp;
        } else {
          // 格式: port (主机和容器使用相同端口)
          hostPort = `${port}`;
          containerPort = `${port}`;
        }

        const portStr = `${containerPort}/tcp`;
        exposedPorts[portStr] = {};
        ports[portStr] = [{ HostPort: hostPort }];
      });
    }

    const env: string[] = [];
    if (config.env) {
      Object.entries(config.env).forEach(([key, value]) => {
        env.push(`${key}=${value}`);
      });
    }

    const restartPolicy = config.container?.restart || 'unless-stopped';
    const tty = config.container?.tty !== false;
    const stdinOpen = config.container?.stdin_open !== false;
    const cmd = config.startCommand ? config.startCommand.split(' ') : ['/bin/sh'];

    const createOptions = {
      Image: imageName,
      name: config.container?.name || containerName,
      HostConfig: {
        Binds: binds,
        PortBindings: ports,
        RestartPolicy: { Name: restartPolicy },
      },
      ExposedPorts: exposedPorts,
      Env: env,
      WorkingDir: workspace,
      Tty: tty,
      StdinOpen: stdinOpen,
      Cmd: cmd,
    };

    return await this.docker.createContainer(createOptions);
  }

  /**
   * 启动容器
   * @param containerName 容器名称
   */
  async start(containerName) {
    const container = this.docker.getContainer(containerName);
    await container.start();
  }

  /**
   * 停止容器
   * @param containerName 容器名称
   */
  async stop(containerName) {
    const container = this.docker.getContainer(containerName);
    await container.stop();
  }

  /**
   * 删除容器
   * @param containerName 容器名称
   * @param removeVolumes 是否删除卷
   */
  async remove(containerName, removeVolumes = false) {
    const container = this.docker.getContainer(containerName);
    await container.remove({ v: removeVolumes, force: true });
  }

  /**
   * 获取容器信息
   * @param containerName 容器名称
   * @returns 容器信息
   */
  async inspect(containerName) {
    const container = this.docker.getContainer(containerName);
    return await container.inspect();
  }

  /**
   * 在容器中执行命令
   * @param containerName 容器名称
   * @param command 命令
   * @param args 命令参数
   */
  async exec(
    containerName,
    command,
    args = []
  ) {
    const container = this.docker.getContainer(containerName);
    const exec = await container.exec({
      Cmd: [command, ...args],
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    await exec.start({ hijack: true, stdin: true });
  }
}

export default new DockerContainerManager();
