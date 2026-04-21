import * as Clipboard from 'expo-clipboard';
import React, { useCallback } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import WebSidebarLayout from '@/components/WebSidebarLayout';
import { useArchitectStore } from '@/state/architect-store';

export default function RawCodeScreen() {
  const { rawConfig, source } = useArchitectStore();

  const copy = useCallback(async () => {
    if (!rawConfig) {
      return;
    }

    await Clipboard.setStringAsync(rawConfig);
    if (Platform.OS === 'web') {
      alert('Copied app.json to clipboard.');
      return;
    }

    Alert.alert('Expo Architect', 'Copied app.json to clipboard.');
  }, [rawConfig]);

  return (
    <WebSidebarLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Generated app.json</Text>
          <Text style={styles.subtitle}>
            {source ? `Grounded generation source: ${source}` : 'Generate config from Architect tab to populate this view.'}
          </Text>

          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{rawConfig || '{\n  "expo": { ... }\n}'}</Text>
          </View>

          <Pressable onPress={copy} disabled={!rawConfig} style={[styles.copyButton, !rawConfig && styles.disabled]}>
            <Text style={styles.copyLabel}>Copy JSON</Text>
          </Pressable>
        </View>
      </ScrollView>
    </WebSidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minHeight: '100%',
    backgroundColor: '#0A0A0A',
  },
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#141414',
  },
  title: {
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#B5B5B5',
    lineHeight: 20,
  },
  codeBlock: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#444444',
    padding: 12,
    backgroundColor: '#0D0D0D',
  },
  codeText: {
    color: '#F5F5F5',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      default: 'monospace',
    }),
    fontSize: 12,
    lineHeight: 18,
  },
  copyButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  disabled: {
    opacity: 0.45,
  },
  copyLabel: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
});
