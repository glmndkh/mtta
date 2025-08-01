import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import RichTextEditor from "@/components/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Trophy, Calendar, Users, MapPin, DollarSign, Plus, X, Save, Eye, Upload, FileText, Award } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";

const tournamentSchema = z.object({
  name: z.string().min(1, "Тэмцээний нэр заавал байх ёстой"),
  description: z.string().optional(),
  richDescription: z.string().optional(),
  startDate: z.string().min(1, "Эхлэх огноо заавал байх ёстой"),
  endDate: z.string().min(1, "Дуусах огноо заавал байх ёстой"),
  registrationDeadline: z.string().optional(),
  location: z.string().min(1, "Байршил заавал байх ёстой"),
  organizer: z.string().optional(),
  maxParticipants: z.number().min(1, "Хамгийн багадаа 1 оролцогч байх ёстой"),
  entryFee: z.number().min(0, "Оролцооны төлбөр 0 болон түүнээс дээш байх ёстой"),
  participationTypes: z.array(z.string()).min(1, "Хамгийн багадаа 1 төрөл сонгоно уу"),
  rules: z.string().optional(),
  prizes: z.string().optional(),
  contactInfo: z.string().optional(),
  schedule: z.string().optional(),
  requirements: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  regulationDocumentUrl: z.string().optional(),
  minRating: z.string().optional(),
  maxRating: z.string().optional(),
  isPublished: z.boolean().default(false),
});

const defaultParticipationTypes = [
  { id: "singles", label: "Дан бие" },
  { id: "doubles", label: "Хос" },
  { id: "mixed_doubles", label: "Холимог хос" },
  { id: "team", label: "Баг" },
];

