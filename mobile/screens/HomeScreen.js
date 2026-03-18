import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  PanResponder,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { deleteNote } from '../services/api';

const CATEGORIES = ['All', 'Personal', 'Work', 'Ideas'];

const CATEGORY_COLORS = {
  Personal: '#60a5fa',
  Work: '#fb923c',
  Ideas: '#a78bfa',
  General: '#94a3b8',
};

function NoteCard({ note, onPress, onDelete }) {
  const translateX = new Animated.Value(0);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        translateX.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -80) {
        Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
          { text: 'Cancel', onPress: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start() },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(note.id) },
        ]);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  });

  const dateStr = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const catColor = CATEGORY_COLORS[note.category] || '#FFD60A';

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ translateX }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(note)}
        activeOpacity={0.8}
        {...panResponder.panHandlers}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {note.title || 'Untitled'}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '22', borderColor: catColor }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>
              {note.category || 'General'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardContent} numberOfLines={1}>
          {(note.content || '').slice(0, 80)}
        </Text>
        <Text style={styles.cardDate}>{dateStr}</Text>
      </TouchableOpacity>
      <View style={styles.deleteHint}>
        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
      </View>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get('/notes', { params: { page: 1, pageSize: 50 } });
      setNotes(res.data.data || res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load notes.');
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    const unsubscribe = navigation.addListener('focus', fetchNotes);
    return unsubscribe;
  }, [navigation, fetchNotes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      Alert.alert('Error', 'Failed to delete note.');
    }
  };

  const filtered = notes
    .filter((n) =>
      activeCategory === 'All'
        ? true
        : (n.category || 'General').toLowerCase() === activeCategory.toLowerCase()
    )
    .filter((n) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jot It</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search notes..."
        placeholderTextColor="rgba(255,255,255,0.35)"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />

      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterTab, activeCategory === cat && styles.filterTabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={(note) => navigation.navigate('EditNote', { note })}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD60A"
            colors={['#FFD60A']}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubText}>Tap + to create your first note</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewNote')}>
        <Ionicons name="add" size={30} color="#0f0f1a" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD60A',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  filterTabActive: {
    backgroundColor: '#FFD60A',
  },
  filterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#0f0f1a',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteHint: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 14,
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD60A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
