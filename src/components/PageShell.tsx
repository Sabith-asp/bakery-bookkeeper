import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";

interface PageShellProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
}

const PageShell = ({ title, subtitle, onBack, children }: PageShellProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="pb-20 md:pb-6">
        <PageHeader title={title} subtitle={subtitle} onBack={onBack} />
        <div className="animate-in fade-in duration-300 space-y-4 px-4 pt-2 md:px-6 md:pt-4 lg:max-w-5xl lg:mx-auto lg:space-y-6 w-full overflow-x-hidden">
          {children}
        </div>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PageShell;