export default function AdminTournamentGenerator() {
  const { user, isAuthenticated, isLoading } = useAuth() as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [customParticipationTypes, setCustomParticipationTypes] = useState<string[]>([]);
  const [newParticipationType, setNewParticipationType] = useState("");
  const [richDescription, setRichDescription] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [regulationDocumentUrl, setRegulationDocumentUrl] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      toast({
        title: "Хандах эрхгүй",
        description: "Зөвхөн админ хэрэглэгч тэмцээн үүсгэх боломжтой",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const ratingOptions = [
    "none",
    "Beginner",
    "Intermediate", 
    "Advanced",
    "Expert",
    "Professional"
  ];

  const form = useForm({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      richDescription: "",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      location: "",
      organizer: "",
      maxParticipants: 32,
      entryFee: 0,
      participationTypes: [],
      rules: "",
      prizes: "",
      contactInfo: "",
      schedule: "",
      requirements: "",
      backgroundImageUrl: "",
      regulationDocumentUrl: "",
      minRating: "none",
      maxRating: "none",
      isPublished: false,
    }
  });

  // File upload handlers
  const handleBackgroundImageUpload = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { uploadURL } = await response.json();
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleBackgroundImageComplete = async (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      const finalizeResponse = await fetch("/api/objects/finalize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileURL: uploadURL, isPublic: true }),
      });
      const { objectPath } = await finalizeResponse.json();
      setBackgroundImageUrl(objectPath);
      form.setValue("backgroundImageUrl", objectPath);
      toast({
        title: "Амжилттай",
        description: "Арын зураг амжилттай хуулагдлаа",
      });
    }
  };

  const handleRegulationDocumentUpload = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { uploadURL } = await response.json();
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleRegulationDocumentComplete = async (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      const finalizeResponse = await fetch("/api/objects/finalize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileURL: uploadURL, isPublic: false }),
      });
      const { objectPath } = await finalizeResponse.json();
      setRegulationDocumentUrl(objectPath);
      form.setValue("regulationDocumentUrl", objectPath);
      toast({
        title: "Амжилттай",
        description: "Дүрмийн баримт бичиг амжилттай хуулагдлаа",
      });
    }
  };

  const addCustomParticipationType = () => {
    if (newParticipationType.trim() && !customParticipationTypes.includes(newParticipationType.trim())) {
      setCustomParticipationTypes([...customParticipationTypes, newParticipationType.trim()]);
      setNewParticipationType("");
    }
  };

  const removeCustomParticipationType = (typeToRemove: string) => {
    setCustomParticipationTypes(customParticipationTypes.filter(type => type !== typeToRemove));
    const currentTypes = form.getValues("participationTypes");
    form.setValue("participationTypes", currentTypes.filter(type => type !== typeToRemove));
  };

  const createTournament = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/tournaments', data);
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай үүсгэлээ!",
        description: "Тэмцээн амжилттай бүртгэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
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

  const onSubmit = (data: any) => {
    const finalData = {
      ...data,
      richDescription: richDescription,
      backgroundImageUrl: backgroundImageUrl,
      regulationDocumentUrl: regulationDocumentUrl,
      participationTypes: [...data.participationTypes, ...customParticipationTypes],
      minRating: data.minRating === "none" ? null : parseInt(data.minRating) || null,
      maxRating: data.maxRating === "none" ? null : parseInt(data.maxRating) || null,
    };
    
    createTournament.mutate(finalData);
  };

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

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-mtta-green mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Тэмцээн үүсгэх
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Шинэ тэмцээн үүсгэн зохион байгуулж, оролцогчдыг бүртгүүлэх боломжтой
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-mtta-green" />
                  Үндсэн мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тэмцээний нэр *</FormLabel>
                        <FormControl>
                          <Input placeholder="Улаанбаатар Open 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organizer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Зохион байгуулагч</FormLabel>
                        <FormControl>
                          <Input placeholder="МШТХ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Товч тайлбар</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Тэмцээний товч тайлбар оруулна уу..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="text-sm font-medium mb-2 block">Дэлгэрэнгүй тайлбар</Label>
                  <RichTextEditor
                    content={richDescription}
                    onChange={setRichDescription}
                    placeholder="Тэмцээний дэлгэрэнгүй мэдээллийг энд оруулна уу..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date and Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-mtta-green" />
                  Огноо ба байршил
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Эхлэх огноо *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дуусах огноо *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Бүртгэлийн хугацаа</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Байршил *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ширээний теннисний төв" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Media Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-mtta-green" />
                  Файл хуулах
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Арын зураг</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={handleBackgroundImageUpload}
                      onComplete={handleBackgroundImageComplete}
                      buttonClassName="w-full"
                    >
                      <div className="flex items-center justify-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Арын зураг хуулах
                      </div>
                    </ObjectUploader>
                    {backgroundImageUrl && (
                      <p className="text-sm text-green-600 mt-2">✓ Арын зураг хуулагдлаа</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Дүрмийн баримт бичиг</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={handleRegulationDocumentUpload}
                      onComplete={handleRegulationDocumentComplete}
                      buttonClassName="w-full"
                    >
                      <div className="flex items-center justify-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Дүрмийн баримт хуулах
                      </div>
                    </ObjectUploader>
                    {regulationDocumentUrl && (
                      <p className="text-sm text-green-600 mt-2">✓ Дүрмийн баримт хуулагдлаа</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-mtta-green" />
                  Тэмцээний тохиргоо
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Хамгийн их оролцогчийн тоо</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Оролцооны төлбөр (₮)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Rating Restrictions */}
                <div>
                  <Label className="text-sm font-medium mb-4 block">Зэрэглэлийн хязгаарлалт</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Хамгийн бага зэрэглэл</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Сонгоно уу" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating === "none" ? "Хязгаарлалтгүй" : rating}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Хамгийн их зэрэглэл</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Сонгоно уу" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating === "none" ? "Хязгаарлалтгүй" : rating}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Participation Types */}
                <div>
                  <Label className="text-sm font-medium mb-4 block">Оролцооны төрөл *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {defaultParticipationTypes.map((type) => (
                      <FormField
                        key={type.id}
                        control={form.control}
                        name="participationTypes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, type.id])
                                    : field.onChange(field.value?.filter((value) => value !== type.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {type.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  
                  {/* Custom Participation Types */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newParticipationType}
                        onChange={(e) => setNewParticipationType(e.target.value)}
                        placeholder="Шинэ төрөл нэмэх..."
                        className="flex-1"
                      />
                      <Button type="button" onClick={addCustomParticipationType} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {customParticipationTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customParticipationTypes.map((type) => (
                          <div key={type} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {type}
                            <button
                              type="button"
                              onClick={() => removeCustomParticipationType(type)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Нэмэлт мэдээлэл</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дүрэм журам</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Тэмцээний дүрэм журам..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prizes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Шагнал урамшуулал</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Шагнал урамшуулалын мэдээлэл..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Холбоо барих мэдээлэл</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Утас, и-мэйл..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Шаардлага</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Оролцоход тавигдах шаардлагууд..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хуваарь</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Тэмцээний хуваарь..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Publishing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-mtta-green" />
                  Нийтлэх тохиргоо
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Шууд нийтлэх</FormLabel>
                        <p className="text-sm text-gray-600">
                          Тэмцээнийг үүсгэх дайтад шууд нийтлэн оролцогчдын бүртгэлийг эхлүүлэх
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/tournaments')}
              >
                Цуцлах
              </Button>
              <Button 
                type="submit" 
                className="mtta-green text-white hover:bg-mtta-green-dark"
                disabled={createTournament.isPending}
              >
                {createTournament.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Үүсгэж байна...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Тэмцээн үүсгэх
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}