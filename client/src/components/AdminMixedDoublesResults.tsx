import { useState } from "react";
import { Info, AlertTriangle } from "lucide-react";

interface ResultRow {
  name: string;
  score: string;
}

const tabs = [
  { value: "mixed_doubles", label: "Холимог хосоор" },
  { value: "team", label: "Багийн" },
  { value: "doubles", label: "Хосоор" },
  { value: "singles", label: "Ганцаарчилсан" },
];

export function AdminMixedDoublesResults({ results = [] }: { results?: ResultRow[] }) {
  const [activeTab, setActiveTab] = useState("mixed_doubles");
  const hasData = results.length > 0;

  return (
    <div className="space-y-6">
      {/* Segmented control */}
      <div className="inline-flex overflow-hidden rounded-md border bg-white shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium focus:outline-none transition-colors ${activeTab === tab.value ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border-l-4 border-blue-500 bg-blue-50 p-4 text-blue-700">
          <Info className="mt-0.5 h-5 w-5" />
          <p className="text-sm">Энэ талбарт тэмцээний мэдээлэл харагдана.</p>
        </div>
        <div className="flex items-start gap-2 rounded-md border-l-4 border-yellow-500 bg-yellow-50 p-4 text-yellow-700">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <p className="text-sm">Мэдээлэл шинэчилсэний дараа хадгалахыг мартуузай.</p>
        </div>
      </div>

      {/* Card with content */}
      <div className="rounded-lg border bg-white p-6 shadow">
        {hasData ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Тоглогч</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Оноо</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((row, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-2 text-gray-900">{row.name}</td>
                    <td className="px-4 py-2 text-gray-900">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center text-gray-500">
            <img src="/placeholder.svg" alt="" className="h-32 w-32 opacity-50" />
            <p>Одоогоор үр дүн алга байна</p>
          </div>
        )}

        {/* Options */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <input id="mixed" type="radio" name="resultType" className="h-4 w-4" />
            <label htmlFor="mixed" className="text-sm font-medium text-gray-700">Холимог хосын</label>
          </div>
          <div className="flex items-center space-x-2">
            <input id="include" type="checkbox" className="h-4 w-4" />
            <label htmlFor="include" className="text-sm font-medium text-gray-700">Үр дүнг оруулах</label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Шигшээ тоглолт үүсгэх
          </button>
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Excel татах
          </button>
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Хоосон шигшээ үүсгэх
          </button>
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Хадгалах
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminMixedDoublesResults;
