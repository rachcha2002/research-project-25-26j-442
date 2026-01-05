import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { sendVoiceMessage, saveBase64Audio } from '@/services/voiceService';
import { AnimatedRobot } from '@/components/AnimatedRobot';

export const VoiceScreen: React.FC = () => {
    const router = useRouter();

    // Voice state
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);
    const [statusMessage, setStatusMessage] = useState("I'm listening, Amanda.\nWhat's on your mind?");
    const [transcription, setTranscription] = useState<string>('');
    const [robotState, setRobotState] = useState<'idle' | 'listening' | 'thinking' | 'talking'>('idle');

    // Refs to track current audio instances
    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    // Update refs when state changes
    useEffect(() => {
        recordingRef.current = recording;
    }, [recording]);

    useEffect(() => {
        soundRef.current = sound;
    }, [sound]);

    useEffect(() => {
        // Request audio permissions
        (async () => {
            try {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Required',
                        'Please grant microphone permission to use voice chat.',
                        [{ text: 'OK' }]
                    );
                }

                // Set audio mode for recording and playback
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
            } catch (error) {
                console.error('Error requesting audio permissions:', error);
            }
        })();

        return () => {
            // Cleanup audio using refs to get current values
            console.log('🧹 Cleaning up audio on unmount...');
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(console.error);
            }
            if (soundRef.current) {
                soundRef.current.stopAsync().catch(console.error);
                soundRef.current.unloadAsync().catch(console.error);
            }
        };
    }, []);

    const handleClose = async () => {
        console.log('🛑 Stopping all audio...');

        // Stop any ongoing recording
        if (recordingRef.current) {
            try {
                await recordingRef.current.stopAndUnloadAsync();
                setRecording(null);
                setIsRecording(false);
            } catch (error) {
                console.error('Error stopping recording:', error);
            }
        }

        // Stop any playing audio
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                setSound(null);
            } catch (error) {
                console.error('Error stopping sound:', error);
            }
        }

        // Reset state
        setRobotState('idle');
        setIsProcessing(false);

        // Navigate back
        router.back();
    };

    const startRecording = async () => {
        try {
            console.log('Starting recording...');
            setStatusMessage('Listening...');
            setTranscription('');
            setRobotState('listening');

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
            setStatusMessage("I'm listening, Amanda.\nWhat's on your mind?");
            setRobotState('idle');
        }
    };

    const stopRecording = async () => {
        try {
            console.log('Stopping recording...');
            setIsRecording(false);
            setIsProcessing(true);
            setStatusMessage('Processing your message...');
            setRobotState('thinking');

            if (!recording) {
                return;
            }

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (!uri) {
                throw new Error('No recording URI');
            }

            console.log('Recording saved to:', uri);

            // Send to voice service
            const response = await sendVoiceMessage(uri, conversationId);

            console.log('Voice response received:', response);

            // Update conversation ID
            if (!conversationId) {
                setConversationId(response.data.conversationId);
            }

            // Show transcription
            setTranscription(response.data.transcription);
            setStatusMessage(response.data.responseText);

            // Play AI response audio
            await playAudioResponse(response.data.audioResponse);

        } catch (error) {
            console.error('Failed to process voice message:', error);
            Alert.alert(
                'Error',
                'Failed to process your message. Please make sure the chat service is running.',
                [{ text: 'OK' }]
            );
            setStatusMessage("I'm listening, Amanda.\nWhat's on your mind?");
            setRobotState('idle');
        } finally {
            setIsProcessing(false);
        }
    };

    const playAudioResponse = async (base64Audio: string) => {
        try {
            console.log('Playing audio response...');
            setRobotState('talking');

            // Save base64 audio to file
            const audioUri = await saveBase64Audio(base64Audio, `response_${Date.now()}.mp3`);

            // Unload previous sound if exists
            if (sound) {
                await sound.unloadAsync();
            }

            // Load and play new sound
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true }
            );

            setSound(newSound);

            // Reset message when playback finishes
            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setStatusMessage("I'm listening, Amanda.\nWhat's on your mind?");
                    setRobotState('idle');
                }
            });

        } catch (error) {
            console.error('Failed to play audio:', error);
            setStatusMessage("I'm listening, Amanda.\nWhat's on your mind?");
            setRobotState('idle');
        }
    };

    const stopAudioPlayback = async () => {
        console.log('⏹️  Stopping audio playback...');
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                setSound(null);
                setRobotState('idle');
                setStatusMessage("I'm listening, Amanda.\nWhat's on your mind?");
            } catch (error) {
                console.error('Error stopping audio playback:', error);
            }
        }
    };

    const handleMicPress = async () => {
        if (isProcessing) {
            return; // Don't allow interaction while processing
        }

        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
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

                {/* Animated Robot */}
                <View style={styles.robotContainer}>
                    <AnimatedRobot state={robotState} size={140} />
                </View>

                {/* Message */}
                <ScrollView
                    style={styles.messageScrollContainer}
                    contentContainerStyle={styles.messageContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.messageText}>{statusMessage}</Text>
                    {isProcessing && (
                        <ActivityIndicator size="small" color="#6366F1" style={{ marginTop: 12 }} />
                    )}
                    {transcription && !isProcessing && (
                        <View style={styles.transcriptionContainer}>
                            <Text style={styles.transcriptionLabel}>You said:</Text>
                            <Text style={styles.transcriptionText}>{transcription}</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleClose}
                        accessibilityLabel="Close"
                        accessibilityRole="button"
                        disabled={isProcessing}
                    >
                        <Ionicons name="close" size={28} color={isProcessing ? Colors.inactive : "#6366F1"} />
                    </TouchableOpacity>

                    {/* Show stop button when AI is talking */}
                    {robotState === 'talking' && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.stopButton]}
                            onPress={stopAudioPlayback}
                            accessibilityLabel="Stop audio"
                            accessibilityRole="button"
                        >
                            <Ionicons name="stop-circle" size={28} color="#EF4444" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            isRecording && styles.recordingButton,
                            isProcessing && styles.disabledButton
                        ]}
                        onPress={handleMicPress}
                        accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
                        accessibilityRole="button"
                        disabled={isProcessing}
                    >
                        <Ionicons
                            name={isRecording ? "stop" : "mic"}
                            size={28}
                            color={isProcessing ? Colors.inactive : "#6366F1"}
                        />
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
    robotContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
    },
    messageScrollContainer: {
        maxHeight: 200,
        width: '100%',
        marginBottom: 20,
    },
    messageContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
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
    recordingButton: {
        backgroundColor: '#FEE2E2',
    },
    disabledButton: {
        opacity: 0.5,
    },
    stopButton: {
        backgroundColor: '#FEE2E2',
    },
    transcriptionContainer: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#E8E5FF',
        borderRadius: 12,
        maxWidth: '90%',
    },
    transcriptionLabel: {
        fontSize: 12,
        color: Colors.inactive,
        marginBottom: 4,
        fontWeight: '600',
    },
    transcriptionText: {
        fontSize: 14,
        color: Colors.dark,
        lineHeight: 20,
    },
});
