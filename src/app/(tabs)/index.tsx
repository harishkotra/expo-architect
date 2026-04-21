import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import VoiceButton from '@/components/VoiceButton';
import WebSidebarLayout from '@/components/WebSidebarLayout';
import { useArchitectStore } from '@/state/architect-store';
import type { GenerateConfigResponse } from '@/types/app-config';
import { setSecret } from '@/utils/storage';

type RecognitionConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { 0?: { transcript?: string } }[] }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

const STARTER_PROMPT =
  "Set orientation to portrait, splash to charcoal gray (#2A2A2A), slug to 'my-travel-app', and include camera + media library permissions.";

const PROMPT_EXAMPLES = [
  "Create a travel journaling app named 'Trail Notes' with portrait mode, splash #2A2A2A, and camera + media library permissions.",
  "Generate config for a finance tracker called 'Ledger Lens' with dark mode UI, slug ledger-lens, and push notification support.",
  "Build a food delivery prototype named 'Bite Run' with landscape orientation, location permission, and splash #111111.",
  "Set up a creator app called 'Clip Forge' with camera, microphone, and media library permissions plus slug clip-forge.",
];

export default function ArchitectScreen() {
  const router = useRouter();
  const { prompt, setPrompt, setGeneration } = useArchitectStore();
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<RecognitionConstructor> | null>(null);

  const canUseSpeech = useMemo(() => {
    if (Platform.OS !== 'web') {
      return false;
    }

    const webWindow = window as BrowserWindow;
    return Boolean(webWindow.SpeechRecognition || webWindow.webkitSpeechRecognition);
  }, []);

  const notify = useCallback((message: string) => {
    if (Platform.OS === 'web') {
      alert(message);
      return;
    }

    Alert.alert('Expo Architect', message);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (!canUseSpeech) {
      notify('Speech recognition is available in web browsers only for this PWA-first demo.');
      return;
    }

    if (listening) {
      stopListening();
      return;
    }

    const webWindow = window as BrowserWindow;
    const Recognition = webWindow.SpeechRecognition || webWindow.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: { results: { 0?: { transcript?: string } }[] }) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript ?? '';
      }
      setPrompt(transcript.trim());
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
      setError('Voice capture failed. You can type the prompt manually.');
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [canUseSpeech, listening, notify, setPrompt, stopListening]);

  const generateConfig = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Add a request first, then generate config.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setSecret('lastPrompt', prompt.trim());
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'Failed to generate app.json');
      }

      const payload = (await response.json()) as GenerateConfigResponse;
      setGeneration(payload.config, payload.source);
      router.push('/preview');
      notify('Config generated. Check Preview and Raw tabs.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected API failure.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [notify, prompt, router, setGeneration]);

  const applyPromptExample = useCallback(
    (example: string) => {
      setPrompt(example);
      setError(null);
    },
    [setPrompt]
  );

  return (
    <WebSidebarLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>Build Expo app.json with plain English</Text>
          <Text style={styles.subtitle}>
            Describe your app requirements, then Expo Architect generates and validates a ready-to-use
            Expo SDK 55 configuration.
          </Text>
          <VoiceButton listening={listening} disabled={loading} onPress={toggleListening} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Architect Prompt</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Describe the app setup you need"
            placeholderTextColor="#8A8A8A"
            multiline
            style={styles.input}
          />
          <Pressable onPress={() => setPrompt(STARTER_PROMPT)} style={styles.ghostButton}>
            <Text style={styles.ghostLabel}>Use Travel App example</Text>
          </Pressable>

          <Pressable onPress={generateConfig} disabled={loading} style={styles.primaryButton}>
            {loading ? <ActivityIndicator color="#E2E8F0" /> : <Text style={styles.primaryLabel}>Generate app.json</Text>}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!canUseSpeech ? (
            <Text style={styles.meta}>Voice input uses browser speech APIs, so this button is active on web only.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>How It Works</Text>
          <Text style={styles.meta}>1. Enter a prompt or record your voice requirement.</Text>
          <Text style={styles.meta}>2. We ground generation with Expo docs and validate JSON.</Text>
          <Text style={styles.meta}>3. Review Preview and Raw tabs, then email the config.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Try These Prompts</Text>
          <View style={styles.examplesWrap}>
            {PROMPT_EXAMPLES.map((example) => (
              <Pressable key={example} onPress={() => applyPromptExample(example)} style={styles.exampleChip}>
                <Text style={styles.exampleText}>{example}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </WebSidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 16,
    backgroundColor: '#0A0A0A',
    minHeight: '100%',
  },
  heroCard: {
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#111111',
  },
  title: {
    color: '#F5F5F5',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#B5B5B5',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#141414',
  },
  label: {
    color: '#E5E5E5',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  input: {
    minHeight: 120,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#3F3F3F',
    color: '#F5F5F5',
    textAlignVertical: 'top',
  },
  ghostButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#575757',
    backgroundColor: '#1A1A1A',
  },
  ghostLabel: {
    color: '#E8E8E8',
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
    marginTop: 6,
  },
  primaryLabel: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#C9C9C9',
    marginTop: 6,
  },
  meta: {
    color: '#AFAFAF',
    fontSize: 12,
    lineHeight: 18,
  },
  examplesWrap: {
    gap: 8,
  },
  exampleChip: {
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  exampleText: {
    color: '#EDEDED',
    lineHeight: 20,
  },
});
