import SidebarNavLinks from "@/app/ui/sidebar-nav-links";

type NavSidebarContentProps = {
  basePath?: string;
};

const NavSidebarContent = ({ basePath }: NavSidebarContentProps) => {
  return (
    <div className="space-y-6 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
          Wellness
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">
          Nutrition Tracker
        </h2>
      </div>
      <SidebarNavLinks basePath={basePath} />
    </div>
  );
};

export default NavSidebarContent;
