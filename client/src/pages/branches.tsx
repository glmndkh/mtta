import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageWithLoading from "@/components/PageWithLoading";

interface Branch {
  id: string;
  name: string;
  location?: string;
  leader?: string;
}

export default function Branches() {
  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWithLoading>
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Салбар холбоод</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Link key={branch.id} href={`/branches/${branch.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{branch.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {branch.location && (
                    <p className="text-sm text-gray-600">{branch.location}</p>
                  )}
                  {branch.leader && (
                    <p className="text-sm text-gray-600">Тэргүүлэгч: {branch.leader}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageWithLoading>
  );
}

