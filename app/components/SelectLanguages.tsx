import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  SafeAreaView,
  Animated,
  TextInput
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface Language {
  code: string;
  name: string;
}

interface SelectLanguagesProps {
  sourceLanguage: Language;
  targetLanguage: Language;
  onSourceLanguageChange: (language: Language) => void;
  onTargetLanguageChange: (language: Language) => void;
  isConnected: boolean;
  onLanguageSwitch?: (newSource: Language, newTarget: Language) => Promise<void>;
}

const LANGUAGES: Language[] = [
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'zh-HK', name: 'Chinese (Cantonese)' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'nl-BE', name: 'Dutch (Flemish)' },
  { code: 'en', name: 'English' },
  { code: 'en-AU', name: 'English (Australian)' },
  { code: 'en-GB', name: 'English (British)' },
  { code: 'en-IN', name: 'English (Indian)' },
  { code: 'en-NZ', name: 'English (New Zealand)' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fr-CA', name: 'French (Canadian)' },
  { code: 'de', name: 'German' },
  { code: 'de-CH', name: 'German (Swiss)' },
  { code: 'el', name: 'Greek' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'ms', name: 'Malay' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pt-BR', name: 'Portuguese (Brazilian)' },
  { code: 'pt-PT', name: 'Portuguese (European)' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'es', name: 'Spanish' },
  { code: 'es-419', name: 'Spanish (Latin American)' },
  { code: 'sv', name: 'Swedish' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' }
];

export const SelectLanguages = ({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  isConnected,
  onLanguageSwitch,
}: SelectLanguagesProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingSource, setSelectingSource] = useState(true);
  const [slideAnim] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const getAvailableLanguages = () => {
    let filtered = selectingSource 
      ? LANGUAGES.filter(lang => lang.code !== targetLanguage.code)
      : LANGUAGES.filter(lang => lang.code !== sourceLanguage.code);
      
    if (searchQuery.trim()) {
      filtered = filtered.filter(lang => 
        lang.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const openLanguageSelect = async (isSource: boolean) => {
    if (isConnected) {
      return;
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectingSource(isSource);
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      damping: 20,
      mass: 1,
      stiffness: 100,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const handleLanguageSelect = async (language: Language) => {
    await Haptics.selectionAsync();
    if (selectingSource) {
      onSourceLanguageChange(language);
    } else {
      onTargetLanguageChange(language);
    }
    setModalVisible(false);
  };

  const handleSwitch = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newSource = targetLanguage;
    const newTarget = sourceLanguage;

    if (onLanguageSwitch) {
      await onLanguageSwitch(newSource, newTarget);
      return;
    }
    
    onSourceLanguageChange(newSource);
    onTargetLanguageChange(newTarget);
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity 
      style={styles.languageItem} 
      onPress={() => handleLanguageSelect(item)}
    >
      <Text style={styles.languageItemText}>{item.name}</Text>
      {((selectingSource && item.code === sourceLanguage.code) || 
        (!selectingSource && item.code === targetLanguage.code)) && (
        <MaterialIcons name="check" size={24} color="#2196F3" />
      )}
    </TouchableOpacity>
  );

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderLanguageButtons = (
    <View style={styles.languagesContainer}>
      <View style={styles.languageSection}>
        <TouchableOpacity 
          style={[
            styles.languageButton,
            isConnected && styles.languageButtonDisabled
          ]}
          onPress={() => openLanguageSelect(true)}
          disabled={isConnected}
        >
          <Text style={styles.buttonLabel}>From</Text>
          <Text style={[
            styles.languageText,
            isConnected && styles.languageTextDisabled
          ]}>
            {sourceLanguage.name}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.languageSection}>
        <TouchableOpacity 
          style={[
            styles.languageButton,
            isConnected && styles.languageButtonDisabled
          ]}
          onPress={() => openLanguageSelect(false)}
          disabled={isConnected}
        >
          <Text style={styles.buttonLabel}>To</Text>
          <Text style={[
            styles.languageText,
            isConnected && styles.languageTextDisabled
          ]}>
            {targetLanguage.name}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* <Text style={styles.heading}>Translating</Text> */}
      <View style={styles.languageSelector}>
        {renderLanguageButtons}
        
        <View style={styles.switchContainer}>
          <TouchableOpacity 
            style={[
              styles.switchButton,
            ]}
            onPress={handleSwitch}
          >
            <MaterialIcons name="swap-vert" size={40} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <BlurView 
          intensity={30} 
          style={StyleSheet.absoluteFill} 
          tint="dark"
        />
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }],
                opacity: slideAnim,
                height: isSearchFocused ? '100%' : '50%'
              }
            ]}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {selectingSource ? 'Source' : 'Target'} Language
                </Text>
                <TouchableOpacity 
                  onPress={closeModal}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={20} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search languages..."
                    placeholderTextColor="#666"
                    autoCorrect={false}
                    autoCapitalize="none"
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={clearSearch}>
                      <MaterialIcons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <FlatList
                data={getAvailableLanguages()}
                renderItem={renderLanguageItem}
                keyExtractor={item => item.code}
                style={styles.languageList}
                keyboardShouldPersistTaps="handled"
              />
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 26,
  },
  languageSelector: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
  },
  languagesContainer: {
    flex: 1,
    gap: 12,
  },
  languageSection: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    paddingLeft: 4,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#0000',
    borderRadius: 16,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'right',
    flex: 1,
    fontFamily: 'Urbanist',
  },
  buttonLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    marginRight: 12,
    fontFamily: 'Urbanist',
  },
  switchContainer: {
    justifyContent: 'center',
    paddingLeft: 30,
  },
  switchButton: {
    padding: 12,
    backgroundColor: '#3E3E3E',
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    width: '100%',
    marginVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '50%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Urbanist',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  languageItemText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Urbanist',
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#000',
    paddingVertical: 4,
    fontFamily: 'Urbanist',
  },
//   heading: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 20,
//     paddingHorizontal: 20,
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     paddingVertical: 10,
//     marginHorizontal: 30,
//     textAlign: 'center',
//   },
  languageButtonDisabled: {
    opacity: 0.5,
  },
  languageTextDisabled: {
    color: '#666',
  },
}); 