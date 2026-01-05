import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const DUMMY_DOCTOR = {
  name: 'Dr. Samantha Perera',
  avatar: 'https://cdn-icons-png.flaticon.com/512/387/387561.png',
};


export const VideoCallScreen: React.FC<any> = () => {
    const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Video Call</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.endCallBtn}>
          <Text style={styles.endCallText}>End</Text>
        </TouchableOpacity>
      </View>
      {/* Video area */}
      <View style={styles.videoArea}>
        <View style={styles.remoteVideo}>
          <Text style={styles.videoText}>Doctor's Video</Text>
        </View>
        <View style={styles.localVideoWrap}>
          <View style={styles.localVideo}>
            <Text style={styles.localVideoText}>You</Text>
          </View>
        </View>
      </View>
      {/* Doctor info overlay */}
      <View style={styles.doctorInfoOverlay}>
        <Image source={{ uri: DUMMY_DOCTOR.avatar }} style={styles.avatar} />
        <Text style={styles.doctorName}>{DUMMY_DOCTOR.name}</Text>
        <Text style={styles.status}>Connected</Text>
      </View>
      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/727/727245.png' }} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/727/727269.png' }} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/727/727240.png' }} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
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
    marginHorizontal: 18,
    elevation: 2,
  },
  icon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
});

export default VideoCallScreen;
