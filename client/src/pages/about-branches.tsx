
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Building2 } from "lucide-react";

// Helper function to get image URL
function getImageUrl(imageUrl?: string): string {
  if (!imageUrl) return "";
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/public-objects/")) return imageUrl;
  if (imageUrl.startsWith("/objects/")) return imageUrl;
  if (imageUrl.startsWith("/")) return `/public-objects${imageUrl}`;
  return `/public-objects/${imageUrl}`;
}

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
                <div key={branch.id} className="flip-card h-[400px]">
                  <div className="flip-card-inner">
                    {/* Front side */}
                    <div className="flip-card-front">
                      <Card className="card-dark h-full border-2 border-mtta-green/20">
                        {/* Logo image in upper half */}
                        <div className="h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-mtta-green/10 to-mtta-green/5 flex items-center justify-center">
                          {branch.imageUrl ? (
                            <img
                              src={getImageUrl(branch.imageUrl)}
                              alt={branch.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `
                                  <div class="text-6xl text-mtta-green/30">🏓</div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="text-6xl text-mtta-green/30">🏓</div>
                          )}
                        </div>
                        
                        {/* Content in lower half */}
                        <CardHeader className="pb-3">
                          <CardTitle className="text-gray-900 dark:text-white text-lg">
                            {branch.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {branch.leader && (
                            <div className="flex items-start gap-2">
                              <Building2 className="h-4 w-4 text-mtta-green mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Тэргүүлэгч</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{branch.leader}</div>
                              </div>
                            </div>
                          )}
                          {branch.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-mtta-green mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-gray-600 dark:text-gray-400">{branch.address}</div>
                            </div>
                          )}
                          <div className="text-xs text-center text-mtta-green/60 dark:text-mtta-green/80 pt-2">
                            Эргүүлж харах →
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Back side - Activities */}
                    <div className="flip-card-back">
                      <Card className="card-dark h-full border-2 border-mtta-green/40 bg-gradient-to-br from-mtta-green/10 to-mtta-green/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-gray-900 dark:text-white text-lg">
                            {branch.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="text-sm font-semibold text-mtta-green mb-2">Үйл ажиллагаа</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {branch.activities || 'Мэдээлэл байхгүй'}
                            </div>
                          </div>
                          
                          {branch.phone && (
                            <div className="flex items-start gap-2">
                              <Phone className="h-4 w-4 text-mtta-green mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-gray-600 dark:text-gray-400">{branch.phone}</div>
                            </div>
                          )}
                          {branch.email && (
                            <div className="flex items-start gap-2">
                              <Mail className="h-4 w-4 text-mtta-green mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-gray-600 dark:text-gray-400 break-all">{branch.email}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .flip-card {
          background-color: transparent;
          perspective: 1000px;
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </PageWithLoading>
  );
}
