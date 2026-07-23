import { useRole } from "@/hooks/use-role";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Eye } from "lucide-react";

/**
 * CoachOsBanner - Shown to admins when viewing a specific coach's data in Coach OS.
 * Appears at the top of every Coach OS page when a coach is selected.
 */
export function CoachOsBanner() {
  const { role, selectedCoachId, selectedCoachName, setSelectedCoach } = useRole();

  // Only show for admins viewing a coach
  if (role !== "admin" || !selectedCoachId || !selectedCoachName) return null;

  const initials = selectedCoachName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 mb-4 shadow-sm">
      <div className="flex items-center gap-1 text-primary/70">
        <Eye className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Vista como</span>
      </div>
      <Avatar className="h-7 w-7 border border-primary/40">
        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="font-semibold text-sm text-foreground flex-1">{selectedCoachName}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setSelectedCoach(null, null)}
      >
        <X className="h-3 w-3 mr-1" />
        Cambiar
      </Button>
    </div>
  );
}
