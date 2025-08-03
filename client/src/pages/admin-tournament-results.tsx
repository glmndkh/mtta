import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, FileText, Grid3x3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DocumentEditor } from "@/components/DocumentEditorSimple";
import { SpreadsheetGrid } from "@/components/SpreadsheetGrid";

export default function AdminTournamentResultsPage() {
  const [match, params] = useRoute("/admin/tournament/:id/results");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // State for document editor and spreadsheet
  const [documentContent, setDocumentContent] = useState<string>('');
  const [knockoutGridData, setKnockoutGridData] = useState<any[][]>([]);

  const tournamentId = params?.id;

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  const handleSave = async () => {
    try {
      // Save both document and spreadsheet data
      const data = {
        tournamentId,
        documentContent,
        knockoutGridData
      };
      
      // You can add API call here to save the data
      console.log('Saving data:', data);
      
      toast({
        title: "Амжилттай хадгалагдлаа",
        description: "Баримт болон хүснэгт хадгалагдлаа",
      });
    } catch (error) {
      toast({
        title: "Алдаа гарлаа",
        description: "Хадгалахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/tournaments')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Баримт засварлагч - Тэмцээний үр дүн
                </h1>
                <p className="text-gray-600">
                  Word болон Excel шиг засварлах боломжтой
                </p>
              </div>
            </div>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Хадгалах
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="document" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="document" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Баримт засварлах (Word шиг)
            </TabsTrigger>
            <TabsTrigger value="spreadsheet" className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              Excel хүснэгт
            </TabsTrigger>
            <TabsTrigger value="preview">
              Урьдчилан үзэх
            </TabsTrigger>
          </TabsList>

          {/* Document Editor Tab */}
          <TabsContent value="document">
            <Card>
              <CardHeader>
                <CardTitle>Баримт бичгийн засварлагч</CardTitle>
                <CardDescription>
                  Word шиг текст, зураг, хүснэгт чөлөөтэй нэмж засварлана уу. 
                  Зургийг URL-аар нэмэх боломжтой.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <DocumentEditor
                    content={documentContent}
                    onChange={setDocumentContent}
                    placeholder="Энд текст бичиж, зураг, хүснэгт нэмнэ үү. Toolbar-оос форматлах боломжтой..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spreadsheet Tab */}
          <TabsContent value="spreadsheet">
            <Card>
              <CardHeader>
                <CardTitle>Excel маягийн хүснэгт</CardTitle>
                <CardDescription>
                  Excel шиг мөр, багана чөлөөтэй нэмж засварлана уу. 
                  Cells дээр дарж форматлах боломжтой.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpreadsheetGrid
                  initialRows={12}
                  initialCols={8}
                  data={knockoutGridData}
                  onChange={setKnockoutGridData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Урьдчилан үзэх</CardTitle>
                <CardDescription>
                  Баримт болон хүснэгтийн эцсийн дүр төрх
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Document Preview */}
                  {documentContent && (
                    <div className="border rounded-lg p-6 bg-white">
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        📄 Баримт бичиг
                      </h3>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: documentContent }}
                      />
                    </div>
                  )}
                  
                  {/* Grid Preview */}
                  {knockoutGridData.length > 0 && (
                    <div className="border rounded-lg p-6 bg-white overflow-auto">
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        📊 Excel хүснэгт
                      </h3>
                      <table className="w-full border-collapse border border-gray-300">
                        <tbody>
                          {knockoutGridData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td 
                                  key={colIndex}
                                  className="border border-gray-300 p-2 min-w-[100px]"
                                  style={{
                                    fontWeight: cell.style?.bold ? 'bold' : 'normal',
                                    fontStyle: cell.style?.italic ? 'italic' : 'normal',
                                    textAlign: cell.style?.textAlign || 'left',
                                    backgroundColor: cell.style?.backgroundColor || 'white'
                                  }}
                                >
                                  {cell.value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Empty State */}
                  {!documentContent && knockoutGridData.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-medium mb-2">Агуулга байхгүй</h3>
                      <p>
                        Дээрх табуудаас баримт эсвэл хүснэгт үүсгэнэ үү
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}