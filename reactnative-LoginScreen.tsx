import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { Input, Button, OTPInput, Link, IconButton, useToast, Spinner, FullScreenLoader, Modal } from '../../components';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useUser } from '../../hooks/useUser';
import authService from '../../services/authService';
import Icon from 'react-native-vector-icons/Ionicons';
import { images } from '../../images';

// Simple base64 decoder for React Native
const base64Decode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  // Add padding if needed
  while (str.length % 4) {
    str += '=';
  }
  
  str = str.replace(/[^A-Za-z0-9+/]/g, '');
  
  while (i < str.length) {
    const encoded1 = chars.indexOf(str.charAt(i++));
    const encoded2 = chars.indexOf(str.charAt(i++));
    const encoded3 = chars.indexOf(str.charAt(i++));
    const encoded4 = chars.indexOf(str.charAt(i++));
    
    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  // Remove null characters and trim
  return result.replace(/\0/g, '').trim();
};

// JWT decode function
const decodeJWT = (token: string) => {
  try {
    console.log('Decoding token:', token);
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    console.log('Base64 payload:', base64);
    const jsonPayload = base64Decode(base64);
    console.log('Decoded payload:', jsonPayload);
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    console.error('Token:', token);
    return null;
  }
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

type LoginMode = 'phone' | 'password' | 'otp';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setUsername: setStoreUsername, setEmail: setStoreEmail, setAuthTokens, setBuyerId, setUserProfile } = useUser();
  const { show } = useToast();
  const [mode, setMode] = useState<LoginMode>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsername, setIsLoadingUsername] = useState(false);
  const [displayedUsername, setDisplayedUsername] = useState('')
  const [userNotFoundModalVisible, setUserNotFoundModalVisible] = useState(false);

  useEffect(() => {
    let timer: any;
    if (mode === 'otp' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResendOtp(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, mode]);

  const handlePasswordMode = async() => {
    if (!phoneNumber) {
      show('Phone number is required', 'error');
      return;
    }
    setIsLoading(true);
    setIsLoadingUsername(true);
    try {
      setMode('password');
      const result = await authService.getNameByPhone(phoneNumber);
      console.log('check name by phone:', result);
      setDisplayedUsername(result.name);
      setStoreEmail(result.email);
      
      // Persist user profile data to Zustand store
      setUserProfile(result);
      
      setCountdown(120);
      setCanResendOtp(false);
    } catch (error) {
      const err: any = error;
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      const details = serverMessage || err?.message || 'Failed to get user name';
      if (status === 404 && (serverMessage === 'Buyer not found' || /not found/i.test(serverMessage))) {
        setUserNotFoundModalVisible(true);
      } else {
        show(`${status ? status + ' - ' : ''}${details}`, 'error');
      }
      setMode('phone');
    } finally {
      setIsLoadingUsername(false);
      setIsLoading(false);
    }
  };

  const handleOtpMode = () => {
    setMode('otp');
    setCountdown(120);
    setCanResendOtp(false);
    navigation.navigate('OTP');
  };

  const handleResendOtp = () => {
    setCountdown(120);
    setCanResendOtp(false);
    // Here you would typically call your API to resend OTP
  };

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      show('Phone and password are required', 'error');
      return;
    }
    
    if (!checked) {
      show('Please agree to Terms & Conditions', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('check login payload:', { phone: phoneNumber, password });
      const result = await authService.login({ phone: phoneNumber, password });
      const decodedToken = decodeJWT(result.token);
      const buyerId = decodedToken?.id || decodedToken?.buyer_id || decodedToken?.user_id;
      if (buyerId) {
        setBuyerId(buyerId);
      }
      setAuthTokens({
        token: result.token,
        refreshToken: result.refreshToken,
      });
      if (displayedUsername) {
        setStoreUsername(displayedUsername);
      }
    } catch (error) {
      const err: any = error;
      const status = err?.response?.status;
      const url = `${err?.config?.baseURL || ''}${err?.config?.url || ''}`;
      const serverMessage = err?.response?.data?.message;
      const details = serverMessage || err?.message || 'Login failed';
      show(`${status ? status + ' - ' : ''}${details}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button for password mode */}
      {mode === 'password' && (
        <View style={styles.header}>
          <IconButton
            icon="chevron-back"
            onPress={() => setMode('phone')}
            style={styles.backButton}
            color={theme.colors.primary}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Phone Number Input */}
        {mode === 'phone' && (
          <>
            <View style={styles.logoContainer}>
              <Image source={images.logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Login</Text>

            <Input
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <View style={styles.buttonContainer}>
              <Button
                iconType="ionicons"
                title="Password"
                icon="lock-closed"
                onPress={handlePasswordMode}
                style={styles.twothirdButton}
                disabled={isLoadingUsername}
              />
              <Button
                iconType="fontAwesome"
                title="OTP"
                icon="qrcode"
                variant="outline"
                onPress={handleOtpMode}
                style={styles.oneThirdButton}
                disabled={isLoadingUsername}
              />
            </View>

            <View style={styles.signupSection}>
              <Text>Don't have an account?</Text>
              <Link
                title="Sign up"
                onPress={() => navigation.navigate('Signup')}
                textAlign="center"
              />
            </View>
          </>
        )}

        {/* Password Mode */}
        {mode === 'password' && (
          <>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.usernameText}>{displayedUsername}</Text>

            <Input
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.agreementRow}>
              <TouchableOpacity
                onPress={() => setChecked(!checked)}
                style={[
                  styles.checkbox, 
                  checked ? styles.checkboxChecked : styles.checkboxUnchecked
                ]}
                activeOpacity={0.8}
              >
                {checked && (
                  <Icon
                    name="checkmark"
                    size={16}
                    color={theme.colors.textInverse}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChecked(!checked)}
                style={styles.checkboxLabelContainer}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.checkboxLabel,
                  !checked && styles.checkboxLabelRequired
                ]}>
                  I agree to the{' '}
                  <Text
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('TermsnConditions');
                    }}
                    style={styles.termsLink}
                  >
                    Terms & Conditions
                  </Text>
                  {!checked && <Text style={styles.requiredText}> *</Text>}
                </Text>
              </TouchableOpacity>
            </View>
            <Button
              title="Login"
              onPress={handleLogin}
              style={styles.fullButton}
              disabled={!checked || isLoading}
            />

            <View style={styles.linkContainer}>
              <Link
                title="Forgot Password?"
                onPress={() => navigation.navigate('ForgotPassword')}
                textAlign="right"
              />
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Full Screen Loader */}
      <FullScreenLoader 
        visible={isLoadingUsername || isLoading} 
        imageUrl="https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800"
        backgroundColor="rgba(0, 0, 0, 0.7)"
        imageSize={100}
      />

      {/* User Not Found Modal */}
      <Modal
        visible={userNotFoundModalVisible}
        title="User not found"
        onClose={() => setUserNotFoundModalVisible(false)}
      >
        <Text style={{ marginBottom: theme.spacing.md, color: theme.colors.text }}>
          User does not exist. Please Sign-Up or talk to Admin.
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <Button
            title="Open Contacts"
            variant="outline"
            onPress={async () => {
              const androidContacts = 'content://contacts/people/';
              const telFallback = 'tel:';
              const url = Platform.OS === 'android' ? androidContacts : telFallback;
              try {
                const supported = await Linking.canOpenURL(url);
                await Linking.openURL(supported ? url : telFallback);
              } catch (_) {
                try { await Linking.openURL(telFallback); } catch { /* noop */ }
              }
            }}
            style={{ flex: 1 }}
          />
          <Button
            title="Email Admin"
            onPress={async () => {
              const mailto = 'mailto:'; // opens default mail composer
              try {
                const supported = await Linking.canOpenURL(mailto);
                if (supported) await Linking.openURL(mailto);
              } catch { /* noop */ }
            }}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ height: theme.spacing.md }} />
        <Button title="Go to Sign Up" onPress={() => { setUserNotFoundModalVisible(false); navigation.navigate('Signup'); }} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundWithLogo,
  },
  signupSection: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    textAlign: 'center',
    gap: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    fontFamily: theme.fonts.regular,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.xxl,
    left: theme.spacing.lg,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 280,
    height: 280,
    // backgroundColor: 'white'
  },
  logoSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontFamily: theme.fonts.bold,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
    fontFamily: theme.fonts.regular,
  },
  welcomeText: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.bold,
  },
  usernameText: {
    fontSize: theme.fontSizes.xl,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontFamily: theme.fonts.medium,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
  },
  twothirdButton: {
    flex: 2,
  },
  fullButton: {
    marginTop: theme.spacing.lg,
  },
  oneThirdButton: {
    flex: 1,
  },
  linkButton: {
    marginTop: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  otpTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.bold,
  },
  highlightText: {
    color: theme.colors.primary,
  },
  otpSubtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
    fontFamily: theme.fonts.regular,
  },
  linkContainer: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.md,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.xs,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxUnchecked: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
  checkboxLabelRequired: {
    color: theme.colors.textSecondary,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: 'none',
  },
  requiredText: {
    color: theme.colors.buttonDestructive,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
