import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar';
import { sendChatMessage } from '@/services/chatService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: string;
}

export const ChatScreen: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);
    const scrollViewRef = useRef<ScrollView>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const formatTimestamp = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleSend = async () => {
        if (inputText.trim()) {
            const userMessageText = inputText.trim();
            const newMessage: Message = {
                id: Date.now().toString(),
                text: userMessageText,
                sender: 'user',
                timestamp: formatTimestamp(new Date()),
            };

            // Add user message to UI
            setMessages(prev => [...prev, newMessage]);
            setInputText('');
            setIsTyping(true);

            try {
                // Call the chat API
                const response = await sendChatMessage(
                    userMessageText,
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

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="happy-outline" size={28} color={Colors.inactive} />
                        </TouchableOpacity>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Reply ..."
                                placeholderTextColor={Colors.inactive}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                        </View>

                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="image-outline" size={28} color={Colors.inactive} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleSend}
                        >
                            <Ionicons name="send" size={20} color={Colors.white} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="mic-outline" size={28} color={Colors.primary.DEFAULT} />
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
        paddingVertical: 12,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
    },
    input: {
        fontSize: 15,
        color: Colors.dark,
        maxHeight: 100,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
