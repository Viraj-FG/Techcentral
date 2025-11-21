import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md';
  className?: string;
}

export const Icon = ({ icon: IconComponent, size = 'md', className }: IconProps) => (
  <IconComponent 
    size={size === 'sm' ? 20 : 24} 
    strokeWidth={1.5}
    className={cn("text-current", className)}
  />
);
