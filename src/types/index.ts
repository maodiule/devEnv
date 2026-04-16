
/**
 * 语言环境配置
 */
export interface LanguageConfig {
  name: string;
  version?: string;
}

/**
 * 卷挂载配置
 */
export interface VolumeConfig {
  host: string;
  container: string;
}

/**
 * 主配置文件结构（简化版）
 */
export interface DevEnvConfig {
  name: string;
  language: LanguageConfig;
  ports?: number[];
  volumes?: VolumeConfig[];
  env?: Record<string, string>;
  packages?: string[];
  workspace?: string;
}


