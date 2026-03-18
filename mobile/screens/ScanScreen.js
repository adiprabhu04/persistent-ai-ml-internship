import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { scanImage } from '../services/api';

export default function ScanScreen({ navigation }) {
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [textFocused, setTextFocused] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to pick photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setShowCamera(false);
      await processImage(photo.uri);
    } catch {
      Alert.alert('Error', 'Failed to take picture.');
    }
  };

  const processImage = async (uri) => {
    setScanning(true);
    setExtractedText('');
    setEditedText('');
    try {
      const res = await scanImage(uri);
      const text = res.data.text || '';
      setExtractedText(text);
      setEditedText(text);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to scan image. Please try again.';
      Alert.alert('Scan Failed', msg);
    } finally {
      setScanning(false);
    }
  };

  const handleSaveAsNote = () => {
    if (!editedText.trim()) {
      Alert.alert('Empty Text', 'Nothing to save.');
      return;
    }
    navigation.navigate('NewNote', { prefillText: editedText.trim() });
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.cameraClose}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Scan Text</Text>
        <Text style={styles.subtitle}>Extract text from images using OCR</Text>

        <View style={styles.optionRow}>
          <TouchableOpacity style={styles.optionCard} onPress={handleCamera}>
            <View style={styles.optionIcon}>
              <Ionicons name="camera" size={32} color="#FFD60A" />
            </View>
            <Text style={styles.optionTitle}>Camera</Text>
            <Text style={styles.optionDesc}>Take a photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleGallery}>
            <View style={styles.optionIcon}>
              <Ionicons name="image" size={32} color="#FFD60A" />
            </View>
            <Text style={styles.optionTitle}>Gallery</Text>
            <Text style={styles.optionDesc}>Upload from photos</Text>
          </TouchableOpacity>
        </View>

        {scanning && (
          <View style={styles.scanningBox}>
            <ActivityIndicator size="large" color="#FFD60A" />
            <Text style={styles.scanningText}>Scanning image...</Text>
          </View>
        )}

        {!scanning && extractedText !== '' && (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Ionicons name="text" size={18} color="#FFD60A" />
              <Text style={styles.resultLabel}>Extracted Text</Text>
            </View>
            <TextInput
              style={[styles.resultInput, textFocused && styles.resultInputFocused]}
              value={editedText}
              onChangeText={setEditedText}
              multiline
              textAlignVertical="top"
              color="#ffffff"
              placeholderTextColor="rgba(255,255,255,0.4)"
              placeholder="No text found..."
              onFocus={() => setTextFocused(true)}
              onBlur={() => setTextFocused(false)}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAsNote}>
              <Ionicons name="save-outline" size={18} color="#0f0f1a" />
              <Text style={styles.saveBtnText}>Save as Note</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFD60A',
    marginBottom: 6,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 28,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,214,10,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
  },
  scanningBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 20,
  },
  scanningText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontSize: 15,
  },
  resultBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultLabel: {
    color: '#FFD60A',
    fontWeight: '700',
    fontSize: 15,
  },
  resultInput: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
    textAlignVertical: 'top',
  },
  resultInputFocused: {
    borderColor: '#FFD60A',
  },
  saveBtn: {
    backgroundColor: '#FFD60A',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#0f0f1a',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  cameraClose: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    marginTop: 20,
  },
  captureBtn: {
    alignSelf: 'center',
    marginBottom: 40,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
  },
});
