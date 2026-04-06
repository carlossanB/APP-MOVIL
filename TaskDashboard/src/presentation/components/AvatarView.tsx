import React from 'react';
import { requireNativeComponent, Platform, ViewStyle, View, Text, StyleSheet } from 'react-native';

interface AvatarViewNativeProps {
  name: string;
  style?: ViewStyle;
}

// ── Native component (Android only) ─────────────────────────────────────────
const NativeAvatarView = Platform.OS === 'android'
  ? requireNativeComponent<AvatarViewNativeProps>('AvatarView')
  : null;

interface AvatarViewProps {
  name: string;
  style?: ViewStyle;
}

/**
 * AvatarView — TypeScript wrapper around the Kotlin SimpleViewManager.
 * Falls back to a pure-JS circle on non-Android platforms for testing.
 */
export const AvatarView: React.FC<AvatarViewProps> = ({ name, style }) => {
  if (NativeAvatarView) {
    return <NativeAvatarView name={name} style={style} />;
  }
  // JS fallback (non-Android / Storybook)
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
  const color = `hsl(${Math.abs(hashCode(name)) % 360}, 60%, 45%)`;
  return (
    <View style={[styles.fallback, style, { backgroundColor: color }]}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  initials: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
