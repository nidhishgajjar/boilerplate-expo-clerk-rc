import React, { useEffect, useRef, useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { AudioDevice } from '../hooks/useAudioDevices'
import { useWebSocket, TranslationChunk } from '../hooks/useWebSocket'
import { SelectLanguages, Language } from './SelectLanguages'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { WaveformAnimation } from "./WaveformAnimation";


interface TranslationProps {
  devices: AudioDevice[]
  currentDevice: AudioDevice
  onDeviceChange: (device: AudioDevice) => void
  onMicPress: () => void
}

type OpacityLevel = 1 | 0.75 | 0.3;

const STORAGE_KEYS = {
  SOURCE_LANGUAGE: 'selected_source_language',
  TARGET_LANGUAGE: 'selected_target_language',
};

export const Translation = ({ 
  devices,
  currentDevice,
  onDeviceChange,
  onMicPress,
}: TranslationProps) => {
  const { 
    connect, 
    disconnect, 
    isConnected, 
    isConnecting, 
    isSwitchingLanguages,
    setIsSwitchingLanguages,
    translationChunks,
    hasError,
    connectionError,
  } = useWebSocket();
  const [sourceLanguage, setSourceLanguage] = React.useState({ code: 'en', name: 'English' });
  const [targetLanguage, setTargetLanguage] = React.useState({ code: 'es', name: 'Spanish' });
  const scrollViewRef = useRef<ScrollView>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastSequenceId, setLastSequenceId] = useState<string | null>(null);
  const [isManualScrolling, setIsManualScrolling] = useState(false);

  // Load saved languages on mount
  useEffect(() => {
    loadSavedLanguages();
  }, []);

  const loadSavedLanguages = async () => {
    try {
      const savedSourceLang = await AsyncStorage.getItem(STORAGE_KEYS.SOURCE_LANGUAGE);
      const savedTargetLang = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
      
      if (savedSourceLang) {
        setSourceLanguage(JSON.parse(savedSourceLang));
      }
      if (savedTargetLang) {
        setTargetLanguage(JSON.parse(savedTargetLang));
      }
    } catch (error) {
      console.error('Error loading saved languages:', error);
    }
  };

  const handleSourceLanguageChange = async (language: Language) => {
    setSourceLanguage(language);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SOURCE_LANGUAGE, JSON.stringify(language));
    } catch (error) {
      console.error('Error saving source language:', error);
    }
  };

  const handleTargetLanguageChange = async (language: Language) => {
    setTargetLanguage(language);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, JSON.stringify(language));
    } catch (error) {
      console.error('Error saving target language:', error);
    }
  };

  const handleMicPress = async () => {
    if (isConnected) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      disconnect();
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      connect(sourceLanguage.code, targetLanguage.code);
    }
    onMicPress();
  };

  const handleLanguageSwitch = async (newSource: Language, newTarget: Language) => {
    try {
      if (isConnected) {
        setIsSwitchingLanguages(true);
        await disconnect();
        await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
      }

      setSourceLanguage(newSource);
      setTargetLanguage(newTarget);
      
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.SOURCE_LANGUAGE, JSON.stringify(newSource)),
        AsyncStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, JSON.stringify(newTarget))
      ]);

      if (isConnected) {
        await connect(newSource.code, newTarget.code);
      }
    } catch (error) {
      console.error('Error during language switch:', error);
    } finally {
      if (isConnected) {
        setIsSwitchingLanguages(false);
      }
    }
  };

  // Handle scroll events to detect manual scrolling
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
    
    if (isAtBottom) {
      setAutoScroll(true);
      setIsManualScrolling(false);
    } else {
      setAutoScroll(false);
      setIsManualScrolling(true);
    }
  };

  // Detect sequence completion and force scroll
  useEffect(() => {
    const lastSequence = translationChunks[translationChunks.length - 1];
    if (lastSequence?.status === 'stop' && lastSequence.id !== lastSequenceId) {
      setLastSequenceId(lastSequence.id);
      // Force scroll to bottom with a slight delay to ensure content is rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [translationChunks]);

  // Existing scroll effect for continuous updates
  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [translationChunks, autoScroll]);

  const getSequenceOpacity = (index: number, totalSequences: number): OpacityLevel => {
    if (isManualScrolling) return 1;
    
    const position = totalSequences - 1 - index;
    if (position === 0) return 1;
    if (position === 1) return 0.75;
    return 0.3;
  };

  const renderTranslations = () => {
    if (!translationChunks.length) {
      return (
        <View style={styles.emptyState}>
          {hasError || connectionError ? (
            <Text style={styles.emptyStateText}>
              {connectionError || 'An error occurred. Please try again.'}
            </Text>
          ) : (
            <WaveformAnimation />
          )}
        </View>
      );
    }

    // Group chunks by sequence
    const sequences: TranslationChunk[][] = [];
    let currentSequence: TranslationChunk[] = [];

    translationChunks.forEach(chunk => {
      if (chunk.status === 'start') {
        if (currentSequence.length > 0) {
          sequences.push(currentSequence);
        }
        currentSequence = [chunk];
      } else {
        currentSequence.push(chunk);
        if (chunk.status === 'stop') {
          sequences.push(currentSequence);
          currentSequence = [];
        }
      }
    });

    // Add the last sequence if it's still in progress
    if (currentSequence.length > 0) {
      sequences.push(currentSequence);
    }

    return sequences
      .map((sequence, sequenceIndex) => {
        const streamingText = sequence
          .filter(chunk => chunk.status === 'streaming')
          .map(chunk => chunk.text)
          .join('');

        if (!streamingText) return null;

        const opacity = getSequenceOpacity(sequenceIndex, sequences.length);

        return (
          <View 
            key={`sequence-${sequenceIndex}-${sequence[0].id}`} 
            style={[
              styles.translationSequence,
              {
                backgroundColor: `rgba(240, 240, 240, ${opacity})`,
              }
            ]}
          >
            <Text style={[
              styles.transcriptText,
              { opacity }
            ]}>
              {streamingText}
            </Text>
          </View>
        );
      })
      .filter(Boolean);
  };

  const renderContent = () => {
    if (isConnecting || isSwitchingLanguages) {
      return (
        <View style={styles.micButton}>
          <ActivityIndicator size="large" color="#666" />
          {isConnecting && (
            <Text style={styles.connectingText}>
              Connecting...
            </Text>
          )}
        </View>
      );
    }
    
    if (isConnected) {
      return (
        <View style={styles.connectedContainer}>
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollContainer}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
            onContentSizeChange={() => {
              if (autoScroll || translationChunks[translationChunks.length - 1]?.status === 'stop') {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              }
            }}
          >
            {renderTranslations()}
          </ScrollView>
          <View style={styles.stopContainer}>
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={handleMicPress}
            >
              <Ionicons name="stop-circle" size={24} color="#ff0000" />
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.micButton}
        onPress={handleMicPress}
        disabled={isConnecting}
      >
        <MaterialIcons 
          name="mic" 
          size={32} 
          color="#000"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      <View style={styles.languageSelectorWrapper}>
        <SelectLanguages
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguageChange={handleSourceLanguageChange}
          onTargetLanguageChange={handleTargetLanguageChange}
          isConnected={isConnected}
          onLanguageSwitch={handleLanguageSwitch}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F7F8FA',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 200,
  },
  languageSelectorWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 150,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 140,
  },
  stopContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  stopText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff0000',
    marginLeft: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#FFF0F0',
    width: '100%',
  },
  connectedContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
    minHeight: 100,
  },
  translationSequence: {
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    maxWidth: '100%',
  },
  transcriptText: {
    fontSize: 24,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'Urbanist',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Urbanist',
  },
  connectingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Urbanist',
  },
}) 