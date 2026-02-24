import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Track } from 'livekit-client';
import { completeTeleconsultationRequest } from '@/services/teleconsultationService';
import {
  LiveKitRoom,
  VideoTrack,
  registerGlobals,
  useTracks,
} from '@livekit/react-native';

registerGlobals();

const DEFAULT_LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

const VideoTiles: React.FC = () => {
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const remoteTrack = cameraTracks.find((trackRef) => !trackRef.participant.isLocal);
  const localTrack = cameraTracks.find((trackRef) => trackRef.participant.isLocal);

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

export const VideoCallScreen: React.FC = () => {
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
          <Text style={styles.title}>Video Call</Text>
          <TouchableOpacity onPress={() => handleEndCall()} style={styles.endCallBtn}>
            <Text style={styles.endCallText}>End</Text>
          </TouchableOpacity>
        </View>

        <VideoTiles />

        <View style={styles.doctorInfoOverlay}>
          <Text style={styles.doctorName}>Consultation Room</Text>
          <Text style={styles.status}>Connected</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleEndCall()}>
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtnMuted} onPress={() => handleEndCall()}>
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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
    width: 90,
    height: 120,
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
  controlBtnMuted: {
    backgroundColor: '#DC2626',
    borderRadius: 32,
    padding: 16,
    marginHorizontal: 10,
    elevation: 2,
  },
});

export default VideoCallScreen;
