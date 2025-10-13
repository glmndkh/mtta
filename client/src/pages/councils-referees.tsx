
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";

export default function RefereesCouncil() {
  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Шүүгчдийн зөвлөл
          </h1>
          <Card className="card-dark p-8">
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Шүүгчдийн зөвлөлийн мэдээлэл удахгүй нэмэгдэнэ.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWithLoading>
  );
}
