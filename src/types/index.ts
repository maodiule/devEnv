
/**
 * 语言环境配置
 */
export interface LanguageConfig {
  name: string;
  version?: string;
  packageManager?: string;
}

/**
 * 卷挂载配置
 */
export interface VolumeConfig {
  host: string;
  container: string;
  mode?: 'rw' | 'ro';
}

/**
 * 网络配置
 */
export interface NetworkConfig {
  name?: string;
  driver?: string;
}

/**
 * 容器配置
 */
export interface ContainerConfig {
  name?: string;
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  tty?: boolean;
  stdin_open?: boolean;
}

/**
 * 主配置文件结构
 */
export interface DevEnvConfig {
  name: string;
  language: LanguageConfig;
  ports?: (number | string)[];
  volumes?: VolumeConfig[];
  env?: Record<string, string>;
  packages?: string[];
  workspace?: string;
  startCommand?: string;
  buildCommand?: string;
  network?: NetworkConfig;
  container?: ContainerConfig;
}


