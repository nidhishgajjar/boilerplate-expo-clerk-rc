import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export interface AudioDevice {
  id: string;
  name: string;
  type: 'built-in' | 'bluetooth' | 'airpods';
}

export const useAudioDevices = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<AudioDevice>({
    id: 'built-in',
    name: 'iPhone',
    type: 'built-in'
  });

  useEffect(() => {
    const getAvailableDevices = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { granted } = await Audio.requestPermissionsAsync();
        if (granted) {
          // For now, we only have iPhone as a guaranteed device
          setDevices([{
            id: 'built-in',
            name: 'iPhone',
            type: 'built-in'
          }]);
        }
      } catch (error) {
        console.error('Error getting audio devices:', error);
      }
    };

    getAvailableDevices();
  }, []);

  return {
    devices,
    currentDevice,
    setCurrentDevice
  };
}; 