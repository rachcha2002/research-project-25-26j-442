import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export const AIScreen: React.FC = () => {
  const router = useRouter();

  const handleVoicePress = () => {
    router.push('/voice');
  };

  const handleChatPress = () => {
    router.push('/chat');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Choose How You Want to Ask</Text>
          <Text style={styles.headerSubtitle}>Select a mode to continue</Text>
        </View>

        {/* Voice Mode Card */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={handleVoicePress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, styles.voiceIconCircle]}>
            <Ionicons name="mic" size={48} color={Colors.white} />
          </View>
          <Text style={styles.modeTitle}>Voice</Text>
          <Text style={styles.modeDescription}>
            Speak your question and get instant answers
          </Text>
        </TouchableOpacity>

        {/* Chat Mode Card */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={handleChatPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, styles.chatIconCircle]}>
            <Ionicons name="chatbubble" size={48} color={Colors.white} />
          </View>
          <Text style={styles.modeTitle}>Chat</Text>
          <Text style={styles.modeDescription}>
            Type your question for a detailed response
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    color: Colors.dark,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: Colors.inactive,
    fontSize: 15,
    textAlign: 'center',
  },
  modeCard: {
    backgroundColor: '#E8E5FF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  voiceIconCircle: {
    backgroundColor: '#6366F1',
  },
  chatIconCircle: {
    backgroundColor: '#6366F1',
  },
  modeTitle: {
    color: Colors.dark,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modeDescription: {
    color: Colors.inactive,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
