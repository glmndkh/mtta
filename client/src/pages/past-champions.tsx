import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";

export default function PastChampions() {
  return (
    <PageWithLoading>
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Үе үеийн аваргууд</h1>
        <p className="text-gray-600">Энд аваргуудын мэдээлэл байрлана.</p>
      </div>
    </PageWithLoading>
  );
}

