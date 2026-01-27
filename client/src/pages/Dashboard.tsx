import { useGroups } from "@/hooks/use-groups";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { data: groups, isLoading } = useGroups();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your expense groups.</p>
        </div>
        <CreateGroupDialog />
      </div>

      {!groups || groups.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No groups yet</h3>
          <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            Create a group to start tracking expenses with your friends or coworkers.
          </p>
          <CreateGroupDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate pr-4">{group.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(group.createdAt!).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-primary mt-4 group-hover:translate-x-1 transition-transform">
                    View expenses <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
