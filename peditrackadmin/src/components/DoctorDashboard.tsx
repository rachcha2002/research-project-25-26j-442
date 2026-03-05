import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Tag, Row, Col, Avatar, Space, Spin, Alert, message, Drawer, Descriptions } from 'antd';
import { VideoCameraOutlined, UserOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  acceptTeleconsultationRequest,
  getDoctorActiveRequest,
  getPendingQueue,
  getTodayTeleconsultationStats,
  getVideoToken,
  type TeleconsultationRequest,
} from '../services/teleconsultationService';

type RiskFilter = 'all' | 'high' | 'medium' | 'low';
type SortMode = 'priority' | 'longest-wait' | 'newest';

const statusTag = (riskLevel: string, isDark: boolean) => {
  if (riskLevel === 'high') {
    return (
      <Tag
        color="red"
        style={{
          fontWeight: 500,
          background: isDark ? '#450a0a' : '#fff5f5',
          borderColor: isDark ? '#7f1d1d' : '#fecaca',
          color: '#ef4444',
        }}
      >
        Urgent
      </Tag>
    );
  }
  if (riskLevel === 'medium') {
    return (
      <Tag
        color="orange"
        style={{
          fontWeight: 500,
          background: isDark ? '#451a03' : '#fff7ed',
          borderColor: isDark ? '#7c2d12' : '#fed7aa',
          color: '#f59e42',
        }}
      >
        High
      </Tag>
    );
  }
  return (
    <Tag
      color="blue"
      style={{
        background: isDark ? '#1e3a8a33' : '#eff6ff',
        borderColor: isDark ? '#1d4ed8' : '#bfdbfe',
        color: isDark ? '#93c5fd' : '#2563eb',
      }}
    >
      Normal
    </Tag>
  );
};

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { doctor } = useAuth();
  const isDark = theme === 'dark';
  const doctorId = doctor?.doctor_id;
  const [queue, setQueue] = useState<TeleconsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingRequestId, setClaimingRequestId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [apiMessage, contextHolder] = message.useMessage();
  const [activeRequest, setActiveRequest] = useState<TeleconsultationRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [completedTodayCount, setCompletedTodayCount] = useState<number>(0);

  const palette = {
    pageBg: isDark ? '#111827' : '#f8fafc',
    cardBg: isDark ? '#1f2937' : '#ffffff',
    cardBorder: isDark ? '#374151' : '#f0f0f0',
    textPrimary: isDark ? '#f3f4f6' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#666666',
    summaryCircleBg: isDark ? '#1f2937' : '#ffffff',
    queueHeaderText: isDark ? '#d1d5db' : '#666666',
    inputBg: isDark ? '#111827' : '#ffffff',
    inputBorder: isDark ? '#4b5563' : '#d9d9d9',
  };

  const getWaitMinutes = (requestedAt: string) =>
    Math.max(0, Math.round((Date.now() - new Date(requestedAt).getTime()) / 60000));

  const averageWaitMinutes = queue.length
    ? Math.round(queue.reduce((acc, item) => acc + getWaitMinutes(item.requestedAt), 0) / queue.length)
    : 0;

  const formatMinutesAsHourMinute = (minutes: number) => {
    const total = Math.max(0, minutes);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const summaryData = [
    {
      label: 'Patients in Queue',
      value: queue.length,
      icon: <TeamOutlined style={{ fontSize: 28, color: '#3b82f6' }} />,
      bg: isDark ? '#1e3a8a33' : '#f3f6fd',
    },
    {
      label: 'Urgent Cases',
      value: queue.filter((q) => q.risk_level === 'high').length,
      icon: <ExclamationCircleOutlined style={{ fontSize: 28, color: '#ef4444' }} />,
      bg: isDark ? '#450a0a66' : '#fff5f5',
    },
    {
      label: 'Avg Wait Time',
      value: formatMinutesAsHourMinute(averageWaitMinutes),
      icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#f59e42' }} />,
      bg: isDark ? '#451a0366' : '#fffaf3',
    },
    {
      label: 'Completed Today',
      value: completedTodayCount,
      icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#22c55e' }} />,
      bg: isDark ? '#052e1666' : '#f3fdf6',
    },
  ];

  const openCall = async (request: TeleconsultationRequest) => {
    if (!request.videoRoom) {
      throw new Error('Video room is missing for accepted request');
    }

    const { token, url } = await getVideoToken(request.videoRoom);
    navigate(
      `/consultation/call?token=${encodeURIComponent(token)}&roomName=${encodeURIComponent(
        request.videoRoom
      )}&serverUrl=${encodeURIComponent(url || '')}&requestId=${encodeURIComponent(request._id)}`
    );
  };

  const refreshQueue = async (silent = false) => {
    try {
      const [queueResult, statsResult] = await Promise.allSettled([
        getPendingQueue(),
        getTodayTeleconsultationStats(),
      ]);

      if (queueResult.status === 'fulfilled') {
        setQueue(queueResult.value);
      } else {
        throw queueResult.reason;
      }

      if (statsResult.status === 'fulfilled') {
        setCompletedTodayCount(statsResult.value.completedToday ?? 0);
      }

      if (!doctorId) {
        setActiveRequest(null);
        return;
      }

      try {
        const active = await getDoctorActiveRequest(doctorId);
        setActiveRequest(active);
      } catch {
        setActiveRequest(null);
      }
    } catch (error) {
      if (!silent) {
        apiMessage.error('Failed to fetch teleconsultation queue');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(() => {
      refreshQueue(true);
    }, 7000);

    return () => clearInterval(interval);
  }, [doctorId]);

  const handleConnect = async (request: TeleconsultationRequest) => {
    if (claimingRequestId) return;
    setClaimingRequestId(request._id);

    try {
      const accepted = await acceptTeleconsultationRequest(request._id);
      await openCall(accepted);
    } catch (error: any) {
      if (error?.status === 409) {
        apiMessage.warning('This request was already picked by another doctor');
        await refreshQueue(true);
      } else {
        apiMessage.error('Failed to start consultation');
      }
    } finally {
      setClaimingRequestId(null);
    }
  };

  const filteredQueue = queue
    .filter((request) => {
      const matchSearch =
        request.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        request.patient?.assessment_id?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (riskFilter === 'all') return true;

      return request.risk_level === riskFilter;
    })
    .sort((a, b) => {
      if (sortMode === 'longest-wait') {
        return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      }

      if (sortMode === 'newest') {
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      }

      const priorityDiff = (b.risk_priority ?? 0) - (a.risk_priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      if (b.risk_score !== a.risk_score) return b.risk_score - a.risk_score;

      return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
    });

  return (
    <div style={{ minHeight: '100vh', background: palette.pageBg, padding: 24 }}>
      {contextHolder}

      <h1 className="text-3xl mb-2 dark:text-white" style={{ color: palette.textPrimary }}>Teleconsultation</h1>

      {activeRequest && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Active consultation with ${activeRequest.patient?.name || 'patient'}`}
          description="You already have an active consultation. Rejoin the room."
          action={
            <Button type="primary" size="small" onClick={() => openCall(activeRequest)}>
              Rejoin Call
            </Button>
          }
        />
      )}

      <Row gutter={24} style={{ marginBottom: 32 }}>
        {summaryData.map((item) => (
          <Col xs={24} sm={12} md={6} key={item.label}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 16,
                background: item.bg,
                border: `1px solid ${palette.cardBorder}`,
                minHeight: 110,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Space align="center" size={18}>
                <div style={{ background: palette.summaryCircleBg, borderRadius: '50%', padding: 10, boxShadow: '0 2px 8px #0001' }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ color: palette.textSecondary, fontSize: 15 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 26, color: palette.textPrimary }}>{item.value}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Input
        placeholder="Search patients by name or assessment id..."
        size="large"
        style={{
          marginBottom: 28,
          maxWidth: 420,
          background: palette.inputBg,
          borderColor: palette.inputBorder,
          color: palette.textPrimary,
        }}
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ color: palette.textSecondary, fontWeight: 600 }}>Filter:</span>
        {(['all', 'high', 'medium', 'low'] as RiskFilter[]).map((level) => (
          <Button
            key={level}
            size="small"
            type={riskFilter === level ? 'primary' : 'default'}
            onClick={() => setRiskFilter(level)}
          >
            {level === 'all' ? 'All' : level.toUpperCase()}
          </Button>
        ))}

        <span style={{ color: palette.textSecondary, fontWeight: 600, marginLeft: 10 }}>Sort:</span>
        {([
          { key: 'priority', label: 'Priority' },
          { key: 'longest-wait', label: 'Longest Wait' },
          { key: 'newest', label: 'Newest' },
        ] as { key: SortMode; label: string }[]).map((item) => (
          <Button
            key={item.key}
            size="small"
            type={sortMode === item.key ? 'primary' : 'default'}
            onClick={() => setSortMode(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 18, color: palette.textPrimary }}>Patient Queue</span>
        }
        variant="borderless"
        style={{ borderRadius: 16, background: palette.cardBg, border: `1px solid ${palette.cardBorder}` }}
        headStyle={{ borderBottomColor: palette.cardBorder }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '24px 24px 0 24px', fontSize: 15, color: palette.queueHeaderText }}>
          {filteredQueue.length} patients shown ({queue.length} total waiting)
        </div>
        <div>
          {loading ? (
            <Spin style={{ margin: 32 }} />
          ) : (
            filteredQueue.map((patient, idx) => (
              <div
                key={patient._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  borderBottom: idx === filteredQueue.length - 1 ? 'none' : `1px solid ${palette.cardBorder}`,
                  padding: '24px 24px 0 24px',
                  background: palette.cardBg,
                }}
              >
                <Avatar
                  size={56}
                  style={{ marginRight: 18, marginTop: 2 }}
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 17, color: palette.textPrimary }}>{patient.patient?.name || 'Unknown Patient'}</span>
                    <Tag
                      style={{
                        background: isDark ? '#312e81' : '#e0e7ff',
                        color: isDark ? '#c7d2fe' : '#3730a3',
                        borderColor: isDark ? '#4338ca' : '#c7d2fe',
                        fontWeight: 600,
                      }}
                    >
                      Queue #{idx + 1}
                    </Tag>
                    <span style={{ color: palette.textSecondary, fontSize: 15 }}>
                      {patient.patient?.age_months ? (patient.patient.age_months / 12).toFixed(1) : '-'} years • Risk score {patient.risk_score}
                    </span>
                    {statusTag(patient.risk_level, isDark)}
                  </div>
                  <div style={{ color: palette.textSecondary, margin: '6px 0 8px 0' }}>Assessment ID: {patient.patient?.assessment_id || '-'}</div>
                  <div style={{ color: palette.textSecondary, fontSize: 14, display: 'flex', alignItems: 'center', gap: 18 }}>
                    <span>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      Waiting {getWaitMinutes(patient.requestedAt)} min
                    </span>
                    <span>
                      Requested at {new Date(patient.requestedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 120 }}>
                  <Button
                    type="link"
                    icon={<FileTextOutlined />}
                    style={{ padding: 0, fontWeight: 500 }}
                    onClick={() => setSelectedRequest(patient)}
                  >
                    Details
                  </Button>
                  <Button
                    type="primary"
                    icon={<VideoCameraOutlined />}
                    onClick={() => handleConnect(patient)}
                    loading={claimingRequestId === patient._id}
                    disabled={Boolean(activeRequest && activeRequest._id !== patient._id)}
                    style={{ minWidth: 110, fontWeight: 500 }}
                  >
                    Select & Join
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Drawer
        title="Consultation Request Details"
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        size={460}
      >
        {selectedRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Descriptions title="Patient" size="small" column={1} bordered>
              <Descriptions.Item label="Name">{selectedRequest.patient?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Age">
                {selectedRequest.patient?.age_months
                  ? `${(selectedRequest.patient.age_months / 12).toFixed(1)} years`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Weight">{selectedRequest.patient?.weight_kg || '-'} kg</Descriptions.Item>
              <Descriptions.Item label="Assessment ID">{selectedRequest.patient?.assessment_id || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Request" size="small" column={1} bordered>
              <Descriptions.Item label="Risk Level">{selectedRequest.risk_level.toUpperCase()}</Descriptions.Item>
              <Descriptions.Item label="Risk Score">{selectedRequest.risk_score}</Descriptions.Item>
              <Descriptions.Item label="Requested At">
                {new Date(selectedRequest.requestedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Current Wait">{getWaitMinutes(selectedRequest.requestedAt)} min</Descriptions.Item>
              <Descriptions.Item label="Status">{selectedRequest.status}</Descriptions.Item>
            </Descriptions>

            <Button
              type="primary"
              icon={<VideoCameraOutlined />}
              onClick={() => {
                handleConnect(selectedRequest);
              }}
              loading={claimingRequestId === selectedRequest._id}
              disabled={Boolean(activeRequest && activeRequest._id !== selectedRequest._id)}
            >
              Select & Join Call
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DoctorDashboard;