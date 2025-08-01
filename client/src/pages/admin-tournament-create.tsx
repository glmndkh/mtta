import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

export default function AdminTournamentCreate() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      minRating: "",
      maxRating: "",
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
    if (result.successful?.[0]?.uploadURL) {
      const response = await fetch("/api/objects/finalize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileURL: result.successful[0].uploadURL,
          isPublic: true,
        }),
      });
      const { objectPath } = await response.json();
      setBackgroundImageUrl(objectPath);
      form.setValue("backgroundImageUrl", objectPath);
      toast({
        title: "Амжилттай",
        description: "Арын зураг амжилттай хуулагдлаа",
      });
    }
  };

  const handleRegulationUpload = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { uploadURL } = await response.json();
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleRegulationComplete = async (result: any) => {
    if (result.successful?.[0]?.uploadURL) {
      const response = await fetch("/api/objects/finalize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileURL: result.successful[0].uploadURL,
          isPublic: false,
        }),
      });
      const { objectPath } = await response.json();
      setRegulationDocumentUrl(objectPath);
      form.setValue("regulationDocumentUrl", objectPath);
      toast({
        title: "Амжилттай", 
        description: "Журмын баримт бичиг амжилттай хуулагдлаа",
      });
    }
  };

  // Mutation for creating tournament
  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/tournaments", {
        ...data,
        richDescription,
        backgroundImageUrl,
        regulationDocumentUrl,
        schedule: data.schedule ? JSON.stringify({ description: data.schedule }) : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Тэмцээн амжилттай үүсгэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      form.reset();
      setRichDescription("");
      setBackgroundImageUrl("");
      setRegulationDocumentUrl("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Нэвтрэх шаардлагатай",
          description: "Та дахин нэвтэрнэ үү...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Алдаа",
        description: "Тэмцээн үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createTournamentMutation.mutate(data);
  };

  const addCustomParticipationType = () => {
    if (newParticipationType.trim() && !customParticipationTypes.includes(newParticipationType.trim())) {
      setCustomParticipationTypes([...customParticipationTypes, newParticipationType.trim()]);
      setNewParticipationType("");
    }
  };

  const removeCustomParticipationType = (type: string) => {
    setCustomParticipationTypes(customParticipationTypes.filter(t => t !== type));
  };

  const allParticipationTypes = [
    ...defaultParticipationTypes,
    ...customParticipationTypes.map(type => ({ id: type, label: type }))
  ];

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

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Тэмцээн Үүсгэх</h1>
              <p className="text-gray-600">Шинэ тэмцээн зохион байгуулж, дэлгэрэнгүй мэдээлэл оруулах</p>
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Засах" : "Урьдчилан үзэх"}
              </Button>
            </div>
          </div>
        </div>

        {previewMode ? (
          /* Preview Mode */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                Тэмцээний урьдчилан үзэлт
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {form.getValues('name') || 'Тэмцээний нэр'}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {form.getValues('description') || 'Тэмцээний товч тайлбар'}
                  </p>
                  {richDescription && (
                    <div 
                      className="prose max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: richDescription }}
                    />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-mtta-green mr-2" />
                      <span className="font-medium">Огноо:</span>
                      <span className="ml-2">{form.getValues('startDate')} - {form.getValues('endDate')}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-mtta-green mr-2" />
                      <span className="font-medium">Байршил:</span>
                      <span className="ml-2">{form.getValues('location') || 'Тодорхойгүй'}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-mtta-green mr-2" />
                      <span className="font-medium">Оролцогчид:</span>
                      <span className="ml-2">Хамгийн ихдээ {form.getValues('maxParticipants')} хүн</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-mtta-green mr-2" />
                      <span className="font-medium">Оролцооны төлбөр:</span>
                      <span className="ml-2">{form.getValues('entryFee')}₮</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Оролцооны төрлүүд:</h3>
                    <div className="flex flex-wrap gap-2">
                      {form.getValues('participationTypes').map((type: string) => (
                        <span key={type} className="px-3 py-1 bg-mtta-green text-white rounded-full text-sm">
                          {allParticipationTypes.find(t => t.id === type)?.label || type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Edit Mode */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Basic Information */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Үндсэн мэдээлэл</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тэмцээний нэр *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Жишээ: Өвлийн Аварга Шалгаруулалт 2024" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Товч тайлбар</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Тэмцээний товч тайлбар..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label>Дэлгэрэнгүй тайлбар (зураг, видео, файл хавсаргах боломжтой)</Label>
                        <RichTextEditor
                          content={richDescription}
                          onChange={setRichDescription}
                          placeholder="Тэмцээний дэлгэрэнгүй мэдээлэл, зураг, видео, файл оруулах..."
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Schedule & Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Хуваарь ба байршил</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Эхлэх огноо *</FormLabel>
                              <FormControl>
                                <Input {...field} type="datetime-local" />
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
                                <Input {...field} type="datetime-local" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="registrationDeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Бүртгэлийн хугацаа</FormLabel>
                            <FormControl>
                              <Input {...field} type="datetime-local" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Байршил *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Жишээ: МУИС спорт заал" />
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
                              <Input {...field} placeholder="Жишээ: МУИС Спорт клуб" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="schedule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дэлгэрэнгүй хуваарь</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Өдрийн хуваарь, тоглолтын цагийн хуваарь..."
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Нэмэлт мэдээлэл</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="rules"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дүрэм журам</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Тэмцээний дүрэм журам..."
                                rows={4}
                              />
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
                              <Textarea 
                                {...field} 
                                placeholder="1-р байр: 500,000₮, 2-р байр: 300,000₮..."
                                rows={3}
                              />
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
                            <FormLabel>Оролцооны шаардлага</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Насны хязгаар, клубын гишүүнчлэл гэх мэт..."
                                rows={3}
                              />
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
                              <Textarea 
                                {...field} 
                                placeholder="Утас: +976 9999-9999, И-мэйл: info@mtta.mn"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* File Uploads */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Upload className="h-5 w-5 mr-2" />
                        Файл хуулах
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Арын зураг</Label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={handleBackgroundImageUpload}
                          onComplete={handleBackgroundImageComplete}
                          buttonClassName="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {backgroundImageUrl ? "Арын зураг солих" : "Арын зураг хуулах"}
                        </ObjectUploader>
                        {backgroundImageUrl && (
                          <p className="text-sm text-green-600 mt-2">✓ Арын зураг хуулагдлаа</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG файл хуулж болно (макс 5MB)</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Тэмцээний журам</Label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760} // 10MB
                          onGetUploadParameters={handleRegulationUpload}
                          onComplete={handleRegulationComplete}
                          buttonClassName="w-full"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {regulationDocumentUrl ? "Журмын баримт солих" : "Журмын баримт хуулах"}
                        </ObjectUploader>
                        {regulationDocumentUrl && (
                          <p className="text-sm text-green-600 mt-2">✓ Журмын баримт хуулагдлаа</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">PDF, DOCX файл хуулж болно (макс 10MB)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Settings */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Тохиргоо</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="maxParticipants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Хамгийн их оролцогч *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1"
                                onChange={e => field.onChange(parseInt(e.target.value))}
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
                                {...field} 
                                type="number" 
                                min="0"
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Rating Restrictions */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-mtta-green" />
                          <Label className="text-sm font-medium">Зэрэглэлийн хязгаарлалт</Label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="minRating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Хамгийн доод зэрэг</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Сонгох" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="">Хязгаарлалт байхгүй</SelectItem>
                                    {ratingOptions.map((rating) => (
                                      <SelectItem key={rating} value={rating}>
                                        {rating}
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
                                <FormLabel>Хамгийн дээд зэрэг</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Сонгох" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="">Хязгаарлалт байхгүй</SelectItem>
                                    {ratingOptions.map((rating) => (
                                      <SelectItem key={rating} value={rating}>
                                        {rating}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          Зэрэглэлийн хязгаарлалт тавбал зөвхөн тохирох зэрэгтэй тамирчид тэмцээнд оролцох боломжтой
                        </p>
                      </div>

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
                              <p className="text-sm text-muted-foreground">
                                Тэмцээнийг шууд нийтэлж, бүртгэл эхлүүлэх
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Participation Types */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Оролцооны төрлүүд</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="participationTypes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Сонгох *</FormLabel>
                            <div className="space-y-2">
                              {allParticipationTypes.map((type) => (
                                <div key={type.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={type.id}
                                    checked={field.value?.includes(type.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, type.id]);
                                      } else {
                                        field.onChange(field.value?.filter((val: string) => val !== type.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={type.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {type.label}
                                  </label>
                                  {customParticipationTypes.includes(type.id) && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCustomParticipationType(type.id)}
                                      className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div>
                        <Label>Шинэ төрөл нэмэх</Label>
                        <div className="flex space-x-2 mt-2">
                          <Input
                            value={newParticipationType}
                            onChange={(e) => setNewParticipationType(e.target.value)}
                            placeholder="Жишээ: Ахмад настнуудын хос"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomParticipationType())}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomParticipationType}
                            disabled={!newParticipationType.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Buttons */}
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full mtta-green text-white hover:bg-mtta-green-dark"
                      disabled={createTournamentMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createTournamentMutation.isPending ? "Хадгалж байна..." : "Тэмцээн үүсгэх"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}