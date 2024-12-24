import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { AudioRecorder } from '../services/audioRecorder';
import { Alert } from 'react-native';


const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_BASE_URL;
const audioRecorder = new AudioRecorder();

interface WebSocketMessage {
  type: 'event';
  status: 'start_translation';
  source_language: string;
  target_language: string;
}

export interface TranslationChunk {
  id: string;
  status: 'start' | 'streaming' | 'stop' | 'error';
  text: string;
  timestamp: number;
}

let chunkCounter = 0;

export const useWebSocket = () => {
  const { user } = useUser();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingLanguages, setIsSwitchingLanguages] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [translationChunks, setTranslationChunks] = useState<TranslationChunk[]>([]);
  const [hasError, setHasError] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback((sourceLanguage: string, targetLanguage: string) => {
    if (!user?.id) return;
    console.log('Attempting connection to:', WS_BASE_URL);

    setIsConnecting(true);
    setConnectionError(null);
    const ws = new WebSocket(`${WS_BASE_URL}/ws/${user?.id}`);

    const connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        ws.close();
        setIsConnecting(false);
        setConnectionError('Connection timeout. Please try again.');
        Alert.alert(
          'Connection Error',
          'Unable to establish connection. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    }, 10000);

    ws.onopen = async () => {
      clearTimeout(connectionTimeout);
      console.log('WebSocket Connected');
      
      const message: WebSocketMessage = {
        type: 'event',
        status: 'start_translation',
        source_language: sourceLanguage,
        target_language: targetLanguage
      };
      ws.send(JSON.stringify(message));

      await audioRecorder.startRecording((audioData) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(audioData);
        }
      });
    };

    ws.onclose = async () => {
      console.log('WebSocket Disconnected');
      await audioRecorder.stopRecording();
      setIsConnected(false);
      setIsConnecting(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error, 'URL:', `${WS_BASE_URL}/ws/${user?.id}`);
      setIsConnecting(false);
      setConnectionError('Failed to connect to translation service');
      
      Alert.alert(
        'Connection Error',
        'Unable to connect to the translation service. Please try again later.',
        [
          {
            text: 'Retry',
            onPress: () => connect(sourceLanguage, targetLanguage)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        if (data.type === 'event' && data.status === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          setTranslationChunks([]);
          setHasError(false);
        }
        
        if (data.type === 'translation') {
          if (data.status === 'error') {
            setHasError(true);
            Alert.alert(
              'Translation Error',
              data.text,
              [
                {
                  text: 'Try Again',
                  onPress: () => {
                    disconnect();
                    connect(sourceLanguage, targetLanguage);
                  }
                },
                {
                  text: 'Cancel',
                  onPress: () => disconnect(),
                  style: 'cancel'
                }
              ]
            );
            return;
          }

          const newChunk: TranslationChunk = {
            id: `chunk-${chunkCounter++}-${Date.now()}`,
            status: data.status,
            text: data.text,
            timestamp: Date.now()
          };
          setTranslationChunks(prev => [...prev, newChunk]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    setSocket(ws);
    return ws;
  }, [user?.id, isConnected]);

  const disconnect = useCallback(async (isSwitching: boolean = false) => {
    if (socket) {
      if (isSwitching) {
        setIsSwitchingLanguages(true);
      }
      await audioRecorder.stopRecording();
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    isConnecting,
    isSwitchingLanguages,
    setIsSwitchingLanguages,
    translatedText,
    connect,
    disconnect,
    translationChunks,
    hasError,
    connectionError,
    setConnectionError,
  };
}; 