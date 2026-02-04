import { useState } from "react";
import { Menu, LogOut, User, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Doctor {
  doctor_id: string;
  email: string;
  role: string;
  account_status: string;
  first_name?: string;
  profile_photo_url?: string;
  [key: string]: any;
}

interface NavbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  doctor: Doctor | null;
  fileUrl: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function Navbar({
  isSidebarOpen,
  setIsSidebarOpen,
  doctor,
  fileUrl,
  theme,
  toggleTheme,
  onLogout,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👣</span>
            <span className="text-xl dark:text-white">Peditrack</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-300" />
            )}
          </button>

          <div className="relative flex items-center gap-2">
            <div className="w-12 h-max rounded-full overflow-hidden bg-gray-200 shrink-0">
              <img
                src={fileUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                style={{ display: "block" }}
              />
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium dark:text-gray-300">
                {doctor?.first_name}
              </span>
              <User className="w-4 h-4 opacity-70 dark:text-gray-300" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-30 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}