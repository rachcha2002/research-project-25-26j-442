import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { Card, Space, Row, Col } from "antd";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "./Sidebar";
import Navbar from "./ui/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  getDoctorActiveRequest,
  getPendingQueue,
  getTodayTeleconsultationStats,
  getVideoToken,
  type TeleconsultationRequest,
} from "../services/teleconsultationService";
import { approvePost, getFileUrl, getPostsRequiringApproval } from "../utils/recommendation";

interface DashboardProps {
  children: ReactNode;
  onLogout: () => void;
}

interface PendingPostPreview {
  id: string;
  userName: string;
  description: string;
  imageUrl?: string;
  timestamp: string;
}

function resolveProfilePhotoUrl(fileKey: string | undefined, uploadsBaseUrl: string | undefined): string {
  if (!fileKey) return "";

  if (fileKey.startsWith("http://") || fileKey.startsWith("https://")) {
    return fileKey;
  }

  if (!uploadsBaseUrl) {
    return "";
  }

  const normalizedBase = uploadsBaseUrl.replace(/\/+$/, "");
  const normalizedPath = fileKey.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function formatWaitTime(requestedAt: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(requestedAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatTimestamp(dateValue: string): string {
  return new Date(dateValue).toLocaleString();
}

export default function Dashboard({ children, onLogout }: DashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [pendingQueue, setPendingQueue] = useState<TeleconsultationRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<TeleconsultationRequest | null>(null);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<PendingPostPreview[]>([]);
  const [approvingPostId, setApprovingPostId] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { doctor } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const isDashboardHome = location.pathname === "/dashboard";
  const doctorId = doctor?.doctor_id;

  const fileUrl = useMemo(
    () => resolveProfilePhotoUrl(doctor?.profile_photo_url, import.meta.env.VITE_UPLOADS_URL),
    [doctor?.profile_photo_url]
  );

  const fallbackAvatar = useMemo(() => {
    const initial = doctor?.first_name?.trim()?.charAt(0)?.toUpperCase() ?? "D";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=e2e8f0&color=1e293b`;
  }, [doctor?.first_name]);

  const openActiveCall = useCallback(
    async (request: TeleconsultationRequest) => {
      if (!request.videoRoom) return;

      const { token, url } = await getVideoToken(request.videoRoom);
      navigate(
        `/consultation/call?token=${encodeURIComponent(token)}&roomName=${encodeURIComponent(
          request.videoRoom
        )}&serverUrl=${encodeURIComponent(url || "")}&requestId=${encodeURIComponent(request._id)}`
      );
    },
    [navigate]
  );

  const refreshOverview = useCallback(async () => {
    if (!doctorId) return;

    setIsLoadingOverview(true);
    setOverviewError("");

    try {
      const [queueResult, statsResult, activeResult, postsResult] = await Promise.allSettled([
        getPendingQueue(),
        getTodayTeleconsultationStats(),
        getDoctorActiveRequest(doctorId),
        getPostsRequiringApproval(doctorId),
      ]);

      if (queueResult.status === "fulfilled") {
        setPendingQueue(queueResult.value);
      } else {
        throw queueResult.reason;
      }

      if (statsResult.status === "fulfilled") {
        setCompletedTodayCount(statsResult.value.completedToday ?? 0);
      } else {
        setCompletedTodayCount(0);
      }

      if (activeResult.status === "fulfilled") {
        setActiveRequest(activeResult.value);
      } else {
        setActiveRequest(null);
      }

      if (postsResult.status === "fulfilled") {
        const previews = postsResult.value
          .filter((item) => !item.post.Approved)
          .sort((a, b) => new Date(b.post.PostedTime).getTime() - new Date(a.post.PostedTime).getTime())
          .slice(0, 4)
          .map((item) => ({
            id: item.post.PostID,
            userName: item.post.UserID,
            description: item.post.Description || "No description",
            imageUrl: getFileUrl(item.post.PostUrl),
            timestamp: formatTimestamp(item.post.PostedTime),
          }));
        setPendingPosts(previews);
      } else {
        setPendingPosts([]);
      }
    } catch {
      setOverviewError("Failed to load dashboard overview. Please refresh.");
    } finally {
      setIsLoadingOverview(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (!isDashboardHome || !doctorId) {
      return;
    }

    refreshOverview();
  }, [doctorId, isDashboardHome, refreshOverview]);

  const handleQuickApprove = useCallback(
    async (postId: string) => {
      if (!doctorId || approvingPostId) return;

      try {
        setApprovingPostId(postId);
        await approvePost(doctorId, postId, true);
        setPendingPosts((current) => current.filter((post) => post.id !== postId));
      } finally {
        setApprovingPostId(null);
      }
    },
    [approvingPostId, doctorId]
  );

  const urgentCasesCount = useMemo(
    () => pendingQueue.filter((request) => request.risk_level === "high").length,
    [pendingQueue]
  );

  const queuePreview = useMemo(
    () =>
      [...pendingQueue]
        .sort((a, b) => {
          const priorityDiff = (b.risk_priority ?? 0) - (a.risk_priority ?? 0);
          if (priorityDiff !== 0) return priorityDiff;

          return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
        })
        .slice(0, 5),
    [pendingQueue]
  );

  const palette = useMemo(
    () => ({
      cardBorder: isDark ? "#374151" : "#f0f0f0",
      textPrimary: isDark ? "#f3f4f6" : "#111827",
      textSecondary: isDark ? "#9ca3af" : "#666666",
      summaryCircleBg: isDark ? "#1f2937" : "#ffffff",
    }),
    [isDark]
  );

  const summaryData = useMemo(
    () => [
      {
        label: "Pending Post Approvals",
        value: pendingPosts.length,
        icon: <ClockCircleOutlined style={{ fontSize: 28, color: "#6366f1" }} />,
        bg: isDark ? "#312e8133" : "#eef2ff",
        valueColor: palette.textPrimary,
      },
      {
        label: "Patients in Queue",
        value: pendingQueue.length,
        icon: <TeamOutlined style={{ fontSize: 28, color: "#3b82f6" }} />,
        bg: isDark ? "#1e3a8a33" : "#f3f6fd",
        valueColor: palette.textPrimary,
      },
      {
        label: "Urgent Cases",
        value: urgentCasesCount,
        icon: <ExclamationCircleOutlined style={{ fontSize: 28, color: "#ef4444" }} />,
        bg: isDark ? "#450a0a66" : "#fff5f5",
        valueColor: "#ef4444",
      },
      {
        label: "Completed Today",
        value: completedTodayCount,
        icon: <CheckCircleOutlined style={{ fontSize: 28, color: "#22c55e" }} />,
        bg: isDark ? "#052e1666" : "#f3fdf6",
        valueColor: "#22c55e",
      },
    ],
    [completedTodayCount, isDark, palette.textPrimary, pendingPosts.length, pendingQueue.length, urgentCasesCount]
  );

  const renderDashboardHome = () => {
    if (!doctorId) {
      return (
        <div className="p-6 sm:p-8">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
            Loading doctor profile...
          </div>
        </div>
      );
    }

    if (isLoadingOverview) {
      return (
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Loading dashboard overview...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl sm:text-3xl dark:text-white">Welcome back, {doctor?.first_name || "Doctor"}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Live overview of recommendation and teleconsultation operations.
          </p>
        </section>

        {overviewError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {overviewError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Row gutter={24} style={{ marginBottom: 32 }}>
          {summaryData.map((item) => (
            <Col xs={24} sm={12} md={6} key={item.label}>
            <Card
              key={item.label}
              variant="borderless"
              style={{
                borderRadius: 16,
                background: item.bg,
                border: `1px solid ${palette.cardBorder}`,
                minHeight: 110,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Space align="center" size={18}>
                <div
                  style={{
                    background: palette.summaryCircleBg,
                    borderRadius: "50%",
                    padding: 10,
                    boxShadow: "0 2px 8px #0001",
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ color: palette.textSecondary, fontSize: 15 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 26, color: item.valueColor }}>{item.value}</div>
                </div>
              </Space>
            </Card>
            </Col>
          ))}
          </Row>
        </section>

        {activeRequest && (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg text-blue-900 dark:text-blue-200">
                  Active consultation with {activeRequest.patient?.name || "patient"}
                </h2>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Risk: {activeRequest.risk_level.toUpperCase()} • Requested {formatWaitTime(activeRequest.requestedAt)} ago
                </p>
              </div>
              <button
                onClick={() => openActiveCall(activeRequest)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Rejoin Call
              </button>
            </div>
          </section>
        )}

        <section>
          <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
              <Card
                variant="borderless"
                style={{
                  borderRadius: 16,
                  background: isDark ? "#1f2937" : "#ffffff",
                  border: `1px solid ${palette.cardBorder}`,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg dark:text-white">Priority Queue Preview</h2>
                  <Link to="/consultation" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                    View full queue
                  </Link>
                </div>

                {queuePreview.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No patients waiting right now.</p>
                ) : (
                  <div className="space-y-3">
                    {queuePreview.map((request) => (
                      <div
                        key={request._id}
                        className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{request.patient?.name || "Unknown patient"}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {request.patient?.assessment_id || "No assessment id"} • Waiting {formatWaitTime(request.requestedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              request.risk_level === "high"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : request.risk_level === "medium"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            }`}
                          >
                            {request.risk_level.toUpperCase()}
                          </span>
                          <button
                            onClick={() => navigate("/consultation")}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                          >
                            Open Queue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <div className="space-y-6">
                <Card
                  variant="borderless"
                  style={{
                    borderRadius: 16,
                    background: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${palette.cardBorder}`,
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <h2 className="mb-4 text-lg dark:text-white">Quick Actions</h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate("/consultation")}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-left text-white hover:bg-indigo-700"
                    >
                      Open Consultation Queue
                    </button>
                    <button
                      onClick={() => navigate("/recommendations")}
                      className="w-full rounded-lg border border-gray-600 px-4 py-2 text-left text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500/50 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                    >
                      Review Post Recommendations
                    </button>
                    <button
                      onClick={refreshOverview}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Refresh Overview
                    </button>
                  </div>
                </Card>

                <Card
                  variant="borderless"
                  style={{
                    borderRadius: 16,
                    background: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${palette.cardBorder}`,
                    marginTop: 10,
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <h2 className="mb-3 text-lg dark:text-white">Doctor Account</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {doctor?.email || "No email"}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Role: {doctor?.role || "doctor"}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Status: {doctor?.account_status || "Unknown"}
                  </p>
                  {doctor?.account_status === "Inactive" && (
                    <button
                      onClick={() => navigate("/complete-profile")}
                      className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
                    >
                      Complete Profile
                    </button>
                  )}
                </Card>
              </div>
            </Col>
          </Row>
        </section>

        <section>
          <Card
            variant="borderless"
            style={{
              borderRadius: 16,
              background: isDark ? "#1f2937" : "#ffffff",
              border: `1px solid ${palette.cardBorder}`,
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg dark:text-white">Pending Post Moderation</h2>
              <Link to="/recommendations" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                Open full moderation
              </Link>
            </div>

            {pendingPosts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No pending posts right now.</p>
            ) : (
              <div className="space-y-3">
                {pendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{post.userName}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{post.description}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{post.timestamp}</p>
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt="Post preview"
                          className="mt-2 max-h-24 w-24 rounded-md object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickApprove(post.id)}
                        disabled={approvingPostId === post.id}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {approvingPostId === post.id ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => navigate("/recommendations")}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        doctor={doctor}
        fileUrl={fileUrl || fallbackAvatar}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
      />

      <div className="pt-16 flex">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`flex-1 overflow-x-hidden transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          {isDashboardHome ? renderDashboardHome() : children}
        </main>
      </div>
    </div>
  );
}
