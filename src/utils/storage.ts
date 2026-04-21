import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const WEB_PREFIX = 'expo-architect:';

export async function setSecret(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(`${WEB_PREFIX}${key}`, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function getSecret(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(`${WEB_PREFIX}${key}`);
  }

  return SecureStore.getItemAsync(key);
}

export async function removeSecret(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(`${WEB_PREFIX}${key}`);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
