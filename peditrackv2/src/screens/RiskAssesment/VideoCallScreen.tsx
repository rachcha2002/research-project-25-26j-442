import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  completeTeleconsultationRequest,
  getDoctorPublicProfile,
  getTeleconsultationRequest,
} from '@/services/teleconsultationService';
import {
  LiveKitRoom,
  VideoTrack,
  registerGlobals,
  useTracks,
  useChat,
} from '@livekit/react-native';

registerGlobals();

const DEFAULT_LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

const VideoTiles: React.FC<{ onRemoteNameChange: (name: string | null) => void }> = ({ onRemoteNameChange }) => {
  const tracks = useTracks();
  const remoteTrack = tracks.find(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal);

  React.useEffect(() => {
    if (!remoteTrack) {
      onRemoteNameChange(null);
      return;
    }
    const remoteName =
      remoteTrack.participant.name ||
      remoteTrack.participant.identity ||
      null;

    onRemoteNameChange(remoteName);
  }, [remoteTrack, onRemoteNameChange]);

  return (
    <View style={styles.videoArea}>
      <View style={styles.remoteVideo}>
        {remoteTrack ? (
          <VideoTrack trackRef={remoteTrack} style={styles.videoTrack} objectFit="cover" />
        ) : (
          <Text style={styles.videoText}>Waiting for doctor video...</Text>
        )}
      </View>

      <View style={styles.localVideoWrap}>
        <View style={styles.localVideo}>
          {localTrack ? (
            <VideoTrack trackRef={localTrack} style={styles.videoTrack} objectFit="cover" />
          ) : (
            <Text style={styles.localVideoText}>You</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const InCallChat: React.FC<{ onEndCall: () => void }> = ({ onEndCall }) => {
  const { chatMessages, send, isSending } = useChat();
  const [chatOpen, setChatOpen] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  const handleSend = React.useCallback(async () => {
    const message = draft.trim();
    if (!message || isSending) return;

    try {
      await send(message);
      setDraft('');
    } catch (err) {
      Alert.alert('Send failed', 'Unable to send chat message right now.');
    }
  }, [draft, isSending, send]);

  return (
    <>
      {chatOpen && (
        <View style={styles.chatPanel}>
          <Text style={styles.chatTitle}>In-call Chat</Text>
          <ScrollView style={styles.chatList} contentContainerStyle={{ paddingBottom: 6 }}>
            {chatMessages.length === 0 ? (
              <Text style={styles.chatEmpty}>No messages yet</Text>
            ) : (
              chatMessages.slice(-20).map((message, index) => {
                const fromMe = message.from?.isLocal;
                return (
                  <View
                    key={`${message.timestamp}-${index}`}
                    style={[styles.chatBubble, fromMe ? styles.chatBubbleMine : styles.chatBubbleOther]}
                  >
                    <Text style={styles.chatSender}>{fromMe ? 'You' : message.from?.name || message.from?.identity || 'Doctor'}</Text>
                    <Text style={styles.chatText}>{message.message}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message"
              placeholderTextColor="#94A3B8"
              editable={!isSending}
            />
            <TouchableOpacity
              style={[styles.chatSendBtn, (!draft.trim() || isSending) && { opacity: 0.6 }]}
              onPress={handleSend}
              disabled={!draft.trim() || isSending}
            >
              <Text style={styles.chatSendText}>{isSending ? '...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setChatOpen((prev) => !prev)}>
          <Ionicons name={chatOpen ? 'chatbubble' : 'chatbubble-outline'} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlEndBtn} onPress={onEndCall}>
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
};

 const VideoCallScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token?: string;
    roomName?: string;
    identity?: string;
    serverUrl?: string;
    requestId?: string;
  }>();

  const token = params.token;
  const roomName = params.roomName;
  const serverUrl = params.serverUrl || DEFAULT_LIVEKIT_URL;
  const requestId = params.requestId;
  const [doctorDisplayName, setDoctorDisplayName] = React.useState<string | null>(null);
  const [doctorSpecialization, setDoctorSpecialization] = React.useState<string | null>(null);
  const [remoteDisplayName, setRemoteDisplayName] = React.useState<string | null>(null);

  const completedRef = React.useRef(false);

  const canConnect = Boolean(token && roomName && serverUrl);

  const handleEndCall = async () => {
    if (!completedRef.current && requestId) {
      completedRef.current = true;
      try {
        await completeTeleconsultationRequest(requestId);
      } catch (err) {
        console.error('Failed to mark consultation complete:', err);
      }
    }
    router.back();
  };

  React.useEffect(() => {
    if (!canConnect) {
      Alert.alert('Unable to start call', 'Missing call details. Please rejoin from Teleconsultation screen.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [canConnect, router]);

  React.useEffect(() => {
    let active = true;

    if (!requestId) {
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const consultation = await getTeleconsultationRequest(requestId);
        if (!consultation?.doctorId) return;

        const doctor = await getDoctorPublicProfile(consultation.doctorId);
        if (!doctor || !active) return;

        const fullName = [doctor.first_name, doctor.last_name].filter(Boolean).join(' ').trim();
        if (fullName) {
          setDoctorDisplayName(fullName);
        }
        if (doctor.specialization) {
          setDoctorSpecialization(doctor.specialization);
        }
      } catch (error) {
        // fallback to remote participant identity/name
      }
    })();

    return () => {
      active = false;
    };
  }, [requestId]);

  if (!canConnect) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Video Call</Text>
        </View>
        <View style={styles.videoArea}>
          <Text style={styles.videoText}>Connecting...</Text>
        </View>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token as string}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={() => {
        handleEndCall();
      }}
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
        </View>

        <VideoTiles onRemoteNameChange={setRemoteDisplayName} />

        <View style={styles.doctorInfoOverlay}>
          <Text style={styles.doctorName}>Dr. {doctorDisplayName || remoteDisplayName || 'Doctor'}</Text>
          {!!doctorSpecialization && (
            <Text style={styles.doctorSpecialization}>{doctorSpecialization}</Text>
          )}
          <Text style={styles.status}>Connected</Text>
        </View>

        <InCallChat onEndCall={handleEndCall} />
      </View>
    </LiveKitRoom>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 12,
    backgroundColor: '#23272F',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  endCallBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  endCallText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  videoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  remoteVideo: {
    width: '92%',
    height: '70%',
    backgroundColor: '#22223B',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
  },
  videoText: {
    color: '#94A3B8',
    fontSize: 18,
    fontStyle: 'italic',
  },
  localVideoWrap: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  localVideo: {
    width: 130,
    height: 180,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoTrack: {
    width: '100%',
    height: '100%',
  },
  localVideoText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  doctorInfoOverlay: {
    position: 'absolute',
    top: 90,
    left: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(34,34,59,0.85)',
    borderRadius: 16,
    padding: 12,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
  },
  doctorName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  doctorSpecialization: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
  },
  status: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  controlBtn: {
    backgroundColor: '#23272F',
    borderRadius: 32,
    padding: 16,
    marginHorizontal: 10,
    elevation: 2,
  },
  controlEndBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 32,
    padding: 16,
    marginHorizontal: 10,
    elevation: 2,
  },
  chatPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    maxHeight: '40%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
  },
  chatTitle: {
    color: '#E2E8F0',
    fontWeight: '700',
    marginBottom: 8,
  },
  chatList: {
    maxHeight: 180,
    marginBottom: 8,
  },
  chatEmpty: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  chatBubble: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  chatBubbleMine: {
    backgroundColor: '#1E3A8A',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  chatBubbleOther: {
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  chatSender: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  chatText: {
    color: '#fff',
    fontSize: 13,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 13,
  },
  chatSendBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chatSendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default VideoCallScreen;
