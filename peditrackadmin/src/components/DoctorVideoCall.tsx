import React from 'react';
import { Alert, Button, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { completeTeleconsultationRequest } from '../services/teleconsultationService';

const DEFAULT_LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || '';

export default function DoctorVideoCall() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [ending, setEnding] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const endedRef = React.useRef(false);

  const token = params.get('token') || '';
  const roomName = params.get('roomName') || '';
  const requestId = params.get('requestId') || '';
  const serverUrl = params.get('serverUrl') || DEFAULT_LIVEKIT_URL;

  const hasCallContext = Boolean(token && roomName && serverUrl && requestId);

  const endCall = React.useCallback(async () => {
    if (endedRef.current) {
      navigate('/consultation');
      return;
    }

    endedRef.current = true;
    setEnding(true);
    try {
      await completeTeleconsultationRequest(requestId);
    } catch (error) {
      console.error('Failed to complete teleconsultation request:', error);
    } finally {
      setEnding(false);
      navigate('/consultation');
    }
  }, [navigate, requestId]);

  if (!hasCallContext) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          showIcon
          message="Missing call context"
          description="Token, room name, or request id is missing. Please start the call from the consultation queue."
        />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/consultation')}>
          Back to Queue
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        background: '#0f172a',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Consultation Room</h2>
        <Button danger onClick={endCall} disabled={ending}>
          {ending ? <Spin size="small" /> : 'End Call'}
        </Button>
      </div>

      {connectionStatus !== 'connected' && (
        <Alert
          type={connectionStatus === 'disconnected' ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
          message={connectionStatus === 'disconnected' ? 'Connection lost' : 'Connecting to consultation room...'}
          description={
            connectionStatus === 'disconnected'
              ? 'The request is still active. You can stay on this screen and reconnect, or return to queue and rejoin.'
              : 'Waiting to establish secure video connection.'
          }
        />
      )}

      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        connect={true}
        video={true}
        audio={true}
        onConnected={() => {
          setConnectionStatus('connected');
        }}
        onDisconnected={() => {
          setConnectionStatus('disconnected');
        }}
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          overflow: 'visible',
          borderRadius: 12,
        }}
      >
        <VideoConference style={{ flex: 1, minHeight: 0 }} />
      </LiveKitRoom>
    </div>
  );
}
