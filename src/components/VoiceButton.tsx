import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

type VoiceButtonProps = {
  listening: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function VoiceButton({ listening, disabled, onPress }: VoiceButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!listening) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.glow, { transform: [{ scale: pulse }] }]} />
      <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}>
        <Text style={styles.label}>{listening ? 'Stop' : 'Record'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    width: 92,
    height: 92,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#646464',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
});
