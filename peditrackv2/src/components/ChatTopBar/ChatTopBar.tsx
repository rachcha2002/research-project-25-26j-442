import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

interface ChatTopBarProps {
    showBackButton?: boolean;
    onBackPress?: () => void;
    onHistoryPress?: () => void;
    onNewChatPress?: () => void;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
    showBackButton = true,
    onBackPress,
    onHistoryPress,
    onNewChatPress,
}) => {
    const router = useRouter();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.container}>
                {/* Left Section - Back Button */}
                {showBackButton && (
                    <TouchableOpacity
                        onPress={handleBackPress}
                        style={styles.backButton}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.primary.DEFAULT} />
                    </TouchableOpacity>
                )}

                {/* Center Section - Logo and Brand */}
                <View style={styles.centerSection}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoEmoji}>💬</Text>
                    </View>
                    <View style={styles.brandContainer}>
                        <Text style={styles.appName}>AI Chat</Text>
                        <Text style={styles.tagline}>Powered by PediTrack</Text>
                    </View>
                </View>

                {/* Right Section - History and New Chat */}
                <View style={styles.rightSection}>
                    <TouchableOpacity
                        onPress={onHistoryPress}
                        style={styles.iconButton}
                        accessibilityLabel="Conversation History"
                        accessibilityRole="button"
                    >
                        <Ionicons name="time-outline" size={24} color={Colors.dark} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onNewChatPress}
                        style={styles.newChatButton}
                        accessibilityLabel="New Chat"
                        accessibilityRole="button"
                    >
                        <Ionicons name="add-circle" size={28} color={Colors.primary.DEFAULT} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.white,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    logoContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${Colors.primary.DEFAULT}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    logoEmoji: {
        fontSize: 22,
    },
    brandContainer: {
        alignItems: 'flex-start',
    },
    appName: {
        color: Colors.dark,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tagline: {
        color: Colors.inactive,
        fontSize: 9,
        fontWeight: '400',
        marginTop: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newChatButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
