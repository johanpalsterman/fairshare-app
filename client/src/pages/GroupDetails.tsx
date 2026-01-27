import { useState } from "react";
import { useRoute } from "wouter";
import { useGroup } from "@/hooks/use-groups";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { useSettlements } from "@/hooks/use-settlements";
import { useAuth } from "@/hooks/use-auth";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { SettlementDialog } from "@/components/SettlementDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, User, ArrowRightLeft, Calendar, UserPlus, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GroupDetails() {
  const [, params] = useRoute("/groups/:id");
  const groupId = Number(params?.id);
  
  const { user } = useAuth();
  const { data: group, isLoading: isGroupLoading } = useGroup(groupId);
  const { data: expenses, isLoading: isExpensesLoading } = useExpenses(groupId);
  const { data: settlements } = useSettlements(groupId);
  const { mutate: deleteExpense } = useDeleteExpense(groupId);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("expenses");
  const [copied, setCopied] = useState(false);

  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${groupId}`
    : '';

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link to invite others." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  if (isGroupLoading || isExpensesLoading || !user) {
    return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-8" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!group) return <div>Group not found</div>;

  // Simple balance calculation (very basic for MVP)
  // Real app would use a debt simplification algorithm
  const balances: Record<string, number> = {};
  
  group.members.forEach(m => {
    balances[m.userId] = 0;
  });

  expenses?.forEach(exp => {
    const amount = Number(exp.amount);
    // User paid
    if (!balances[exp.paidBy]) balances[exp.paidBy] = 0;
    balances[exp.paidBy] += amount;

    // Splits (assuming equal split based on earlier logic, retrieved from backend would be better if full split details fetched)
    // Here we approximate based on member count for display if split details missing
    const splitAmount = amount / group.members.length;
    group.members.forEach(m => {
      if (!balances[m.userId]) balances[m.userId] = 0;
      balances[m.userId] -= splitAmount;
    });
  });

  settlements?.forEach(s => {
    const amount = Number(s.amount);
    // fromUser paid toUser
    if (balances[s.fromUserId] !== undefined) balances[s.fromUserId] += amount;
    if (balances[s.toUserId] !== undefined) balances[s.toUserId] -= amount;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">{group.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
            <UsersAvatars members={group.members} />
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-invite-members">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite people to {group.name}</DialogTitle>
                <DialogDescription>
                  Share this link with friends to invite them to your group.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 mt-4">
                <Input 
                  value={inviteLink} 
                  readOnly 
                  className="flex-1"
                  data-testid="input-invite-link"
                />
                <Button onClick={copyInviteLink} variant="outline" data-testid="button-copy-link">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <SettlementDialog groupId={groupId} members={group.members} currentUserId={user.id} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto rounded-none mb-6">
          <TabsTrigger 
            value="expenses" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger 
            value="balances" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Balances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {!expenses?.length && !settlements?.length ? (
            <div className="text-center py-12 text-muted-foreground">No expenses yet.</div>
          ) : (
            <div className="space-y-4">
              {/* Combine and sort expenses and settlements by date could be done here */}
              {expenses?.map((expense) => (
                <Card key={expense.id} className="overflow-hidden hover:bg-secondary/20 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {format(new Date(expense.date!), "MMM d")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {group.members.find(m => m.userId === expense.paidBy)?.user.firstName || 'Someone'} paid
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg font-mono">€{expense.amount}</span>
                      {expense.paidBy === user.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the expense and recalculate balances.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteExpense(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {settlements?.map((settlement) => (
                 <Card key={`set-${settlement.id}`} className="bg-secondary/30 border-dashed">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600">
                      <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {group.members.find(m => m.userId === settlement.fromUserId)?.user.firstName} paid {group.members.find(m => m.userId === settlement.toUserId)?.user.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(settlement.date!), "MMM d, yyyy")}</p>
                    </div>
                    <span className="font-bold font-mono text-green-600">€{settlement.amount}</span>
                  </CardContent>
                 </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="grid gap-4">
             {Object.entries(balances).map(([userId, balance]) => {
               const member = group.members.find(m => m.userId === userId);
               if (!member) return null;
               const isPositive = balance > 0;
               const isZero = Math.abs(balance) < 0.01;

               return (
                 <Card key={userId} className={userId === user.id ? "border-primary/50 bg-primary/5" : ""}>
                   <CardContent className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <Avatar>
                         <AvatarImage src={member.user.profileImageUrl} />
                         <AvatarFallback>{member.user.firstName?.[0]}</AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="font-medium">{member.user.firstName} {userId === user.id ? "(You)" : ""}</p>
                       </div>
                     </div>
                     <div className={`text-right ${isZero ? "text-muted-foreground" : isPositive ? "text-green-600" : "text-red-600"}`}>
                       <p className="font-bold font-mono text-lg">
                         {isPositive ? "+" : ""}€{balance.toFixed(2)}
                       </p>
                       <p className="text-xs">
                         {isZero ? "Settled up" : isPositive ? "gets back" : "owes"}
                       </p>
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
           </div>
        </TabsContent>
      </Tabs>

      <AddExpenseDialog groupId={groupId} members={group.members} />
    </div>
  );
}

function UsersAvatars({ members }: { members: any[] }) {
  return (
    <div className="flex -space-x-2">
      {members.map((m, i) => (
        <Avatar key={m.userId} className="border-2 border-background w-8 h-8">
          <AvatarImage src={m.user.profileImageUrl} />
          <AvatarFallback className="text-[10px]">{m.user.firstName?.[0]}</AvatarFallback>
        </Avatar>
      ))}
      <span className="pl-4 text-sm flex items-center">{members.length} members</span>
    </div>
  );
}
