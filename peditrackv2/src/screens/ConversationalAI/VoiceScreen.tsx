import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export const VoiceScreen: React.FC = () => {
    const router = useRouter();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation for the main circle
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );

        // Glow animation
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        glow.start();

        return () => {
            pulse.stop();
            glow.stop();
        };
    }, []);

    const handleClose = () => {
        router.back();
    };

    const handleMicPress = () => {
        // TODO: Implement voice recording
        console.log('Microphone pressed');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleClose}
                    style={styles.backButton}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title}>Voice AI Assistant</Text>
                <Text style={styles.subtitle}>Speak naturally about your health concerns</Text>

                {/* Animated Glowing Circle */}
                <View style={styles.circleContainer}>
                    {/* Outer glow rings */}
                    <Animated.View
                        style={[
                            styles.glowRing,
                            styles.glowRing1,
                            {
                                opacity: glowAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.3, 0],
                                }),
                                transform: [
                                    {
                                        scale: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.4],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.glowRing,
                            styles.glowRing2,
                            {
                                opacity: glowAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.2, 0],
                                }),
                                transform: [
                                    {
                                        scale: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.6],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />

                    {/* Main animated circle */}
                    <Animated.View
                        style={[
                            styles.mainCircle,
                            {
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={['#1E3A8A', '#0EA5E9', '#06B6D4']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientCircle}
                        />
                    </Animated.View>
                </View>

                {/* Message */}
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>I'm listening, Amanda.</Text>
                    <Text style={styles.messageText}>What's on your mind?</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleClose}
                        accessibilityLabel="Close"
                        accessibilityRole="button"
                    >
                        <Ionicons name="close" size={28} color="#6366F1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleMicPress}
                        accessibilityLabel="Microphone"
                        accessibilityRole="button"
                    >
                        <Ionicons name="mic" size={28} color="#6366F1" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: '#6366F1',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.inactive,
        textAlign: 'center',
        marginBottom: 60,
    },
    circleContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
    },
    glowRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#6366F1',
    },
    glowRing1: {
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    glowRing2: {
        width: 180,
        height: 180,
        borderRadius: 90,
    },
    mainCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    gradientCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    messageContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    messageText: {
        fontSize: 20,
        fontWeight: '500',
        color: '#6366F1',
        textAlign: 'center',
        lineHeight: 28,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 32,
    },
    actionButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E8E5FF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
});
