import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register } from '../services/api';

export default function AuthScreen({ onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      console.log('Login request:', JSON.stringify({ url: '/auth/login', body: { email: email.trim() } }));
      const res = await login(email.trim(), password);
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      onAuthSuccess();
    } catch (err) {
      console.log('Login error:', JSON.stringify({
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
      }));
      const msg = err.response?.data?.message || 'Invalid email or password.';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      console.log('Register request:', JSON.stringify({ url: '/auth/register', body: { name: name.trim(), email: email.trim() } }));
      const res = await register(name.trim(), email.trim(), password);
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      onAuthSuccess();
    } catch (err) {
      console.log('Register error:', JSON.stringify({
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
      }));
      const msg = err.response?.data?.message || 'Registration failed.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => [
    styles.input,
    focusedInput === field && styles.inputFocused,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>Jot It</Text>
        <Text style={styles.tagline}>Your thoughts, captured.</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'signin' && styles.tabActive]}
            onPress={() => setActiveTab('signin')}
          >
            <Text style={[styles.tabText, activeTab === 'signin' && styles.tabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'register' && styles.tabActive]}
            onPress={() => setActiveTab('register')}
          >
            <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'register' && (
          <TextInput
            style={inputStyle('name')}
            placeholder="Name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            color="#ffffff"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
          />
        )}

        <TextInput
          style={inputStyle('email')}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.4)"
          color="#ffffff"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
        />

        <TextInput
          style={inputStyle('password')}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.4)"
          color="#ffffff"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput(null)}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={activeTab === 'signin' ? handleSignIn : handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0f0f1a" />
          ) : (
            <Text style={styles.buttonText}>
              {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFD60A',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFD60A',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#0f0f1a',
  },
  input: {
    backgroundColor: '#1e1e3a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputFocused: {
    borderColor: '#FFD60A',
  },
  button: {
    backgroundColor: '#FFD60A',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0f0f1a',
    fontSize: 16,
    fontWeight: '700',
  },
});
