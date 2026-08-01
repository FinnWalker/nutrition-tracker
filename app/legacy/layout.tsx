import MobileNavDrawer from "@/app/ui/mobile-nav-drawer";
import SidebarNav from "@/app/ui/sidebar-nav";

type LegacyLayoutProps = {
  children: React.ReactNode;
};

export default function LegacyLayout({ children }: LegacyLayoutProps) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-surface px-5 py-6 md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:self-start md:overflow-y-auto">
        <SidebarNav basePath="/legacy" />
      </aside>

      <main className="flex min-h-dvh flex-col px-4 py-6 md:px-8 md:py-8">
        <MobileNavDrawer>
          <SidebarNav basePath="/legacy" />
        </MobileNavDrawer>
        {children}
      </main>
    </div>
  );
}
