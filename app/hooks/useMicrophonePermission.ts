import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export const useMicrophonePermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAndRequestPermission = async () => {
    try {
      setIsLoading(true);
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setHasPermission(true);
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    } catch (error) {
      console.error('Error handling microphone permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAndRequestPermission();
  }, []);

  return {
    hasPermission,
    isLoading,
    checkAndRequestPermission
  };
}; 