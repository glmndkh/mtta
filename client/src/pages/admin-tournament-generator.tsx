import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TournamentData {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  prizeMoney: string;
  backgroundImage: string;
  categories: string[];
  eventInfoUrl: string;
  ticketUrl: string;
  id: string;
}

const CATEGORY_OPTIONS = [
  { id: "men_singles", label: "Эрэгтэй ганцаарчилсан", value: "men_singles" },
  { id: "women_singles", label: "Эмэгтэй ганцаарчилсан", value: "women_singles" },
  { id: "men_doubles", label: "Эрэгтэй хосоор", value: "men_doubles" },
  { id: "women_doubles", label: "Эмэгтэй хосоор", value: "women_doubles" },
  { id: "mixed_doubles", label: "Холимог хосоор", value: "mixed_doubles" },
  { id: "team", label: "Багийн төрөл", value: "team" }
];

export default function AdminTournamentGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "18:00",
    location: "",
    prizeMoney: "",
    backgroundImage: "",
    categories: [] as string[],
    eventInfoUrl: "",
    ticketUrl: ""
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (categoryValue: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, categoryValue]
        : prev.categories.filter(cat => cat !== categoryValue)
    }));
  };

  const generateTournamentId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const saveTournament = useMutation({
    mutationFn: async (tournamentData: any) => {
      return apiRequest('POST', '/api/tournaments', tournamentData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Амжилттай үүсгэлээ!",
        description: "Тэмцээн амжилттай үүсгэгдлээ.",
      });
      
      // Also save to localStorage for immediate display
      const localTournament = {
        id: data.id,
        name: formData.name,
        startDate: data.startDate,
        endDate: data.endDate,
        location: formData.location,
        prizeMoney: formData.prizeMoney || 'TBD',
        backgroundImage: formData.backgroundImage || '',
        categories: formData.categories.filter((cat: string) => cat.trim() !== ''),
        eventInfoUrl: formData.eventInfoUrl || '',
        ticketUrl: formData.ticketUrl || ''
      };
      
      const existingTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
      existingTournaments.unshift(localTournament);
      localStorage.setItem('tournaments', JSON.stringify(existingTournaments));
      
      // Redirect to the tournaments page to see the new tournament
      setLocation('/tournaments');
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Нэвтрэх шаардлагатай",
          description: "Та дахин нэвтэрнэ үү",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        return;
      }
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Тэмцээн үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime || !formData.location) {
      toast({
        title: "Алдаа",
        description: "Заавал бөглөх талбаруудыг бөглөнө үү",
        variant: "destructive"
      });
      return;
    }

    if (formData.categories.length === 0) {
      toast({
        title: "Алдаа", 
        description: "Дор хаяж нэг төрөл сонгоно уу",
        variant: "destructive"
      });
      return;
    }

    const tournamentId = generateTournamentId();
    
    // Combine date and time for proper datetime strings
    const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
    const endDateTime = `${formData.endDate}T${formData.endTime}:00`;
    
    const tournamentData = {
      name: formData.name,
      description: `${formData.name} тэмцээн`,
      startDate: startDateTime,
      endDate: endDateTime,
      location: formData.location,
      maxParticipants: 32,
      entryFee: 0,
      participationTypes: ['singles', 'doubles'],
      isPublished: true,
      status: 'upcoming'
    };

    saveTournament.mutate(tournamentData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Тэмцээний хуудас үүсгэх
          </h1>
          <p className="text-gray-600">
            WTT Champions загварын тэмцээний хуудас автоматаар үүсгэх
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Тэмцээний мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tournament Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Тэмцээний нэр *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="жишээ: Улаанбаатар Open 2025"
                  required
                />
              </div>

              {/* Dates and Times */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Эхлэх огноо *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Эхлэх цаг *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Дуусах огноо *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Дуусах цаг *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Байршил *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="жишээ: Талын спорт цогцолбор, Улаанбаатар"
                  required
                />
              </div>

              {/* Prize Money */}
              <div className="space-y-2">
                <Label htmlFor="prizeMoney">Шагналын сан</Label>
                <Input
                  id="prizeMoney"
                  value={formData.prizeMoney}
                  onChange={(e) => handleInputChange('prizeMoney', e.target.value)}
                  placeholder="жишээ: ₮100,000,000"
                />
              </div>

              {/* Background Image */}
              <div className="space-y-2">
                <Label htmlFor="backgroundImage">Арын зураг (URL)</Label>
                <Input
                  id="backgroundImage"
                  value={formData.backgroundImage}
                  onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                  placeholder="https://example.com/background.jpg"
                />
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label>Тэмцээний төрлүүд *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CATEGORY_OPTIONS.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={formData.categories.includes(category.value)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category.value, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={category.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventInfoUrl">Тэмцээний мэдээллийн холбоос</Label>
                  <Input
                    id="eventInfoUrl"
                    value={formData.eventInfoUrl}
                    onChange={(e) => handleInputChange('eventInfoUrl', e.target.value)}
                    placeholder="https://example.com/event-info"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketUrl">Тасалбарын холбоос</Label>
                  <Input
                    id="ticketUrl"
                    value={formData.ticketUrl}
                    onChange={(e) => handleInputChange('ticketUrl', e.target.value)}
                    placeholder="https://example.com/tickets"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin/tournament-create")}
                >
                  Цуцлах
                </Button>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={saveTournament.isPending}
                >
                  {saveTournament.isPending ? "Үүсгэж байна..." : "Тэмцээний хуудас үүсгэх"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}