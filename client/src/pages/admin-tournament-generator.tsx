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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy, Calendar, Users, MapPin, DollarSign, Plus, X, Save, Eye, Upload } from "lucide-react";
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

export default function AdminTournamentGenerator() {
  const { user, isAuthenticated, isLoading } = useAuth() as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Parse query params
  const params = new URLSearchParams(window.location.search);
  const editingId = params.get('id');
  const isEditing = !!editingId;

  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [gender, setGender] = useState("male");
  const [participationCategories, setParticipationCategories] = useState<
    Array<{ minAge: number | null; maxAge: number | null; gender: string }>
  >([]);
  const [richDescription, setRichDescription] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [regulationDocumentUrl, setRegulationDocumentUrl] = useState("");
  const [isLoadingTournament, setIsLoadingTournament] = useState(false);

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
      participationTypes: [] as string[],
      rules: "",
      prizes: "",
      contactInfo: "",
      schedule: "",
      requirements: "",
      backgroundImageUrl: "",
      regulationDocumentUrl: "",
      minRating: "none",
      maxRating: "none",
      isPublished: true,
    }
  });

  useEffect(() => {
    form.setValue("participationTypes", participationCategories.map(c => JSON.stringify(c)));
  }, [participationCategories, form]);

  // Load existing tournament when editing
  useEffect(() => {
    if (isEditing && editingId) {
      setIsLoadingTournament(true);
      (async () => {
        try {
          const res = await apiRequest(`/api/tournaments/${editingId}`);
          const data = await res.json();
          const parsedCats = (data.participationTypes || []).map((t: string) => {
            try {
              const obj = JSON.parse(t);
              if ("minAge" in obj || "maxAge" in obj) {
                return {
                  minAge: obj.minAge ?? null,
                  maxAge: obj.maxAge ?? null,
                  gender: obj.gender || "male",
                };
              }
              if ("age" in obj) {
                const ageStr = String(obj.age);
                const nums = ageStr.match(/\d+/g)?.map(Number) || [];
                let min: number | null = null;
                let max: number | null = null;
                if (nums.length === 1) {
                  if (/хүртэл/i.test(ageStr)) max = nums[0];
                  else min = nums[0];
                } else if (nums.length >= 2) {
                  [min, max] = nums;
                }
                return { minAge: min, maxAge: max, gender: obj.gender || "male" };
              }
              return { minAge: null, maxAge: null, gender: obj.gender || "male" };
            } catch {
              const ageStr = t;
              const nums = ageStr.match(/\d+/g)?.map(Number) || [];
              let min: number | null = null;
              let max: number | null = null;
              if (nums.length === 1) {
                if (/хүртэл/i.test(ageStr)) max = nums[0];
                else min = nums[0];
              } else if (nums.length >= 2) {
                [min, max] = nums;
              }
              return { minAge: null, maxAge: null, gender: "male" };
            }
          });
          setParticipationCategories(parsedCats);

          // Set form values with proper type handling
          form.setValue("name", data.name || "");
          form.setValue("description", data.description || "");
          form.setValue("startDate", data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "");
          form.setValue("endDate", data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "");
          form.setValue("registrationDeadline", data.registrationDeadline ? new Date(data.registrationDeadline).toISOString().slice(0, 16) : "");
          form.setValue("location", data.location || "");
          form.setValue("organizer", data.organizer || "");
          form.setValue("maxParticipants", Number(data.maxParticipants) || 32);
          form.setValue("entryFee", Number(data.entryFee) || 0);
          form.setValue("rules", data.rules || "");
          form.setValue("prizes", data.prizes || "");
          form.setValue("contactInfo", data.contactInfo || "");
          form.setValue("schedule", data.schedule || "");
          form.setValue("requirements", data.requirements || "");
          form.setValue("backgroundImageUrl", data.backgroundImageUrl || "");
          form.setValue("regulationDocumentUrl", data.regulationDocumentUrl || "");
          form.setValue("minRating", data.minRating || "none");
          form.setValue("maxRating", data.maxRating || "none");
          form.setValue("isPublished", Boolean(data.isPublished));

          // Set state values
          setRichDescription(data.richDescription || "");
          setBackgroundImageUrl(data.backgroundImageUrl || "");
          setRegulationDocumentUrl(data.regulationDocumentUrl || "");

        } catch (error) {
          console.error("Failed to load tournament data:", error);
          toast({
            title: "Алдаа",
            description: "Тэмцээний мэдээлэл ачаалахад алдаа гарлаа",
            variant: "destructive",
          });
        } finally {
          setIsLoadingTournament(false);
        }
      })();
    }
  }, [isEditing, editingId, form, toast]);

  // Mutation for creating/updating tournament
  const tournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        richDescription,
        backgroundImageUrl,
        regulationDocumentUrl,
        schedule: data.schedule ? JSON.stringify({ description: data.schedule }) : null,
      };

      if (isEditing && editingId) {
        await apiRequest("PUT", `/api/admin/tournaments/${editingId}`, payload);
      } else {
        await apiRequest("POST", "/api/tournaments", payload);
      }
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: isEditing ? "Тэмцээн амжилттай шинэчлэгдлээ" : "Тэмцээн амжилттай үүсгэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tournaments'] });

      if (!isEditing) {
        form.reset();
        setRichDescription("");
        setBackgroundImageUrl("");
        setRegulationDocumentUrl("");
      }

      if (isEditing) {
        setLocation("/admin/tournaments");
      }
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
        description: isEditing ? "Тэмцээн шинэчлэхэд алдаа гарлаа" : "Тэмцээн үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    tournamentMutation.mutate(data);
  };

  // Participation type management

  const addParticipationCategory = () => {
    if (!minAge && !maxAge) {
      toast({
        title: "Алдаа",
        description: "Хамгийн багадаа нэг нас оруулна уу",
        variant: "destructive",
      });
      return;
    }

    const category = {
      minAge: minAge ? parseInt(minAge) : null,
      maxAge: maxAge ? parseInt(maxAge) : null,
      gender,
    };

    // Create JSON string format for the category
    const categoryString = JSON.stringify(category);

    setParticipationCategories([...participationCategories, category]);

    // Update form participationTypes with JSON string
    const currentTypes = form.getValues("participationTypes") || [];
    form.setValue("participationTypes", [...currentTypes, categoryString]);

    setMinAge("");
    setMaxAge("");
  };

  const removeParticipationCategory = (index: number) => {
    setParticipationCategories(participationCategories.filter((_, i) => i !== index));
  };

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
        body: JSON.stringify({ fileURL: result.successful[0].uploadURL, isPublic: true }),
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
        body: JSON.stringify({ fileURL: result.successful[0].uploadURL, isPublic: false }),
      });
      const { objectPath } = await response.json();
      setRegulationDocumentUrl(objectPath);
      form.setValue("regulationDocumentUrl", objectPath);
      toast({
        title: "Амжилттай",
        description: "Дүрмийн баримт бичиг амжилттай хуулагдлаа",
      });
    }
  };

  if (isLoading || isLoadingTournament) {
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

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-mtta-green mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              {isEditing ? 'Тэмцээн засах' : 'Тэмцээн үүсгэх'}
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isEditing
              ? 'Тэмцээний мэдээллийг шинэчлэнэ үү'
              : 'Шинэ тэмцээн үүсгэн зохион байгуулж, оролцогчдыг бүртгүүлэх боломжтой'}
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
                  <FormField
                    control={form.control}
                    name="backgroundImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Арын зураг</FormLabel>
                        {backgroundImageUrl && (
                          <img
                            src={backgroundImageUrl.startsWith('/') ? `/public-objects${backgroundImageUrl}` : backgroundImageUrl}
                            alt="background"
                            className="w-full h-40 object-cover mb-2 rounded"
                          />
                        )}
                        <ObjectUploader
                          onGetUploadParameters={handleBackgroundImageUpload}
                          onComplete={handleBackgroundImageComplete}
                        >
                          Зураг хуулах
                        </ObjectUploader>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="regulationDocumentUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дүрмийн баримт бичиг</FormLabel>
                        {regulationDocumentUrl && (
                          <a
                            href={regulationDocumentUrl.startsWith('/') ? `/public-objects${regulationDocumentUrl}` : regulationDocumentUrl}
                            target="_blank"
                            className="text-blue-600 underline block mb-2"
                          >
                            Татаж авах
                          </a>
                        )}
                        <ObjectUploader
                          onGetUploadParameters={handleRegulationUpload}
                          onComplete={handleRegulationComplete}
                        >
                          Файл хуулах
                        </ObjectUploader>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                        placeholder="Доод нас"
                        className="w-24"
                      />
                      <Input
                        type="number"
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value)}
                        placeholder="Дээд нас"
                        className="w-24"
                      />
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Хүйс" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Эрэгтэй</SelectItem>
                          <SelectItem value="female">Эмэгтэй</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addParticipationCategory} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {participationCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {participationCategories.map((cat, idx) => {
                          let label = "";
                          if (cat.minAge !== null && cat.maxAge !== null)
                            label = `${cat.minAge}-${cat.maxAge}`;
                          else if (cat.minAge !== null) label = `${cat.minAge}+`;
                          else if (cat.maxAge !== null) label = `${cat.maxAge}-аас доош`;
                          else label = "Нас хязгааргүй";
                          return (
                            <div key={idx} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {`${label} ${cat.gender === 'male' ? 'эрэгтэй' : 'эмэгтэй'}`}
                              <button
                                type="button"
                                onClick={() => {
                                  const newCategories = participationCategories.filter((_, i) => i !== idx);
                                  setParticipationCategories(newCategories);

                                  // Update form participationTypes by removing the corresponding JSON string
                                  const categoryString = JSON.stringify(cat);
                                  const currentTypes = form.getValues("participationTypes") || [];
                                  const updatedTypes = currentTypes.filter(type => type !== categoryString);
                                  form.setValue("participationTypes", updatedTypes);
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
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
                onClick={() => setLocation(isEditing ? '/admin-dashboard' : '/tournaments')}
              >
                Цуцлах
              </Button>
              <Button
                type="submit"
                className="mtta-green text-white hover:bg-mtta-green-dark"
                disabled={tournamentMutation.isPending}
              >
                {tournamentMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Шинэчлэж байна...' : 'Үүсгэж байна...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Тэмцээн шинэчлэх' : 'Тэмцээн үүсгэх'}
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