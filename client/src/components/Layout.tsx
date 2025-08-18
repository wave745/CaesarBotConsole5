import { useAppStore } from "@/store/useAppStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-caesar-black text-white">
      <Sidebar />
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-0' : 'ml-64'
      }`}>
        <Header />
        <main className="mt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
