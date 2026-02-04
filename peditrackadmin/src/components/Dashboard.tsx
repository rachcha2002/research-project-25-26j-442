import { useState, ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "./Sidebar";
import Navbar from "./ui/Navbar"; // Add this import
import { useAuth } from "../context/AuthContext";

interface DashboardProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function Dashboard({ children, onLogout }: DashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { doctor } = useAuth();

  const fileKey = doctor?.profile_photo_url;
  const [folder, filename] = fileKey ? fileKey.split('/') : ['', ''];
  const fileUrl = folder && filename
    ? `${import.meta.env.VITE_UPLOADS_URL}/${folder}/${filename}`
    : "";

  console.log("File URL in Dashboard:", fileUrl);
  console.log("Doctor in Dashboard:", doctor);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Use the new Navbar component */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        doctor={doctor}
        fileUrl={fileUrl}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="pt-16 flex">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
