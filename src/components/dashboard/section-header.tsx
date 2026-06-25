import { LucideIcon } from "lucide-react";

export function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
        {Icon && <Icon className="h-4 w-4 text-accent" />}
        {title}
      </h2>
      {action}
    </div>
  );
}
