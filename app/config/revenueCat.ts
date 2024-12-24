import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const REVENUE_CAT_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
};

export const configureRevenueCat = () => {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

  if (Platform.OS === 'ios') {
    console.log('Found iOS RevenueCat key, configuring... ')
    Purchases.configure({ apiKey: REVENUE_CAT_KEYS.ios! });
  } else if (Platform.OS === 'android') {
    console.log('Found Android RevenueCat key, configuring...')
    Purchases.configure({ apiKey: REVENUE_CAT_KEYS.android! });
  }
}; 