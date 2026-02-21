import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../contexts/AuthContext';
import { APP_CONFIG } from '../../config/config';
import { SecondaryTopBar } from '../../components/SecondaryTopBar/SecondaryTopBar';
import { Colors } from '@/constants/Colors';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, isLoading } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (): string => {
    if (!newPassword) return '';
    if (newPassword.length < 6) return 'Weak';
    if (newPassword.length < 10) return 'Medium';
    return 'Strong';
  };

  const getPasswordStrengthColor = (): string => {
    const strength = getPasswordStrength();
    if (strength === 'Weak') return Colors.error;
    if (strength === 'Medium') return '#ffd93d';
    return '#6bcf7f';
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < APP_CONFIG.PASSWORD_MIN_LENGTH) {
      Alert.alert(
        'Error',
        `Password must be at least ${APP_CONFIG.PASSWORD_MIN_LENGTH} characters`
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SecondaryTopBar
        title="Change Password"
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView keyboardShouldPersistTaps="handled">

          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {newPassword !== '' && (
                <View style={styles.strengthContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: getPasswordStrengthColor() },
                    ]}
                  />
                  <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                    {getPasswordStrength()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.changeButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full Screen Loader - Optional since button has loader, but requested */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.dark,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    width: 60,
    borderRadius: 2,
    marginRight: 10,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeButton: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
