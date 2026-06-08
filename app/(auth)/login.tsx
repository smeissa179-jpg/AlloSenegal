import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '../../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs obligatoires', 'Veuillez saisir votre email et votre mot de passe.');
      return;
    }

    try {
      setLoading(true);
      await authService.signIn(email.trim(), password);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur de connexion', error.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenContent}>
          <View style={styles.brandSection}>
            <View style={styles.titleBar}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <Text style={styles.brandText}>ALLO SÉNÉGAL</Text>
            </View>
            <Text style={styles.loginTitle}>
              Ravi de vous <Text style={styles.highlight}>revoir</Text>
            </Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour commander une course ou proposer un trajet en toute sécurité.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.flagStrip}>
              <View style={styles.senegalGreen} />
              <View style={styles.senegalYellow} />
              <View style={styles.senegalRed} />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Adresse Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="nom@exemple.sn"
                placeholderTextColor="#6b7280"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                style={[
                  styles.input,
                  { borderColor: focusedInput === 'email' ? '#0ea5e9' : '#374151' },
                ]}
              />
            </View>

            <View style={styles.fieldWrapperWide}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Saisissez votre mot de passe"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { borderColor: focusedInput === 'password' ? '#0ea5e9' : '#374151' },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#0ea5e9"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.loginButton}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Se Connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotWrapper}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Nouveau sur Allo Sénégal ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  scrollContent: {
    flexGrow: 1,
  },
  screenContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#1e1e24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 6,
  },
  brandText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  loginTitle: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  highlight: {
    color: '#0ea5e9',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: '#1e1e24',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  flagStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: 'row',
  },
  senegalGreen: {
    flex: 1,
    backgroundColor: '#00853f',
  },
  senegalYellow: {
    flex: 1,
    backgroundColor: '#fdef42',
  },
  senegalRed: {
    flex: 1,
    backgroundColor: '#e3001b',
  },
  fieldWrapper: {
    marginBottom: 20,
    marginTop: 12,
  },
  fieldWrapperWide: {
    marginBottom: 24,
  },
  label: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    color: '#ffffff',
    backgroundColor: '#121214',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    fontSize: 15,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  forgotWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  footerLink: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});