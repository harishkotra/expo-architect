export type Orientation = 'default' | 'portrait' | 'landscape';

export type GeneratedExpoConfig = {
  name: string;
  slug: string;
  version?: string;
  orientation?: Orientation;
  icon?: string;
  userInterfaceStyle?: 'automatic' | 'light' | 'dark';
  splash?: {
    image?: string;
    resizeMode?: 'contain' | 'cover' | 'native';
    backgroundColor?: string;
  };
  ios?: {
    supportsTablet?: boolean;
    bundleIdentifier?: string;
    infoPlist?: Record<string, unknown>;
  };
  android?: {
    package?: string;
    permissions?: string[];
    adaptiveIcon?: {
      foregroundImage?: string;
      backgroundColor?: string;
    };
  };
  web?: {
    bundler?: 'metro';
    output?: 'server' | 'static';
    favicon?: string;
    backgroundColor?: string;
  };
  plugins?: (string | [string, Record<string, unknown>])[];
  extra?: Record<string, unknown>;
};

export type GeneratedAppJson = {
  expo: GeneratedExpoConfig;
};

export type GenerateConfigResponse = {
  config: GeneratedAppJson;
  source: 'openai' | 'anthropic';
};
