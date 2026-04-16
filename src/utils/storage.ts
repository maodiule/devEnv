
import fs from 'fs';
import path from 'path';

/**
 * 镜像记录接口
 */
export interface ImageRecord {
  id: string;
  name: string;
  tag: string;
  created: string;
  language: string;
  version: string;
  projectName: string;
}

/**
 * 存储管理器
 * 负责保存和管理镜像记录
 */
class StorageManager {
  private storagePath: string;

  constructor() {
    this.storagePath = path.join(process.env.HOME || process.cwd(), '.devenv', 'images.json');
    this.ensureStorage();
  }

  /**
   * 确保存储目录存在
   */
  private ensureStorage(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.storagePath)) {
      fs.writeFileSync(this.storagePath, '[]', 'utf-8');
    }
  }

  /**
   * 读取所有镜像记录
   * @returns 镜像记录数组
   */
  readRecords(): ImageRecord[] {
    try {
      const content = fs.readFileSync(this.storagePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * 保存镜像记录
   * @param record 镜像记录
   */
  saveRecord(record: ImageRecord): void {
    const records = this.readRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    fs.writeFileSync(this.storagePath, JSON.stringify(records, null, 2), 'utf-8');
  }

  /**
   * 删除镜像记录
   * @param id 镜像ID
   */
  deleteRecord(id: string): void {
    const records = this.readRecords();
    const filtered = records.filter(r => r.id !== id);
    fs.writeFileSync(this.storagePath, JSON.stringify(filtered, null, 2), 'utf-8');
  }

  /**
   * 清除所有记录
   */
  clearRecords(): void {
    fs.writeFileSync(this.storagePath, '[]', 'utf-8');
  }

  /**
   * 根据项目名称查找记录
   * @param projectName 项目名称
   * @returns 镜像记录
   */
  findByProject(projectName: string): ImageRecord | undefined {
    const records = this.readRecords();
    return records.find(r => r.projectName === projectName);
  }
}

export default new StorageManager();
