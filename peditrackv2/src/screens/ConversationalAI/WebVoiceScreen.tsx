import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Colors } from '@/constants/Colors';
import { Audio } from 'expo-av';

// Update this to match your backend IP
const VOICE_CHAT_URL = 'https://research-project-25-26j-442-production-dc5b.up.railway.app/voice-chat.html';

export default function WebVoiceScreen() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        (async () => {
            try {
                const { status } = await Audio.requestPermissionsAsync();
                setHasPermission(status === 'granted');
            } catch (error) {
                console.error('Failed to request microphone permission:', error);
                setHasPermission(false);
            }
        })();
    }, []);

    const handleClose = () => {
        router.back();
    };

    if (hasPermission === false) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <ChatTopBar
                    showBackButton={true}
                    onBackPress={handleClose}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ textAlign: 'center', marginBottom: 20, color: Colors.dark, fontSize: 16 }}>
                        Please grant microphone permission to use voice chat.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={async () => {
                            const { status } = await Audio.requestPermissionsAsync();
                            setHasPermission(status === 'granted');
                        }}
                    >
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ChatTopBar
                showBackButton={true}
                onBackPress={handleClose}
            />

            <SafeAreaView style={styles.safeArea} edges={['bottom']}>
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
                    </View>
                )}

                {hasPermission && (
                    <WebView
                        source={{ uri: VOICE_CHAT_URL }}
                        style={styles.webview}
                        onLoadEnd={() => setIsLoading(false)}
                        mediaPlaybackRequiresUserAction={false}
                        allowsInlineMediaPlayback={true}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        mediaCapturePermissionGrantType="grant"
                        onPermissionRequest={(request: any) => {
                            request.grant(request.resources);
                        }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        zIndex: 1000,
    },
    button: {
        backgroundColor: Colors.primary.DEFAULT,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
