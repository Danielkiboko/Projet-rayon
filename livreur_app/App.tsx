import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import DashboardScreen from './src/screens/DashboardScreen';
import ActiveDeliveryScreen from './src/screens/ActiveDeliveryScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnimHeader = useRef(new Animated.Value(0)).current;
  const fadeAnimForm = useRef(new Animated.Value(0)).current;
  const translateYHeader = useRef(new Animated.Value(20)).current;
  const translateYForm = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!isLoggedIn) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnimHeader, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(translateYHeader, { toValue: 0, duration: 800, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(fadeAnimForm, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(translateYForm, { toValue: 0, duration: 800, useNativeDriver: true })
        ])
      ]).start();
    }
  }, [isLoggedIn]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('./src/lib/firebase');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      // Wait a moment for UX
      setTimeout(() => {
        setIsLoggedIn(true);
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.error(error);
      alert('Erreur de connexion: ' + error.message);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Veuillez entrer votre adresse email dans le champ Email pour réinitialiser le mot de passe.");
      return;
    }
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('./src/lib/firebase');
      await sendPasswordResetEmail(auth, email);
      alert("Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.");
    } catch (error: any) {
      console.error(error);
      alert("Erreur : " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('./src/lib/firebase');
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    // Reset animations
    fadeAnimHeader.setValue(0);
    fadeAnimForm.setValue(0);
    translateYHeader.setValue(20);
    translateYForm.setValue(20);
  };

  if (isLoggedIn) {
    if (activeOrderId) {
      return (
        <ActiveDeliveryScreen 
          orderId={activeOrderId} 
          userId={currentUser?.uid}
          onBack={() => setActiveOrderId(null)} 
        />
      );
    }
    return <DashboardScreen 
      onLogout={handleLogout} 
      userId={currentUser?.uid} 
      onAcceptOrder={(id: string) => setActiveOrderId(id)}
    />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnimHeader, transform: [{ translateY: translateYHeader }] }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>R<Text style={styles.logoHighlight}>.</Text></Text>
          </View>
          <Text style={styles.title}>Livreur</Text>
          <Text style={styles.subtitle}>Connectez-vous pour commencer votre tournée.</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: fadeAnimForm, transform: [{ translateY: translateYForm }] }]}>
          <View style={styles.inputContainer}>
            <FontAwesome5 name="envelope" size={16} color="#9ca3af" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={16} color="#9ca3af" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleResetPassword}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Chargement...</Text>
            ) : (
              <Text style={styles.buttonText}>Se Connecter</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b061c',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
  },
  logoHighlight: {
    color: '#38bdf8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#140b2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
    // @ts-ignore
    outlineStyle: 'none' as any,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ffffff',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#0b061c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
