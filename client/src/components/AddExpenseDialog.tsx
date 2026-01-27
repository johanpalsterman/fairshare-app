import { useState, useRef, useEffect } from "react";
import { useCreateExpense } from "@/hooks/use-expenses";
import { GroupMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Receipt, Loader2, Camera, Users, Percent, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddExpenseDialogProps {
  groupId: number;
  members: (GroupMember & { user: any })[];
}

type SplitMode = "equal" | "percentage" | "custom";

interface MemberSplit {
  userId: string;
  included: boolean;
  percentage: number;
  customAmount: string;
}

export function AddExpenseDialog({ groupId, members }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [isScanning, setIsScanning] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useCreateExpense(groupId);
  const { toast } = useToast();

  useEffect(() => {
    const initialSplits = members.map(m => ({
      userId: m.userId,
      included: true,
      percentage: 100 / members.length,
      customAmount: ""
    }));
    setMemberSplits(initialSplits);
  }, [members]);

  const toggleMemberIncluded = (userId: string) => {
    const updated = memberSplits.map(s => 
      s.userId === userId ? { ...s, included: !s.included } : s
    );
    const includedCount = updated.filter(s => s.included).length;
    if (includedCount > 0) {
      const equalPercentage = 100 / includedCount;
      updated.forEach(s => {
        if (s.included) s.percentage = equalPercentage;
        else s.percentage = 0;
      });
    }
    setMemberSplits(updated);
  };

  const updatePercentage = (userId: string, value: string) => {
    setMemberSplits(memberSplits.map(s => 
      s.userId === userId ? { ...s, percentage: parseFloat(value) || 0 } : s
    ));
  };

  const updateCustomAmount = (userId: string, value: string) => {
    setMemberSplits(memberSplits.map(s => 
      s.userId === userId ? { ...s, customAmount: value } : s
    ));
  };

  const calculateSplits = () => {
    const totalAmount = parseFloat(amount) || 0;
    
    if (splitMode === "equal") {
      const includedMembers = memberSplits.filter(s => s.included);
      const splitAmount = (totalAmount / includedMembers.length).toFixed(2);
      return includedMembers.map(s => ({
        userId: s.userId,
        amount: splitAmount
      }));
    }
    
    if (splitMode === "percentage") {
      return memberSplits
        .filter(s => s.percentage > 0)
        .map(s => ({
          userId: s.userId,
          amount: ((totalAmount * s.percentage) / 100).toFixed(2)
        }));
    }
    
    return memberSplits
      .filter(s => parseFloat(s.customAmount) > 0)
      .map(s => ({
        userId: s.userId,
        amount: parseFloat(s.customAmount).toFixed(2)
      }));
  };

  const getTotalPercentage = () => memberSplits.reduce((sum, s) => sum + s.percentage, 0);
  const getTotalCustom = () => memberSplits.reduce((sum, s) => sum + (parseFloat(s.customAmount) || 0), 0);

  const handleScanInvoice = async (file: File) => {
    setIsScanning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/scan-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) throw new Error("Scan failed");

      const data = await response.json();
      
      setDescription(data.description || data.vendor || "Scanned receipt");
      setAmount(data.amount || "");
      setCategory(data.category || "general");
      
      toast({ 
        title: "Receipt scanned", 
        description: `Detected: ${data.vendor || "Unknown vendor"} - €${data.amount}` 
      });
    } catch (error) {
      toast({ 
        title: "Scan failed", 
        description: "Could not read the receipt. Please enter details manually.", 
        variant: "destructive" 
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScanInvoice(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || isNaN(Number(amount))) return;

    const totalAmount = parseFloat(amount);
    
    if (splitMode === "equal") {
      const includedCount = memberSplits.filter(s => s.included).length;
      if (includedCount === 0) {
        toast({ title: "Error", description: "Select at least one person to split with.", variant: "destructive" });
        return;
      }
    }
    
    if (splitMode === "percentage") {
      const totalPct = getTotalPercentage();
      if (Math.abs(totalPct - 100) > 0.5) {
        toast({ title: "Error", description: "Percentages must add up to 100%.", variant: "destructive" });
        return;
      }
    }
    
    if (splitMode === "custom") {
      const totalCustom = getTotalCustom();
      if (Math.abs(totalCustom - totalAmount) > 0.01) {
        toast({ title: "Error", description: `Custom amounts must add up to €${totalAmount.toFixed(2)}.`, variant: "destructive" });
        return;
      }
    }

    const splits = calculateSplits();
    
    if (splits.length === 0) {
      toast({ title: "Error", description: "Select at least one person to split with.", variant: "destructive" });
      return;
    }

    mutate(
      {
        description,
        amount,
        category,
        splits,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setDescription("");
          setAmount("");
          setCategory("general");
          setSplitMode("equal");
          const resetSplits = members.map(m => ({
            userId: m.userId,
            included: true,
            percentage: 100 / members.length,
            customAmount: ""
          }));
          setMemberSplits(resetSplits);
          toast({ title: "Expense added", description: "Split saved successfully." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" });
        }
      }
    );
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.user?.firstName || member?.user?.email || "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full h-14 w-14 fixed bottom-6 right-6 shadow-xl shadow-primary/30 z-50 md:relative md:h-10 md:w-auto md:shadow-none md:bottom-auto md:right-auto md:rounded-md bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-add-expense">
          <Receipt className="h-6 w-6 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden md:inline">Add Expense</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add a new expense</DialogTitle>
          <DialogDescription>
            Scan a receipt or enter details manually.
          </DialogDescription>
        </DialogHeader>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 border-dashed border-2 py-6"
          data-testid="button-scan-receipt"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Scanning receipt...</span>
            </>
          ) : (
            <>
              <Camera className="h-6 w-6" />
              <div className="text-left">
                <p className="font-medium">Scan Receipt</p>
                <p className="text-xs text-muted-foreground">Take a photo or upload an image</p>
              </div>
            </>
          )}
        </Button>

        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <div className="h-px flex-1 bg-border" />
          <span>or enter manually</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Dinner at Mario's"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              data-testid="input-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                className="font-mono"
                data-testid="input-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="food">Food & Drink</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Split Method</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={splitMode === "equal" ? "default" : "outline"}
                onClick={() => setSplitMode("equal")}
                data-testid="button-split-equal"
              >
                <Users className="h-4 w-4 mr-1" />
                Equal
              </Button>
              <Button
                type="button"
                size="sm"
                variant={splitMode === "percentage" ? "default" : "outline"}
                onClick={() => setSplitMode("percentage")}
                data-testid="button-split-percentage"
              >
                <Percent className="h-4 w-4 mr-1" />
                Percentage
              </Button>
              <Button
                type="button"
                size="sm"
                variant={splitMode === "custom" ? "default" : "outline"}
                onClick={() => setSplitMode("custom")}
                data-testid="button-split-custom"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-md space-y-2 max-h-48 overflow-y-auto">
            {memberSplits.map((split) => (
              <div key={split.userId} className="flex items-center gap-2" data-testid={`split-row-${split.userId}`}>
                {splitMode === "equal" && (
                  <Checkbox
                    checked={split.included}
                    onCheckedChange={() => toggleMemberIncluded(split.userId)}
                    data-testid={`checkbox-include-${split.userId}`}
                  />
                )}
                <span className="flex-1 text-sm truncate">{getMemberName(split.userId)}</span>
                
                {splitMode === "equal" && split.included && amount && (
                  <span className="text-sm font-mono text-muted-foreground">
                    €{(parseFloat(amount) / memberSplits.filter(s => s.included).length).toFixed(2)}
                  </span>
                )}
                
                {splitMode === "percentage" && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={split.percentage}
                      onChange={(e) => updatePercentage(split.userId, e.target.value)}
                      className="w-16 text-sm font-mono"
                      min="0"
                      max="100"
                      data-testid={`input-percentage-${split.userId}`}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    {amount && (
                      <span className="text-sm font-mono text-muted-foreground ml-1">
                        €{((parseFloat(amount) * split.percentage) / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
                
                {splitMode === "custom" && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={split.customAmount}
                      onChange={(e) => updateCustomAmount(split.userId, e.target.value)}
                      className="w-20 text-sm font-mono"
                      placeholder="0.00"
                      data-testid={`input-custom-${split.userId}`}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {splitMode === "percentage" && (
              <div className={`text-xs pt-2 border-t ${Math.abs(getTotalPercentage() - 100) < 0.01 ? "text-green-600" : "text-destructive"}`}>
                Total: {getTotalPercentage().toFixed(1)}% {Math.abs(getTotalPercentage() - 100) < 0.01 ? "✓" : "(should be 100%)"}
              </div>
            )}
            
            {splitMode === "custom" && amount && (
              <div className={`text-xs pt-2 border-t ${Math.abs(getTotalCustom() - parseFloat(amount)) < 0.01 ? "text-green-600" : "text-destructive"}`}>
                Total: €{getTotalCustom().toFixed(2)} / €{parseFloat(amount).toFixed(2)} {Math.abs(getTotalCustom() - parseFloat(amount)) < 0.01 ? "✓" : ""}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full mt-4" data-testid="button-save-expense">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
