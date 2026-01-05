import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Tag, Row, Col, Avatar, Space, Spin } from 'antd';
import { VideoCameraOutlined, UserOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';

// Dummy API fetch function
const fetchQueue = async () => {
  // Replace with real API call
  return [
    {
      id: 1,
      name: 'Sarah Johnson',
      age: 34,
      gender: 'Female',
      status: 'High',
      symptoms: 'Severe headache, nausea, light sensitivity',
      waitMin: 5,
      requestedAt: '09:45 AM',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: 2,
      name: 'Michael Chen',
      age: 45,
      gender: 'Male',
      status: 'Medium',
      symptoms: 'Persistent cough, chest discomfort',
      waitMin: 12,
      requestedAt: '09:38 AM',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: 3,
      name: 'Priya Patel',
      age: 29,
      gender: 'Female',
      status: 'Normal',
      symptoms: 'Mild fever, sore throat',
      waitMin: 20,
      requestedAt: '09:25 AM',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    {
      id: 4,
      name: 'David Kim',
      age: 52,
      gender: 'Male',
      status: 'Medium',
      symptoms: 'Shortness of breath, fatigue',
      waitMin: 15,
      requestedAt: '09:30 AM',
      avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
    },
    {
      id: 5,
      name: 'Emily Nguyen',
      age: 41,
      gender: 'Female',
      status: 'Normal',
      symptoms: 'Back pain, muscle stiffness',
      waitMin: 25,
      requestedAt: '09:10 AM',
      avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    },
  ];
};

const summaryData = [
  {
    label: 'Patients in Queue',
    value: 6,
    icon: <TeamOutlined style={{ fontSize: 28, color: '#3b82f6' }} />,
    bg: '#f3f6fd',
  },
  {
    label: 'Urgent Cases',
    value: 1,
    icon: <ExclamationCircleOutlined style={{ fontSize: 28, color: '#ef4444' }} />,
    bg: '#fff5f5',
  },
  {
    label: 'Avg Wait Time',
    value: '20m',
    icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#f59e42' }} />,
    bg: '#fffaf3',
  },
  {
    label: 'Completed Today',
    value: 12,
    icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#22c55e' }} />,
    bg: '#f3fdf6',
  },
];

const statusTag = (status: string) => {
  if (status === 'Urgent') return <Tag color="red" style={{ fontWeight: 500, background: '#fff5f5', color: '#ef4444' }}>Urgent</Tag>;
  if (status === 'High') return <Tag color="orange" style={{ fontWeight: 500, background: '#fff7ed', color: '#f59e42' }}>High</Tag>;
  return <Tag color="blue">Normal</Tag>;
};

const DoctorDashboard: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchQueue().then(data => {
      setQueue(data);
      setLoading(false);
    });
  }, []);

  const handleConnect = (record: any) => {
    // Replace with Twilio video call logic
    alert(`Connecting to patient ${record.name}`);
  };

  const filteredQueue = queue.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.symptoms.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      {/* Summary Cards */}
      <h1 className="text-3xl mb-2 dark:text-white">Teleconsultation</h1>
      <Row gutter={24} style={{ marginBottom: 32 }}>
        {summaryData.map((item, idx) => (
          <Col xs={24} sm={12} md={6} key={item.label}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                background: item.bg,
                minHeight: 110,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Space align="center" size={18}>
                <div style={{ background: '#fff', borderRadius: '50%', padding: 10, boxShadow: '0 2px 8px #0001' }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: 15 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 26 }}>{item.value}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search Bar */}
      <Input
        placeholder="Search patients by name or symptoms..."
        size="large"
        style={{ marginBottom: 28, maxWidth: 420 }}
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
      />

      {/* Patient Queue */}
      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 18 }}>Patient Queue</span>
        }
        bordered={false}
        style={{ borderRadius: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '24px 24px 0 24px', fontSize: 15, color: '#666' }}>
          {queue.length} patients waiting for consultation
        </div>
        <div>
          {loading ? (
            <Spin style={{ margin: 32 }} />
          ) : (
            filteredQueue.map((patient, idx) => (
              <div
                key={patient.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  borderBottom: idx === filteredQueue.length - 1 ? 'none' : '1px solid #f0f0f0',
                  padding: '24px 24px 0 24px',
                  background: '#fff',
                }}
              >
                <Avatar
                  src={patient.avatar}
                  size={56}
                  style={{ marginRight: 18, marginTop: 2 }}
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 17 }}>{patient.name}</span>
                    <span style={{ color: '#888', fontSize: 15 }}>
                      {patient.age} years • {patient.gender}
                    </span>
                    {statusTag(patient.status)}
                  </div>
                  <div style={{ color: '#666', margin: '6px 0 8px 0' }}>{patient.symptoms}</div>
                  <div style={{ color: '#888', fontSize: 14, display: 'flex', alignItems: 'center', gap: 18 }}>
                    <span>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      Waiting {patient.waitMin} min
                    </span>
                    <span>
                      Requested at {patient.requestedAt}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 120 }}>
                  <Button
                    type="link"
                    icon={<FileTextOutlined />}
                    style={{ padding: 0, fontWeight: 500 }}
                  >
                    Details
                  </Button>
                  <Button
                    type="primary"
                    icon={<VideoCameraOutlined />}
                    onClick={() => handleConnect(patient)}
                    style={{ minWidth: 110, fontWeight: 500 }}
                  >
                    Start Call
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default DoctorDashboard;