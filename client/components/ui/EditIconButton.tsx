import React from "react";
import { Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditIconButtonProps {
  onClick: () => void;
  className?: string;
  tooltip?: string;
}

export default function EditIconButton({
  onClick,
  className,
  tooltip,
}: EditIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-sm text-white bg-carry-light hover:bg-carry-light/80 transition-colors",
        "flex items-center justify-center",
        className
      )}
      title={tooltip}
    >
      <Edit3 className="w-4 h-4" />
    </button>
  );
}
