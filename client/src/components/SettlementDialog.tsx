import { useState } from "react";
import { useCreateSettlement } from "@/hooks/use-settlements";
import { GroupMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banknote, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettlementDialogProps {
  groupId: number;
  members: (GroupMember & { user: any })[];
  currentUserId: string;
}

export function SettlementDialog({ groupId, members, currentUserId }: SettlementDialogProps) {
  const [open, setOpen] = useState(false);
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  
  const { mutate, isPending } = useCreateSettlement(groupId);
  const { toast } = useToast();

  const otherMembers = members.filter(m => m.userId !== currentUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId || !amount) return;

    mutate(
      {
        toUserId,
        amount,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setAmount("");
          setToUserId("");
          toast({ title: "Payment recorded", description: "Balance updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Banknote className="h-4 w-4" />
          Settle Up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            Use this when you've paid someone back via cash, bank transfer, or Payconiq.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="to">Paid to</Label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.firstName || member.user.username || member.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="font-mono text-lg"
            />
          </div>

          <Button type="submit" disabled={isPending || !toUserId || !amount} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Record Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
