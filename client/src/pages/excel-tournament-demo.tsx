import { ExcelLikeTournamentTable } from "@/components/ExcelLikeTournamentTable";
import type { User } from "@shared/schema";

// Demo page to showcase the Excel-like tournament results table
export default function ExcelTournamentDemo() {
  const handleSave = (results: any[]) => {
    console.log("Tournament results:", results);
    // Here you would typically send the data to your backend API
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Excel хэлбэрээр тэмцээний үр дүн оруулах
          </h1>
          <p className="text-gray-600">
            Тоглолтын үр дүнг хүснэгт хэлбэрээр оруулж, хадгалах боломжтой
          </p>
        </div>
        
        <ExcelLikeTournamentTable 
          onSave={handleSave}
          className="shadow-lg"
        />
      </div>
    </div>
  );
}