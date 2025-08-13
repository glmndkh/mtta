import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageWithLoading from "@/components/PageWithLoading";
import { ArrowLeft } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  leader?: string;
  leadershipMembers?: string;
  address?: string;
  location?: string;
  activities?: string;
  imageUrl?: string;
}

export default function BranchDetails() {
  const [match, params] = useRoute("/branches/:id");
  const branchId = params?.id;
  const { data: branch, isLoading } = useQuery<Branch>({
    queryKey: ["/api/branches", branchId],
    enabled: !!branchId,
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

  if (!branch) {
    return (
      <PageWithLoading>
        <Navigation />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/branches">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Буцах
            </Button>
          </Link>
          <p>Салбар холбоо олдсонгүй</p>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/branches">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>
        </Link>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{branch.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {branch.imageUrl && (
              <img src={branch.imageUrl} alt={branch.name} className="w-full h-64 object-cover rounded" />
            )}
            {branch.leader && <p><strong>Тэргүүлэгч:</strong> {branch.leader}</p>}
            {branch.leadershipMembers && <p><strong>Тэргүүлэгч гишүүд:</strong> {branch.leadershipMembers}</p>}
            {branch.address && <p><strong>Хаяг:</strong> {branch.address}</p>}
            {branch.location && <p><strong>Байршил:</strong> {branch.location}</p>}
            {branch.activities && <p><strong>Үйл ажиллагаа:</strong> {branch.activities}</p>}
          </CardContent>
        </Card>
      </div>
    </PageWithLoading>
  );
}

