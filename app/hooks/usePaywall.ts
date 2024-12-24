import { useState } from 'react';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export const usePaywall = () => {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const presentPaywall = async (): Promise<boolean> => {
    try {
      setIsPurchasing(true);
      const paywallResult = await RevenueCatUI.presentPaywall();

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          return true;
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
        default:
          return false;
      }
    } catch (error) {
      console.error('Error presenting paywall:', error);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  const presentPaywallIfNeeded = async (): Promise<boolean> => {
    try {
      setIsPurchasing(true);
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'premium'
      });

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          return true;
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
        default:
          return false;
      }
    } catch (error) {
      console.error('Error presenting paywall:', error);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  return {
    presentPaywall,
    presentPaywallIfNeeded,
    isPurchasing,
  };
}; 