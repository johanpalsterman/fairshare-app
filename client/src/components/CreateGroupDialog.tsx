import { useState } from "react";
import { useCreateGroup } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { mutate, isPending } = useCreateGroup();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    mutate(
      { name, currency: "EUR" },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          toast({ title: "Group created", description: "You can now add expenses." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create group.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="h-4 w-4" /> New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Create a new group</DialogTitle>
          <DialogDescription>
            Start tracking shared expenses for trips, housemates, or projects.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g. Summer Trip 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="text-lg py-6"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending || !name.trim()} className="w-full sm:w-auto">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
