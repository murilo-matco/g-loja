import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { SidebarProvider } from "@/components/sidebar-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-full print:block">
          <div className="print:hidden">
            <Sidebar />
          </div>
          <div className="flex flex-col flex-1 min-w-0 print:block">
            <div className="print:hidden">
              <Header />
            </div>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30 print:p-0 print:bg-white print:overflow-visible">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
