import * as Haptics from 'expo-haptics';

export const softHaptics = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const mediumHaptics = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const heavyHaptics = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}; 