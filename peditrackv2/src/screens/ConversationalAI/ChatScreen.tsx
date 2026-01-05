import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { ChatTopBar } from '@/components/ChatTopBar';
import { sendChatMessage, sendChatMessageWithImage } from '@/services/chatService';
import { sendVoiceMessage } from '@/services/voiceService';
import { chatStorageService, Conversation } from '@/services/chatStorageService';

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
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    // Load conversation history on mount
    useEffect(() => {
        loadConversationHistory();
    }, []);

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
            // Use the actual text, or a placeholder for image-only messages
            const userMessageText = inputText.trim() || '[Image attached]';

            console.log('🔍 Creating message with:');
            console.log('   Text:', userMessageText);
            console.log('   Selected Image:', selectedImage);

            const newMessage: Message = {
                id: Date.now().toString(),
                text: userMessageText,
                sender: 'user',
                timestamp: formatTimestamp(new Date()),
                imageUri: selectedImage || undefined,
            };

            console.log('📝 New message object:', newMessage);

            // Add user message to UI
            setMessages(prev => [...prev, newMessage]);
            const currentText = inputText.trim();
            const currentImage = selectedImage;
            setInputText('');
            setSelectedImage(null);
            setIsTyping(true);

            try {
                let response;

                // Use different API endpoint based on whether image is attached
                if (currentImage) {
                    // Send message with image
                    response = await sendChatMessageWithImage(
                        currentText || 'Please analyze this image and provide relevant information.',
                        currentImage,
                        conversationId,
                        'openai'
                    );
                } else {
                    // Send text-only message
                    response = await sendChatMessage(
                        currentText,
                        conversationId,
                        'openai'
                    );
                }

                // Update conversation ID if new
                if (!conversationId) {
                    setConversationId(response.conversationId);
                }

                // Add AI response to UI
                const aiMessage: Message = {
                    id: Date.now().toString(),
                    text: response.message,
                    sender: 'assistant',
                    timestamp: formatTimestamp(new Date(response.metadata.timestamp)),
                };

                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error('Failed to get AI response:', error);

                // Show error message to user
                Alert.alert(
                    'Connection Error',
                    'Unable to connect to the chat service. Please make sure the service is running on http://192.168.1.3:3001',
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

    const loadConversationHistory = async () => {
        try {
            console.log('📚 Loading conversation history...');
            const history = await chatStorageService.getAllConversations();
            console.log('   Found', history.length, 'conversations');
            if (history.length > 0) {
                console.log('   Latest conversation:', history[0].preview);
            }
            setConversationHistory(history);
        } catch (error) {
            console.error('❌ Error loading conversation history:', error);
        }
    };

    const saveCurrentConversation = async () => {
        if (messages.length > 0) {
            try {
                // Generate conversation ID if not exists
                const convId = conversationId || `conv_${Date.now()}`;

                console.log('💾 Attempting to save conversation...');
                console.log('   Conversation ID:', convId);
                console.log('   Messages count:', messages.length);

                const conversation: Conversation = {
                    id: convId,
                    messages: messages,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    preview: chatStorageService.generatePreview(messages)
                };

                console.log('   Preview:', conversation.preview);

                await chatStorageService.saveConversation(conversation);
                await loadConversationHistory(); // Refresh the list
                console.log('✅ Conversation saved successfully!');
            } catch (error) {
                console.error('❌ Error saving conversation:', error);
                Alert.alert('Error', 'Failed to save conversation');
            }
        } else {
            console.log('⚠️  No messages to save');
        }
    };

    const handleNewChat = () => {
        if (messages.length === 0) {
            // No messages, just start fresh
            setConversationId(undefined);
            return;
        }

        Alert.alert(
            'Start New Chat',
            'Current chat will be saved to history.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'New Chat',
                    onPress: async () => {
                        // Save current conversation
                        await saveCurrentConversation();

                        // Reset chat
                        setMessages([]);
                        setConversationId(undefined);
                        setInputText('');
                        setSelectedImage(null);
                    }
                }
            ]
        );
    };

    const handleShowHistory = () => {
        console.log('📜 Opening history modal...');
        console.log('   Conversation history count:', conversationHistory.length);
        if (conversationHistory.length > 0) {
            console.log('   First conversation:', conversationHistory[0].preview);
            console.log('   All conversations:', conversationHistory.map(c => c.preview));
        }
        setShowHistoryModal(true);
    };

    const loadConversation = async (id: string) => {
        try {
            const conversation = await chatStorageService.getConversation(id);
            if (conversation) {
                // Save current conversation first if it exists
                if (messages.length > 0 && conversationId && conversationId !== id) {
                    await saveCurrentConversation();
                }

                // Load the selected conversation
                setMessages(conversation.messages);
                setConversationId(conversation.id);
                setShowHistoryModal(false);
                console.log('📖 Loaded conversation:', id);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            Alert.alert('Error', 'Failed to load conversation');
        }
    };

    const deleteConversation = async (id: string) => {
        Alert.alert(
            'Delete Conversation',
            'Are you sure you want to delete this conversation?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await chatStorageService.deleteConversation(id);
                            await loadConversationHistory();
                            console.log('🗑️ Conversation deleted:', id);
                        } catch (error) {
                            console.error('Error deleting conversation:', error);
                            Alert.alert('Error', 'Failed to delete conversation');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ChatTopBar
                showBackButton={true}
                onHistoryPress={handleShowHistory}
                onNewChatPress={handleNewChat}
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
                                            {message.imageUri ? (() => {
                                                console.log('🖼️  Rendering image:', message.imageUri);
                                                return (
                                                    <View style={styles.imageContainer}>
                                                        <Image
                                                            key={message.id + '-image'}
                                                            source={{ uri: message.imageUri }}
                                                            style={styles.messageImage}
                                                            resizeMode="cover"
                                                            onLoadStart={() => console.log('⏳ Image loading started...')}
                                                            onLoad={() => console.log('✅ Image loaded successfully')}
                                                            onError={(error) => {
                                                                console.error('❌ Image load error:', error.nativeEvent);
                                                                console.error('   URI was:', message.imageUri);
                                                            }}
                                                        />
                                                    </View>
                                                );
                                            })() : null}
                                            {message.isVoice && (
                                                <View style={styles.voiceMessageIndicator}>
                                                    <Ionicons name="mic" size={16} color={Colors.white} />
                                                </View>
                                            )}
                                            {/* Only show text if it's not a placeholder */}
                                            {message.text && !message.text.startsWith('[Image') && (
                                                <Text style={styles.userMessageText}>{message.text}</Text>
                                            )}
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

            {/* Conversation History Modal */}
            <Modal
                visible={showHistoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Conversation History</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={async () => {
                                        console.log('🔄 Refreshing history...');
                                        await loadConversationHistory();
                                    }}
                                    style={styles.modalCloseButton}
                                >
                                    <Ionicons name="refresh" size={24} color={Colors.primary.DEFAULT} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowHistoryModal(false)}
                                    style={styles.modalCloseButton}
                                >
                                    <Ionicons name="close" size={24} color={Colors.dark} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView style={styles.historyList}>
                            {(() => {
                                console.log('🎨 Rendering history modal, count:', conversationHistory.length);
                                return conversationHistory.length === 0 ? (
                                    <View style={styles.emptyHistory}>
                                        <Ionicons name="chatbubbles-outline" size={64} color={Colors.inactive} />
                                        <Text style={styles.emptyHistoryText}>No conversation history yet</Text>
                                        <Text style={styles.emptyHistorySubtext}>
                                            Start chatting and your conversations will appear here
                                        </Text>
                                    </View>
                                ) : (
                                    conversationHistory.map((conv, index) => {
                                        console.log(`   Rendering conversation ${index}:`, conv.preview);
                                        return (
                                            <View key={conv.id} style={styles.historyItemWrapper}>
                                                <TouchableOpacity
                                                    style={styles.historyItem}
                                                    onPress={() => loadConversation(conv.id)}
                                                >
                                                    <View style={styles.historyItemIcon}>
                                                        <Ionicons name="chatbubble" size={20} color={Colors.primary.DEFAULT} />
                                                    </View>
                                                    <View style={styles.historyItemContent}>
                                                        <Text style={styles.historyItemPreview} numberOfLines={2}>
                                                            {conv.preview}
                                                        </Text>
                                                        <Text style={styles.historyItemTimestamp}>
                                                            {new Date(conv.updatedAt).toLocaleDateString()} {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                    </View>
                                                    <Ionicons name="chevron-forward" size={20} color={Colors.inactive} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.deleteButton}
                                                    onPress={() => deleteConversation(conv.id)}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
                                );
                            })()}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    imageContainer: {
        width: '100%',
        marginBottom: 8,
    },
    messageImage: {
        width: 250,
        height: 200,
        borderRadius: 12,
        backgroundColor: '#E5E7EB', // Placeholder background while loading
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyList: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    emptyHistory: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyHistoryText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark,
        marginTop: 16,
        textAlign: 'center',
    },
    emptyHistorySubtext: {
        fontSize: 14,
        color: Colors.inactive,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    historyItemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: Colors.white,
        minHeight: 72,
    },
    historyItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        minHeight: 72,
    },
    deleteButton: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 72,
    },
    historyItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${Colors.primary.DEFAULT}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyItemContent: {
        flex: 1,
    },
    historyItemPreview: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.dark,
        marginBottom: 4,
    },
    historyItemTimestamp: {
        fontSize: 12,
        color: Colors.inactive,
    },
});