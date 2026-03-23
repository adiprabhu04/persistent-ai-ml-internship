import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createNote } from '../services/api';

const CATEGORIES = ['General', 'Personal', 'Work', 'Ideas'];

const CATEGORY_CHIP = {
  General:  { bg: '#1A1A1A', border: '#888888', text: '#888888' },
  Personal: { bg: '#13143A', border: '#818CF8', text: '#818CF8' },
  Work:     { bg: '#0D2A1A', border: '#4ADE80', text: '#4ADE80' },
  Ideas:    { bg: '#1E0D2E', border: '#C084FC', text: '#C084FC' },
};

export default function NewNoteScreen({ navigation, route }) {
  const prefillText = route.params?.prefillText || '';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(prefillText);
  const [category, setCategory] = useState('General');
  const [saving, setSaving] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please add a title or content.');
      return;
    }
    setSaving(true);
    try {
      console.log('[NewNote] saving with category:', category);
      await createNote(title.trim() || 'Untitled', content.trim(), category);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Note</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[styles.titleInput, titleFocused && styles.inputFocused]}
          placeholder="Title"
          placeholderTextColor="#444444"
          color="#F0F0F0"
          value={title}
          onChangeText={setTitle}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          returnKeyType="next"
        />

        <TextInput
          style={[styles.contentInput, contentFocused && styles.inputFocused]}
          placeholder="Start writing..."
          placeholderTextColor="#444444"
          color="#F0F0F0"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          onFocus={() => setContentFocused(true)}
          onBlur={() => setContentFocused(false)}
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            const chip = CATEGORY_CHIP[cat] || CATEGORY_CHIP.General;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  active && { backgroundColor: chip.bg, borderColor: chip.border },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catChipText, active && { color: chip.text }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  headerBtnText: {
    color: '#444444',
    fontSize: 15,
  },
  headerTitle: {
    color: '#F0F0F0',
    fontSize: 17,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#5B6EF5',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#F0F0F0',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
  },
  contentInput: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F0F0F0',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
    minHeight: 180,
    lineHeight: 22,
  },
  inputFocused: {
    borderColor: '#5B6EF5',
  },
  sectionLabel: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  catChipText: {
    color: '#444444',
    fontSize: 14,
    fontWeight: '600',
  },
});
