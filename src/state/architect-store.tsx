import React, { createContext, useContext, useMemo, useState } from 'react';

import type { GeneratedAppJson } from '@/types/app-config';
import { prettyConfig } from '@/utils/validate-config';

type ArchitectContextValue = {
  prompt: string;
  setPrompt: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  config: GeneratedAppJson | null;
  rawConfig: string;
  source: string | null;
  setGeneration: (config: GeneratedAppJson, source: string) => void;
};

const ArchitectContext = createContext<ArchitectContextValue | null>(null);

export function ArchitectProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState('');
  const [email, setEmail] = useState('');
  const [config, setConfig] = useState<GeneratedAppJson | null>(null);
  const [rawConfig, setRawConfig] = useState('');
  const [source, setSource] = useState<string | null>(null);

  const value = useMemo<ArchitectContextValue>(
    () => ({
      prompt,
      setPrompt,
      email,
      setEmail,
      config,
      rawConfig,
      source,
      setGeneration: (nextConfig, nextSource) => {
        setConfig(nextConfig);
        setRawConfig(prettyConfig(nextConfig));
        setSource(nextSource);
      },
    }),
    [config, email, prompt, rawConfig, source]
  );

  return <ArchitectContext.Provider value={value}>{children}</ArchitectContext.Provider>;
}

export function useArchitectStore() {
  const value = useContext(ArchitectContext);
  if (!value) {
    throw new Error('useArchitectStore must be used inside ArchitectProvider');
  }

  return value;
}
