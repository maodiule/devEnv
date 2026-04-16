import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Docker from 'dockerode';

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const docker = new Docker();

const STORAGE_PATH = path.join(process.env.HOME || process.cwd(), '.devenv', 'images.json');

interface ImageRecord {
  id: string;
  name: string;
  tag: string;
  created: string;
  language: string;
  version: string;
  projectName: string;
  containerRunning?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function ensureStorage(): void {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, '[]', 'utf-8');
  }
}

function readImages(): ImageRecord[] {
  try {
    ensureStorage();
    const content = fs.readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('读取镜像记录失败:', error);
    return [];
  }
}

async function checkContainerStatus(containerName: string): Promise<boolean> {
  try {
    const containers = await docker.listContainers();
    return containers.some((container: any) => container.Names?.some((name: string) => name === `/${containerName}`));
  } catch (error) {
    return false;
  }
}

app.get('/api/images', async (req: any, res: any) => {
  try {
    const images = readImages();

    const imagesWithStatus: ImageRecord[] = await Promise.all(
      images.map(async (image: ImageRecord) => {
        const containerName = `devenv-${image.projectName}`;
        const containerRunning = await checkContainerStatus(containerName);

        return {
          ...image,
          containerRunning
        };
      })
    );

    const response: ApiResponse<ImageRecord[]> = {
      success: true,
      data: imagesWithStatus
    };

    res.json(response);
  } catch (error) {
    console.error('获取镜像列表失败:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '获取镜像列表失败'
    };
    res.status(500).json(response);
  }
});

app.post('/api/containers/:id/start', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const images = readImages();
    const image = images.find((img: ImageRecord) => img.id === id);

    if (!image) {
      const response: ApiResponse<null> = {
        success: false,
        error: '镜像不存在'
      };
      return res.status(404).json(response);
    }

    const containerName = `devenv-${image.projectName}`;
    const imageName = `${image.name}:${image.tag}`;

    const containers = await docker.listContainers({ all: true });
    const existingContainer = containers.find((container: any) =>
      container.Names?.some((name: string) => name === `/${containerName}`)
    );

    if (existingContainer) {
      const container = docker.getContainer(existingContainer.Id);
      await container.start();
    } else {
      const createOptions = {
        Image: imageName,
        name: containerName,
        HostConfig: {
          Binds: [`${process.cwd()}:/workspace`],
          RestartPolicy: { Name: 'unless-stopped' }
        },
        WorkingDir: '/workspace',
        Tty: true,
        Cmd: ['/bin/sh']
      };

      const container = await docker.createContainer(createOptions);
      await container.start();
    }

    const response: ApiResponse<null> = {
      success: true,
      message: '容器已启动'
    };

    res.json(response);
  } catch (error) {
    console.error('启动容器失败:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '启动容器失败'
    };
    res.status(500).json(response);
  }
});

app.post('/api/containers/:id/stop', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const images = readImages();
    const image = images.find((img: ImageRecord) => img.id === id);

    if (!image) {
      const response: ApiResponse<null> = {
        success: false,
        error: '镜像不存在'
      };
      return res.status(404).json(response);
    }

    const containerName = `devenv-${image.projectName}`;

    const containers = await docker.listContainers({ all: true });
    const existingContainer = containers.find((container: any) =>
      container.Names?.some((name: string) => name === `/${containerName}`)
    );

    if (existingContainer) {
      const container = docker.getContainer(existingContainer.Id);
      await container.stop();
      await container.remove({ force: true });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: '容器已停止'
    };

    res.json(response);
  } catch (error) {
    console.error('停止容器失败:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '停止容器失败'
    };
    res.status(500).json(response);
  }
});

app.delete('/api/images/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const images = readImages();
    const image = images.find((img: ImageRecord) => img.id === id);

    if (!image) {
      const response: ApiResponse<null> = {
        success: false,
        error: '镜像不存在'
      };
      return res.status(404).json(response);
    }

    // 停止并移除相关容器
    const containerName = `devenv-${image.projectName}`;
    const containers = await docker.listContainers({ all: true });
    const existingContainer = containers.find((container: any) =>
      container.Names?.some((name: string) => name === `/${containerName}`)
    );

    if (existingContainer) {
      const container = docker.getContainer(existingContainer.Id);
      try {
        await container.stop();
      } catch (e) {
        // 容器可能已经停止，忽略错误
      }
      await container.remove({ force: true });
    }

    // 移除镜像
    const imageName = `${image.name}:${image.tag}`;
    try {
      await docker.getImage(imageName).remove({ force: true });
    } catch (e) {
      // 镜像可能已经不存在，忽略错误
    }

    // 从存储中移除记录
    const updatedImages = images.filter((img: ImageRecord) => img.id !== id);
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(updatedImages, null, 2), 'utf-8');

    const response: ApiResponse<null> = {
      success: true,
      message: '镜像已删除'
    };

    res.json(response);
  } catch (error) {
    console.error('删除镜像失败:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '删除镜像失败'
    };
    res.status(500).json(response);
  }
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req: any, res: any) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`访问 http://localhost:${PORT} 查看可视化界面`);
});
