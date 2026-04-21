import type { GeneratedAppJson } from '@/types/app-config';

const COLOR_HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseJsonPayload(payload: string) {
  const fenced = payload.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : payload);
}

export function parseAndValidateConfig(payload: string): GeneratedAppJson {
  const parsed = parseJsonPayload(payload) as Partial<GeneratedAppJson>;

  if (!parsed || typeof parsed !== 'object' || !parsed.expo) {
    throw new Error('Model output must include a top-level expo object.');
  }

  const { expo } = parsed;
  if (!expo.name || typeof expo.name !== 'string') {
    throw new Error('expo.name must be a string.');
  }

  const slug = typeof expo.slug === 'string' && expo.slug.length > 0 ? expo.slug : toSlug(expo.name);
  if (!slug) {
    throw new Error('expo.slug is missing and could not be derived from expo.name.');
  }

  const next: GeneratedAppJson = {
    expo: {
      name: expo.name,
      slug,
      orientation: expo.orientation ?? 'portrait',
      version: expo.version ?? '1.0.0',
      userInterfaceStyle: expo.userInterfaceStyle ?? 'automatic',
      splash: expo.splash ?? { backgroundColor: '#1F1F1F' },
      ios: expo.ios,
      android: expo.android,
      web: {
        bundler: 'metro',
        output: 'server',
        favicon: './assets/images/favicon.png',
        ...expo.web,
      },
      plugins: expo.plugins,
      extra: expo.extra,
    },
  };

  const splashColor = next.expo.splash?.backgroundColor;
  if (splashColor && !COLOR_HEX.test(splashColor)) {
    throw new Error('expo.splash.backgroundColor must be a hex color like #1F1F1F.');
  }

  return next;
}

export function prettyConfig(config: GeneratedAppJson) {
  return JSON.stringify(config, null, 2);
}
