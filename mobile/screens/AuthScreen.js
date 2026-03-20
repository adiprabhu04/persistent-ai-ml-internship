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
      await AsyncStorage.setItem('user', JSON.stringify({ id: res.data.user.id, email: res.data.user.email, name: res.data.name || res.data.user?.name || '' }));
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
      await register(name.trim(), email.trim(), password);
      console.log('Login request (post-register):', JSON.stringify({ url: '/auth/login', body: { email: email.trim() } }));
      const loginRes = await login(email.trim(), password);
      await AsyncStorage.setItem('token', loginRes.data.token);
      await AsyncStorage.setItem('user', JSON.stringify({ id: loginRes.data.user.id, email: loginRes.data.user.email, name: loginRes.data.name || loginRes.data.user?.name || '' }));
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
        <Text style={styles.logo}>Jot It<Text style={{ color: '#5B6EF5' }}>.</Text></Text>
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
            placeholderTextColor="#444444"
            color="#F0F0F0"
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
          placeholderTextColor="#444444"
          color="#F0F0F0"
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
          placeholderTextColor="#444444"
          color="#F0F0F0"
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
            <ActivityIndicator color="#ffffff" />
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
    backgroundColor: '#080808',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#F0F0F0',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#5B6EF5',
  },
  tabText: {
    color: '#555555',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F0F0F0',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
  },
  inputFocused: {
    borderColor: '#5B6EF5',
  },
  button: {
    backgroundColor: '#5B6EF5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
