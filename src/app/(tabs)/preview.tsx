import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import LivePreview from '@/components/LivePreview';
import WebSidebarLayout from '@/components/WebSidebarLayout';
import { useArchitectStore } from '@/state/architect-store';
import { setSecret } from '@/utils/storage';

export default function PreviewScreen() {
  const { config, email, setEmail } = useArchitectStore();
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const preview = useMemo(() => {
    return {
      name: config?.expo.name ?? 'Your App Name',
      slug: config?.expo.slug ?? 'your-app-slug',
      color: config?.expo.splash?.backgroundColor ?? '#2A2A2A',
    };
  }, [config]);

  const notify = useCallback((message: string) => {
    if (Platform.OS === 'web') {
      alert(message);
      return;
    }

    Alert.alert('Expo Architect', message);
  }, []);

  const sendEmail = useCallback(async () => {
    if (!config) {
      setFeedback('Generate app.json first from the Architect tab.');
      return;
    }

    if (!email.trim()) {
      setFeedback('Enter the recipient email address.');
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      await setSecret('lastEmail', email.trim());
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          config,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'Failed to send email via Resend.');
      }

      notify('Email sent via Resend.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected delivery failure.';
      setFeedback(message);
    } finally {
      setSending(false);
    }
  }, [config, email, notify]);

  return (
    <WebSidebarLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Simulated Device Preview</Text>
          <Text style={styles.subtitle}>Powered by `use dom`, so you can pitch visual impact before prebuild.</Text>
          <LivePreview appName={preview.name} slug={preview.slug} backgroundColor={preview.color} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email this config</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
          />
          <Pressable disabled={sending} onPress={sendEmail} style={styles.primaryButton}>
            {sending ? <ActivityIndicator color="#111111" /> : <Text style={styles.primaryLabel}>Email me the config</Text>}
          </Pressable>
          {feedback ? <Text style={styles.error}>{feedback}</Text> : null}
        </View>
      </ScrollView>
    </WebSidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 16,
    minHeight: '100%',
    backgroundColor: '#0A0A0A',
  },
  card: {
    gap: 10,
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
  label: {
    color: '#E5E5E5',
    fontWeight: '700',
  },
  input: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#3F3F3F',
    color: '#F5F5F5',
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  primaryLabel: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#C9C9C9',
    marginTop: 4,
  },
});
