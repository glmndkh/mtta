
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Building2 } from "lucide-react";

export default function AboutBranches() {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['/api/branches'],
  });

  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Салбар холбоо
          </h1>
          
          {isLoading ? (
            <div className="text-center py-12">Ачааллаж байна...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch: any) => (
                <Card key={branch.id} className="card-dark">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">{branch.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {branch.leader && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-green-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Тэргүүлэгч</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{branch.leader}</div>
                        </div>
                      </div>
                    )}
                    {branch.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-400 mt-0.5" />
                        <div className="text-sm text-gray-600 dark:text-gray-300">{branch.address}</div>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-green-400 mt-0.5" />
                        <div className="text-sm text-gray-600 dark:text-gray-300">{branch.phone}</div>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-green-400 mt-0.5" />
                        <div className="text-sm text-gray-600 dark:text-gray-300">{branch.email}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}
