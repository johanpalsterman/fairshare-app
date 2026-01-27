import { useRoute, useLocation } from "wouter";
import { useGroup, useJoinGroup } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogIn, CheckCircle } from "lucide-react";

interface PublicGroupInfo {
  id: number;
  name: string;
  currency: string;
  memberCount: number;
  members: { firstName: string | null; profileImageUrl: string | null }[];
}

export default function JoinGroup() {
  const [, params] = useRoute("/join/:id");
  const [, setLocation] = useLocation();
  const groupId = Number(params?.id);

  const { user, isLoading: isAuthLoading } = useAuth();
  
  const { data: publicGroup, isLoading: isPublicLoading, error: publicError } = useQuery<PublicGroupInfo>({
    queryKey: ['/api/groups', groupId, 'public'],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/public`);
      if (!res.ok) throw new Error("Group not found");
      return res.json();
    },
    enabled: !user
  });

  const { data: group, isLoading: isGroupLoading, error } = useGroup(groupId);
  const { mutate: joinGroup, isPending } = useJoinGroup();

  const displayGroup = user ? group : publicGroup;
  const isLoading = user ? isGroupLoading : isPublicLoading;
  const hasError = user ? error : publicError;

  const isAlreadyMember = user && group?.members?.some(m => m.userId === user?.id);

  const handleJoin = () => {
    joinGroup(groupId, {
      onSuccess: () => {
        setLocation(`/groups/${groupId}`);
      }
    });
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError || !displayGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Group not found</CardTitle>
            <CardDescription>
              This invite link may be invalid or the group no longer exists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full" data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user && publicGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Join "{publicGroup.name}"</CardTitle>
            <CardDescription>
              You've been invited to join this expense group. Log in to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center -space-x-2">
              {publicGroup.members.slice(0, 5).map((m, i) => (
                <Avatar key={i} className="border-2 border-background w-10 h-10">
                  <AvatarImage src={m.profileImageUrl || undefined} />
                  <AvatarFallback>{m.firstName?.[0] || "?"}</AvatarFallback>
                </Avatar>
              ))}
              {publicGroup.members.length > 5 && (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                  +{publicGroup.members.length - 5}
                </div>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {publicGroup.memberCount} member{publicGroup.memberCount !== 1 ? "s" : ""} in this group
            </p>
            <a href="/api/login" className="block">
              <Button className="w-full" data-testid="button-login-to-join">
                <LogIn className="h-4 w-4 mr-2" />
                Log in to join
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadyMember && group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>You're already a member!</CardTitle>
            <CardDescription>
              You're already part of "{group.name}".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation(`/groups/${groupId}`)} className="w-full" data-testid="button-go-to-group">
              Go to group
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Join "{group.name}"</CardTitle>
          <CardDescription>
            You've been invited to join this expense group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center -space-x-2">
            {group.members.slice(0, 5).map((m) => (
              <Avatar key={m.userId} className="border-2 border-background w-10 h-10">
                <AvatarImage src={m.user?.profileImageUrl} />
                <AvatarFallback>{m.user?.firstName?.[0] || "?"}</AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 5 && (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                +{group.members.length - 5}
              </div>
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {group.members.length} member{group.members.length !== 1 ? "s" : ""} already in this group
          </p>
          <Button onClick={handleJoin} disabled={isPending} className="w-full" data-testid="button-join-group">
            {isPending ? "Joining..." : "Join group"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
