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
import { authService, UserRole } from '../../services/authService';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const router = useRouter();

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs du formulaire.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Sécurité du mot de passe', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setLoading(true);
      
      // Vérifier la connexion Internet avant l'inscription
      console.log('Vérification de la connexion Internet...');
      const isConnected = await checkInternetConnection();
      
      if (!isConnected) {
        Alert.alert(
          'Pas de connexion Internet',
          'Veuillez vérifier votre connexion Internet et réessayer.'
        );
        return;
      }

      console.log('Tentative d\'inscription avec les données :', {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      });

      await authService.signUp(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
        phone.trim(),
        role
      );

      Alert.alert(
        'Inscription réussie !',
        'Veuillez vérifier vos e-mails pour confirmer votre inscription (si requis), ou connectez-vous directement.',
        [{ text: 'Super', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      console.error('Erreur détaillée :', error);
      const errorMessage = error.message || 'Une erreur inattendue s\'est produite.';
      Alert.alert(
        "Erreur lors de l'inscription",
        errorMessage.includes('Network') 
          ? 'Problème réseau. Vérifiez votre connexion Internet et réessayez.'
          : errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const checkInternetConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok || response.type === 'opaque';
    } catch (error) {
      console.error('Erreur lors de la vérification de connexion :', error);
      return false;
    }
  };
    
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenContent}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>
              Rejoignez <Text style={styles.highlight}>l'aventure</Text>
            </Text>
            <Text style={styles.subtitle}>
              Créez votre compte en quelques secondes et voyagez l'esprit tranquille.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.flagStrip}>
              <View style={styles.senegalGreen} />
              <View style={styles.senegalYellow} />
              <View style={styles.senegalRed} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Quel est votre rôle ?</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  onPress={() => setRole('client')}
                  style={[
                    styles.roleOption,
                    role === 'client' ? styles.roleOptionSelected : styles.roleOptionUnselected,
                  ]}
                >
                  <Text style={[
                    styles.roleOptionText,
                    role === 'client' ? styles.roleOptionTextSelected : styles.roleOptionTextUnselected,
                  ]}>
                    Client
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRole('chauffeur')}
                  style={[
                    styles.roleOption,
                    role === 'chauffeur' ? styles.roleOptionSelected : styles.roleOptionUnselected,
                  ]}
                >
                  <Text style={[
                    styles.roleOptionText,
                    role === 'chauffeur' ? styles.roleOptionTextSelected : styles.roleOptionTextUnselected,
                  ]}>
                    Chauffeur
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.roleRow}>
                <TouchableOpacity
                  onPress={() => setRole('coacheur')}
                  style={[
                    styles.roleOption,
                    role === 'coacheur' ? styles.roleOptionSelected : styles.roleOptionUnselected,
                  ]}
                >
                  <Text style={[
                    styles.roleOptionText,
                    role === 'coacheur' ? styles.roleOptionTextSelected : styles.roleOptionTextUnselected,
                  ]}>
                    Coacheur
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRole('superviseur')}
                  style={[
                    styles.roleOption,
                    role === 'superviseur' ? styles.roleOptionSelected : styles.roleOptionUnselected,
                  ]}
                >
                  <Text style={[
                    styles.roleOptionText,
                    role === 'superviseur' ? styles.roleOptionTextSelected : styles.roleOptionTextUnselected,
                  ]}>
                    Superviseur
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Mamadou"
                  placeholderTextColor="#6b7280"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('firstName')}
                  onBlur={() => setFocusedInput(null)}
                  style={[
                    styles.input,
                    { borderColor: focusedInput === 'firstName' ? '#0ea5e9' : '#374151' },
                  ]}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Diop"
                  placeholderTextColor="#6b7280"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('lastName')}
                  onBlur={() => setFocusedInput(null)}
                  style={[
                    styles.input,
                    { borderColor: focusedInput === 'lastName' ? '#0ea5e9' : '#374151' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Numéro de Téléphone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="77 123 45 67"
                placeholderTextColor="#6b7280"
                keyboardType="phone-pad"
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
                style={[
                  styles.input,
                  { borderColor: focusedInput === 'phone' ? '#0ea5e9' : '#374151' },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
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

            <View style={styles.fieldGroupLarge}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="6 caractères minimum"
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
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#0ea5e9" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Se connecter</Text>
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
    paddingVertical: 32,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
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
  fieldGroup: {
    marginBottom: 20,
  },
  fieldGroupLarge: {
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
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  roleOptionSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
  },
  roleOptionUnselected: {
    backgroundColor: '#121214',
    borderColor: '#1f2937',
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleOptionTextSelected: {
    color: '#0ea5e9',
  },
  roleOptionTextUnselected: {
    color: '#9ca3af',
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    color: '#ffffff',
    backgroundColor: '#121214',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    fontSize: 14,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  footerLink: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});