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
import { Ionicons } from '@expo/vector-icons';
import { updateNote, deleteNote } from '../services/api';

const CATEGORIES = ['General', 'Personal', 'Work', 'Ideas'];

export default function EditNoteScreen({ navigation, route }) {
  const { note } = route.params;
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [category, setCategory] = useState(note.category || 'General');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNote(note.id, title.trim() || 'Untitled', content.trim(), category);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteNote(note.id);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete note.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>Edit Note</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            style={styles.deleteBtn}
          >
            {deleting ? (
              <ActivityIndicator color="#ff6b6b" size="small" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
            )}
          </TouchableOpacity>
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
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    padding: 4,
  },
  saveBtn: {
    backgroundColor: '#5B6EF5',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 10,
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
  catChipActive: {
    backgroundColor: '#5B6EF5',
    borderColor: '#5B6EF5',
  },
  catChipText: {
    color: '#444444',
    fontSize: 14,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
});
