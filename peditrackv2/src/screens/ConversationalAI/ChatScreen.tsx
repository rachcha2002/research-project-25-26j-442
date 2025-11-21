import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar';
import { sendChatMessage, sendChatMessageWithImage } from '@/services/chatService';
import { sendVoiceMessage } from '@/services/voiceService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: string;
    imageUri?: string;
    isVoice?: boolean;
}

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<string>();
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Request permissions on mount
    useEffect(() => {
        requestPermissions();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const requestPermissions = async () => {
        try {
            // Request audio recording permission
            const audioPermission = await Audio.requestPermissionsAsync();
            if (!audioPermission.granted) {
                Alert.alert('Permission Required', 'Please grant microphone permission to use voice messages.');
            }

            // Request image library permission
            const imagePermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!imagePermission.granted) {
                Alert.alert('Permission Required', 'Please grant photo library permission to send images.');
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
        }
    };

    const formatTimestamp = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleSend = async () => {
        if (inputText.trim() || selectedImage) {
            // Prepare message text based on content
            let userMessageText = inputText.trim();
            
            // If there's an image but no text, use placeholder
            if (selectedImage && !userMessageText) {
                userMessageText = '[Image attached]';
            }
            // If there's both image and text, mention image in message
            else if (selectedImage && userMessageText) {
                userMessageText = `[Image: ${userMessageText}]`;
            }

            const newMessage: Message = {
                id: Date.now().toString(),
                text: userMessageText,
                sender: 'user',
                timestamp: formatTimestamp(new Date()),
                imageUri: selectedImage || undefined,
            };

            // Add user message to UI
            setMessages(prev => [...prev, newMessage]);
            const currentText = inputText.trim();
            const currentImage = selectedImage;
            setInputText('');
            setSelectedImage(null);
            setIsTyping(true);

            try {
                let response;
                
                // For now, always use text endpoint (image endpoint needs backend restart)
                // If there's an image, we mention it in the text
                response = await sendChatMessage(
                    currentText || (currentImage ? 'I have shared an image with you.' : ''),
                    conversationId,
                    'openai'
                );

                // Update conversation ID if new
                if (!conversationId) {
                    setConversationId(response.data.conversationId);
                }

                // Add AI response to UI
                const aiMessage: Message = {
                    id: response.data.message.id,
                    text: response.data.message.content,
                    sender: 'assistant',
                    timestamp: formatTimestamp(new Date(response.data.message.timestamp)),
                };

                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error('Failed to get AI response:', error);

                // Show error message to user
                Alert.alert(
                    'Connection Error',
                    'Unable to connect to the chat service. Please make sure the service is running on http://192.168.1.2:3001',
                    [{ text: 'OK' }]
                );

                // Add error message to chat
                const errorMessage: Message = {
                    id: Date.now().toString(),
                    text: 'Sorry, I\'m having trouble connecting to the service. Please try again later.',
                    sender: 'assistant',
                    timestamp: formatTimestamp(new Date()),
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsTyping(false);
            }
        }
    };

    const startRecording = async () => {
        try {
            // Request permissions
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission Required', 'Please grant microphone permission to record voice messages.');
                return;
            }

            // Configure audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Start recording
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            setIsRecording(false);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            if (uri) {
                // Add voice message to UI
                const voiceMessage: Message = {
                    id: Date.now().toString(),
                    text: '[Voice Message]',
                    sender: 'user',
                    timestamp: formatTimestamp(new Date()),
                    isVoice: true,
                };
                setMessages(prev => [...prev, voiceMessage]);
                setIsTyping(true);

                try {
                    // Send voice message to API
                    const response = await sendVoiceMessage(uri, conversationId);

                    // Update conversation ID if new
                    if (!conversationId) {
                        setConversationId(response.data.conversationId);
                    }

                    // Update the voice message with transcription
                    setMessages(prev => prev.map(msg =>
                        msg.id === voiceMessage.id
                            ? { ...msg, text: response.data.transcription }
                            : msg
                    ));

                    // Add AI response
                    const aiMessage: Message = {
                        id: response.data.messageId,
                        text: response.data.responseText,
                        sender: 'assistant',
                        timestamp: formatTimestamp(new Date()),
                    };
                    setMessages(prev => [...prev, aiMessage]);
                } catch (error) {
                    console.error('Failed to send voice message:', error);
                    Alert.alert('Error', 'Failed to process voice message. Please try again.');
                } finally {
                    setIsTyping(false);
                }
            }

            setRecording(null);
        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Error', 'Failed to stop recording. Please try again.');
        }
    };

    const handleVoicePress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
    };

    return (
        <View style={styles.container}>
            <SecondaryTopBar
                showBackButton={true}
                profileImage="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
            />

            <SafeAreaView style={styles.safeArea} edges={['bottom']}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {/* Messages Area */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {messages.map((message) => (
                            <View key={message.id}>
                                {message.sender === 'user' ? (
                                    <View style={styles.userMessageContainer}>
                                        <View style={styles.userBubble}>
                                            {message.imageUri && (
                                                <Image
                                                    source={{ uri: message.imageUri }}
                                                    style={styles.messageImage}
                                                    resizeMode="cover"
                                                />
                                            )}
                                            {message.isVoice && (
                                                <View style={styles.voiceMessageIndicator}>
                                                    <Ionicons name="mic" size={16} color={Colors.white} />
                                                </View>
                                            )}
                                            <Text style={styles.userMessageText}>{message.text}</Text>
                                        </View>
                                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.assistantMessageContainer}>
                                        <View style={styles.assistantHeader}>
                                            <View style={styles.assistantAvatar}>
                                                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary.DEFAULT} />
                                            </View>
                                            <Text style={styles.assistantLabel}>Assistant</Text>
                                        </View>
                                        <View style={styles.assistantBubble}>
                                            <Text style={styles.assistantMessageText}>{message.text}</Text>
                                        </View>
                                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                                    </View>
                                )}
                            </View>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <View style={styles.assistantMessageContainer}>
                                <View style={styles.assistantHeader}>
                                    <View style={styles.assistantAvatar}>
                                        <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary.DEFAULT} />
                                    </View>
                                    <Text style={styles.assistantLabel}>Assistant</Text>
                                </View>
                                <View style={styles.typingBubble}>
                                    <View style={styles.typingIndicator}>
                                        <View style={[styles.typingDot, styles.typingDot1]} />
                                        <View style={[styles.typingDot, styles.typingDot2]} />
                                        <View style={[styles.typingDot, styles.typingDot3]} />
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Image Preview */}
                    {selectedImage && (
                        <View style={styles.imagePreviewContainer}>
                            <View style={styles.imagePreviewWrapper}>
                                <Image
                                    source={{ uri: selectedImage }}
                                    style={styles.imagePreview}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={removeSelectedImage}
                                >
                                    <Ionicons name="close-circle" size={24} color={Colors.white} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={pickImage}
                        >
                            <Ionicons 
                                name="image-outline" 
                                size={26} 
                                color={selectedImage ? Colors.primary.DEFAULT : Colors.inactive} 
                            />
                        </TouchableOpacity>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
                                placeholderTextColor={Colors.inactive}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={1000}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleSend}
                            disabled={isTyping || (!inputText.trim() && !selectedImage)}
                        >
                            <Ionicons name="send" size={20} color={Colors.white} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.voiceButton,
                                isRecording && styles.recordingButton
                            ]}
                            onPress={handleVoicePress}
                            disabled={isTyping}
                        >
                            <Ionicons
                                name={isRecording ? "stop-circle" : "mic"}
                                size={22}
                                color={Colors.white}
                            />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    userBubble: {
        backgroundColor: '#6366F1',
        borderRadius: 20,
        borderTopRightRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxWidth: '80%',
        marginBottom: 4,
    },
    userMessageText: {
        color: Colors.white,
        fontSize: 15,
        lineHeight: 20,
    },
    assistantMessageContainer: {
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    assistantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    assistantAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${Colors.primary.DEFAULT}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    assistantLabel: {
        color: Colors.dark,
        fontSize: 14,
        fontWeight: '600',
    },
    assistantBubble: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        borderTopLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxWidth: '80%',
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    assistantMessageText: {
        color: Colors.dark,
        fontSize: 15,
        lineHeight: 20,
    },
    timestamp: {
        color: Colors.inactive,
        fontSize: 12,
        marginTop: 2,
    },
    typingBubble: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        borderTopLeftRadius: 4,
        paddingHorizontal: 20,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#C7D2FE',
    },
    typingDot1: {
        opacity: 0.4,
    },
    typingDot2: {
        opacity: 0.6,
    },
    typingDot3: {
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        minHeight: 40,
        maxHeight: 80,
        justifyContent: 'center',
    },
    input: {
        fontSize: 14,
        color: Colors.dark,
        maxHeight: 60,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    voiceButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    messageImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
    },
    voiceMessageIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    imagePreviewContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    imagePreviewWrapper: {
        position: 'relative',
        width: 120,
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
    },
    recordingButton: {
        backgroundColor: '#EF4444',
    },
});
