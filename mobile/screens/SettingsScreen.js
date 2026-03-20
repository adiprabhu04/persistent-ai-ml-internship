import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then((raw) => {
      if (raw) setUser(JSON.parse(raw));
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          onLogout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Settings</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || user?.email || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,107,107,0.15)' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
            </View>
            <Text style={styles.rowText}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333333" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(91,110,245,0.15)' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#5B6EF5" />
            </View>
            <Text style={styles.rowText}>Version</Text>
          </View>
          <Text style={styles.rowValue}>{APP_VERSION}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
              <Ionicons name="server-outline" size={20} color="#60a5fa" />
            </View>
            <Text style={styles.rowText}>App Name</Text>
          </View>
          <Text style={styles.rowValue}>Jot It</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    padding: 16,
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#5B6EF5',
    marginBottom: 24,
    marginTop: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B6EF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0F0F0',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#444444',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#444444',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F0F',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  rowLast: {
    marginBottom: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    color: '#F0F0F0',
    fontSize: 15,
    fontWeight: '500',
  },
  rowValue: {
    color: '#444444',
    fontSize: 14,
  },
});
