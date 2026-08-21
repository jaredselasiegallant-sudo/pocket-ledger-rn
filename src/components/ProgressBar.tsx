import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  color,
  backgroundColor = colors.surfaceSubtle,
  height = 8,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const fillColor =
    color || (clamped > 0.9 ? colors.expense : clamped > 0.75 ? colors.warning : colors.primary);

  return (
    <View style={[styles.track, { backgroundColor, height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: fillColor,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radii.full,
  },
});
