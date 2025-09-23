import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import RichTextEditor from "@/components/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Trophy, Calendar, Users, MapPin, DollarSign, Plus, X, Save, Eye, Upload, FileText, Award, ArrowLeft } from "lucide-react";
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
  events: z.array(z.object({
    type: z.enum(['SINGLES', 'DOUBLES', 'TEAM']),
    subType: z.string().optional(),
    genderReq: z.enum(['ANY', 'MALE', 'FEMALE', 'MIXED']).optional(),
    divisions: z.array(z.object({
      name: z.string(),
      minAge: z.number().optional(),
      maxAge: z.number().optional(),
    })).min(1, "Хамгийн багадаа нэг насны ангилал байх ёстой")
  })).min(1, "Хамгийн багадаа нэг ивэнт байх ёстой"),
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

export default function AdminTournamentCreate() {
  const { user, isAuthenticated, isLoading } = useAuth() as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check routes for create vs edit mode
  const [matchCreate] = useRoute("/admin/tournament-create");
  const [matchEdit, paramsEdit] = useRoute("/tournaments/:id/edit");

  const isEditing = !!matchEdit;
  const editingId = paramsEdit?.id;

  // Load tournament data for editing
  const { data: existingTournament, isLoading: tournamentLoading } = useQuery({
    queryKey: ['/api/tournaments', editingId],
    enabled: isEditing && !!editingId,
  });

  const [events, setEvents] = useState<any[]>([]);
  const [currentEvent, setCurrentEvent] = useState({
    type: 'SINGLES' as 'SINGLES' | 'DOUBLES' | 'TEAM',
    subType: '',
    genderReq: 'ANY' as 'ANY' | 'MALE' | 'FEMALE' | 'MIXED',
    divisions: [] as any[]
  });
  const [currentDivision, setCurrentDivision] = useState({
    name: '',
    minAge: '',
    maxAge: ''
  });
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
      events: [],
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

  useEffect(() => {
    if (events.length > 0) {
      form.setValue("events", events);
    }
  }, [events, form]);

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

  // Load existing tournament data when editing
  useEffect(() => {
    if (isEditing && existingTournament) {
      const tournament = existingTournament;

      // Set form values with proper formatting
      form.setValue("name", tournament.name || "");
      form.setValue("description", tournament.description || "");
      form.setValue("startDate", tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : "");
      form.setValue("endDate", tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 16) : "");
      form.setValue("registrationDeadline", tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().slice(0, 16) : "");
      form.setValue("location", tournament.location || "");
      form.setValue("organizer", tournament.organizer || "");
      form.setValue("maxParticipants", tournament.maxParticipants || 32);
      form.setValue("entryFee", parseFloat(tournament.entryFee) || 0);
      form.setValue("rules", tournament.rules || "");
      form.setValue("prizes", tournament.prizes || "");
      form.setValue("contactInfo", tournament.contactInfo || "");

      // Handle schedule parsing
      let scheduleText = "";
      if (tournament.schedule) {
        try {
          const parsed = JSON.parse(tournament.schedule);
          scheduleText = parsed.description || tournament.schedule;
        } catch {
          scheduleText = tournament.schedule;
        }
      }
      form.setValue("schedule", scheduleText);

      form.setValue("requirements", tournament.requirements || "");
      form.setValue("backgroundImageUrl", tournament.backgroundImageUrl || "");
      form.setValue("regulationDocumentUrl", tournament.regulationDocumentUrl || "");
      form.setValue("minRating", tournament.minRating || "");
      form.setValue("maxRating", tournament.maxRating || "");
      form.setValue("isPublished", tournament.isPublished || false);

      // Set state values
      setRichDescription(tournament.richDescription || "");
      setBackgroundImageUrl(tournament.backgroundImageUrl || "");
      setRegulationDocumentUrl(tournament.regulationDocumentUrl || "");

      // Parse participation types
      if (tournament.events) { // Changed from tournament.participationTypes to tournament.events
        const parsedEvents = tournament.events.map((eventData: any) => {
          try {
            const parsed = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
            // Ensure required fields exist and have default values if necessary
            return {
              type: parsed.type || 'SINGLES',
              subType: parsed.subType || '',
              genderReq: parsed.genderReq || 'ANY',
              divisions: parsed.divisions || [{ name: '', minAge: null, maxAge: null }]
            };
          } catch (e) {
            console.error("Error parsing event data:", e);
            // Return a default structure or handle error appropriately
            return { type: 'SINGLES', genderReq: 'ANY', divisions: [{ name: '', minAge: null, maxAge: null }] };
          }
        });
        setEvents(parsedEvents);

        // Update form events with the existing data
        form.setValue("events", parsedEvents);
      }
    }
  }, [isEditing, existingTournament, form]);

  // Mutation for creating/updating tournament
  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing ? `/api/admin/tournaments/${editingId}` : "/api/tournaments";
      const method = isEditing ? "PATCH" : "POST";

      await apiRequest(url, {
        method,
        body: JSON.stringify({
          ...data,
          richDescription,
          backgroundImageUrl,
          regulationDocumentUrl,
          schedule: data.schedule ? JSON.stringify({ description: data.schedule }) : null,
          events: data.events.map((event: any) => ({ // Ensure events are stringified if necessary by the API
            ...event,
            divisions: event.divisions.map((div: any) => ({
              name: div.name,
              minAge: div.minAge !== null && div.minAge !== '' ? parseInt(div.minAge) : null,
              maxAge: div.maxAge !== null && div.maxAge !== '' ? parseInt(div.maxAge) : null,
            }))
          }))
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: isEditing ? "Тэмцээн амжилттай шинэчлэгдлээ" : "Тэмцээн амжилттай үүсгэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tournaments'] });

      if (isEditing) {
        // Navigate back to tournament list after editing
        setTimeout(() => {
          setLocation("/admin/tournaments");
        }, 1000);
      } else {
        // Navigate to admin tournaments after creating
        setTimeout(() => {
          setLocation("/admin/tournaments");
        }, 1000);
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
          setLocation("/login");
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
    // Ensure we have events data
    if (events.length === 0) {
      toast({
        title: "Алдаа",
        description: "Хамгийн багадаа нэг тэмцээний төрөл нэмнэ үү",
        variant: "destructive",
      });
      return;
    }
    
    // Use events state instead of form data to ensure latest data
    const submissionData = {
      ...data,
      events: events
    };
    
    createTournamentMutation.mutate(submissionData);
  };

  // Helper function to generate age group label
  const generateAgeGroupLabel = (minAge: string | number | null, maxAge: string | number | null): string => {
    if (minAge === null && maxAge === null) return "Open";
    if (minAge !== null && maxAge !== null) return `${minAge}-${maxAge}`;
    if (minAge !== null) return `${minAge}+`;
    if (maxAge !== null) return `U${maxAge}`;
    return "";
  };

  // Helper function to generate division name
  const generateDivisionName = (type: string, gender: string, minAge: string | number | null, maxAge: string | number | null): string => {
    const typeLabel = type === "singles" ? "Дангаар" : type === "doubles" ? "Хос" : "Баг";
    const genderLabel = gender === "male" ? "Эрэгтэй" : gender === "female" ? "Эмэгтэй" : "Холимог";
    const ageLabel = generateAgeGroupLabel(minAge, maxAge);
    return `${typeLabel} ${genderLabel} ${ageLabel}`;
  };

  // Helper function to determine competition level
  const determineCompetitionLevel = (minAge: string | number | null, maxAge: string | number | null): string => {
    if (minAge === null && maxAge === null) return "open";
    const currentMaxAge = maxAge !== null ? parseInt(maxAge as string) : null;
    const currentMinAge = minAge !== null ? parseInt(minAge as string) : null;

    if (currentMaxAge !== null && currentMaxAge <= 12) return "children";
    if (currentMaxAge !== null && currentMaxAge <= 18) return "junior";
    if (currentMinAge !== null && currentMinAge >= 35) return "veterans";
    return "adult";
  };

  const addEvent = () => {
    // Basic validation
    if (!currentEvent.type) {
      toast({ title: "Алдаа", description: "Тэмцээний төрөл сонгоно уу", variant: "destructive" });
      return;
    }
    
    // Validate subType for DOUBLES and TEAM
    if ((currentEvent.type === 'DOUBLES' || currentEvent.type === 'TEAM') && !currentEvent.subType) {
      toast({ 
        title: "Алдаа", 
        description: `${currentEvent.type === 'DOUBLES' ? 'Хосийн төрөл' : 'Багийн төрөл'} сонгоно уу`, 
        variant: "destructive" 
      });
      return;
    }
    
    if (currentEvent.divisions.length === 0) {
      toast({ title: "Алдаа", description: "Хамгийн багадаа нэг насны ангилал оруулна уу", variant: "destructive" });
      return;
    }

    const newEvent = {
      ...currentEvent,
      divisions: currentEvent.divisions.map(div => ({
        name: div.name || generateDivisionName(currentEvent.type, currentEvent.genderReq.toLowerCase() as any, div.minAge, div.maxAge),
        minAge: div.minAge !== '' ? parseInt(div.minAge as string) : null,
        maxAge: div.maxAge !== '' ? parseInt(div.maxAge as string) : null,
      })),
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    
    // Update form events immediately to prevent sync issues
    form.setValue("events", updatedEvents);
    
    // Reset current event form
    setCurrentEvent({
      type: 'SINGLES',
      subType: '',
      genderReq: 'ANY',
      divisions: []
    });
    setCurrentDivision({ name: '', minAge: '', maxAge: '' });
    
    toast({
      title: "Амжилттай",
      description: "Тэмцээний төрөл нэмэгдлээ",
    });
  };

  const removeEvent = (eventToRemove: any) => {
    setEvents(events.filter((e) => e !== eventToRemove));
  };

  const addDivisionToEvent = () => {
    if (!currentDivision.name && (!currentDivision.minAge && !currentDivision.maxAge)) {
      toast({ title: "Алдаа", description: "Ангилалын нэр эсвэл насны хязгаар оруулна уу", variant: "destructive" });
      return;
    }

    // Generate default name if not provided
    const divisionName = currentDivision.name || generateDivisionName(currentEvent.type, currentEvent.genderReq.toLowerCase() as any, currentDivision.minAge, currentDivision.maxAge);

    const newDivision = {
      name: divisionName,
      minAge: currentDivision.minAge,
      maxAge: currentDivision.maxAge,
    };

    setCurrentEvent({
      ...currentEvent,
      divisions: [...currentEvent.divisions, newDivision],
    });
    setCurrentDivision({ name: '', minAge: '', maxAge: '' }); // Reset division form
  };

  const removeDivisionFromEvent = (divisionToRemove: any) => {
    setCurrentEvent({
      ...currentEvent,
      divisions: currentEvent.divisions.filter((d) => d !== divisionToRemove),
    });
  };


  const formatEventLabel = (event: any) => {
    let label = `${event.type === "SINGLES" ? "Дангаар" : event.type === "DOUBLES" ? "Хос" : "Баг"}`;
    
    // Add subType label for DOUBLES and TEAM
    if (event.subType) {
      const subTypeLabels: { [key: string]: string } = {
        'MEN_DOUBLES': 'Дан эр',
        'WOMEN_DOUBLES': 'Дан эм', 
        'MIXED_DOUBLES': 'Холимог хос',
        'MEN_TEAM': 'Эрэгтэйчүүдийн баг',
        'WOMEN_TEAM': 'Эмэгтэйчүүдийн баг',
        'MIXED_TEAM': 'Холимог баг'
      };
      label += ` - ${subTypeLabels[event.subType] || event.subType}`;
    }
    
    if (event.genderReq !== 'ANY') {
      label += ` (${event.genderReq === 'MALE' ? 'Эрэгтэй' : event.genderReq === 'FEMALE' ? 'Эмэгтэй' : 'Холимог'})`;
    }
    if (event.divisions && event.divisions.length > 0) {
      const divisionLabels = event.divisions.map((div: any) => div.name || generateDivisionName(event.type, event.genderReq.toLowerCase() as any, div.minAge, div.maxAge));
      label += `: ${divisionLabels.join(', ')}`;
    }
    return label;
  };

  if (isLoading || (isEditing && tournamentLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">{isEditing ? "Тэмцээний мэдээлэл ачаалж байна..." : "Уншиж байна..."}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || (user as any).role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditing ? "Тэмцээн Засах" : "Тэмцээн Үүсгэх"}</h1>
              <p className="text-gray-600">{isEditing ? "Тэмцээний мэдээлэл засварлах" : "Шинэ тэмцээн зохион байгуулж, дэлгэрэнгүй мэдээлэл оруулах"}</p>
            </div>
            <div className="flex space-x-3">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin/tournaments")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Цуцлах
                </Button>
              )}
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
                      <span className="ml-2">
                        {form.getValues('startDate') ? new Date(form.getValues('startDate')).toLocaleDateString('mn-MN') : 'Тодорхойгүй'} - {form.getValues('endDate') ? new Date(form.getValues('endDate')).toLocaleDateString('mn-MN') : 'Тодорхойгүй'}
                      </span>
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
                    {form.getValues('organizer') && (
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-mtta-green mr-2" />
                        <span className="font-medium">Зохион байгуулагч:</span>
                        <span className="ml-2">{form.getValues('organizer')}</span>
                      </div>
                    )}
                    {form.getValues('registrationDeadline') && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-mtta-green mr-2" />
                        <span className="font-medium">Бүртгэлийн хугацаа:</span>
                        <span className="ml-2">{new Date(form.getValues('registrationDeadline')).toLocaleDateString('mn-MN')}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Оролцооны төрлүүд:</h3>
                    <div className="flex flex-wrap gap-2">
                      {events.length > 0 ? events.map((event: any, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-mtta-green text-white rounded-full text-sm"
                        >
                          {formatEventLabel(event)}
                        </span>
                      )) : (
                        <span className="text-gray-500 text-sm">Ангилал нэмээгүй байна</span>
                      )}
                    </div>

                    {(form.getValues('rules') || form.getValues('prizes') || form.getValues('contactInfo')) && (
                      <div className="mt-4 space-y-2">
                        {form.getValues('rules') && (
                          <div>
                            <h4 className="font-medium text-sm">Дүрэм журам:</h4>
                            <p className="text-sm text-gray-600">{form.getValues('rules')}</p>
                          </div>
                        )}
                        {form.getValues('prizes') && (
                          <div>
                            <h4 className="font-medium text-sm">Шагнал урамшуулал:</h4>
                            <p className="text-sm text-gray-600">{form.getValues('prizes')}</p>
                          </div>
                        )}
                        {form.getValues('contactInfo') && (
                          <div>
                            <h4 className="font-medium text-sm">Холбоо барих:</h4>
                            <p className="text-sm text-gray-600">{form.getValues('contactInfo')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        form.getValues('isPublished')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {form.getValues('isPublished') ? 'Нийтлэгдсэн' : 'Ноорог'}
                      </span>
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
                        <Label className="text-sm font-medium mb-2 block">Дэлгэрэнгүй тайлбар (зураг, видео, файл хавсаргах боломжтой)</Label>
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
                                    <SelectItem value="none">Хязгаарлалт байхгүй</SelectItem>
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
                                    <SelectItem value="none">Хязгаарлалт байхгүй</SelectItem>
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
                          <FormItem className="flex flex-row items-center justify-between space-y-0 p-4 border rounded-lg">
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">Нийтлэх</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Тэмцээнийг шууд нийтэлж, бүртгэл эхлүүлэх
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className={`${
                                  field.value
                                    ? 'data-[state=checked]:bg-green-500'
                                    : 'data-[state=unchecked]:bg-white border-2 border-gray-300'
                                }`}
                                data-testid="switch-publish"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Participation Categories (Now Events) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Тэмцээний төрлүүд ба ангилал</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="events"
                        render={() => (
                          <FormItem>
                            <FormLabel>Тэмцээний төрлүүд *</FormLabel>
                            <div className="space-y-3">
                              {events.map((event, index) => (
                                <div key={index} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium">{formatEventLabel(event)}</span>
                                    </div>
                                    {event.divisions && event.divisions.length > 0 && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        Ангилалууд: {event.divisions.map((div: any) => div.name).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEvent(event)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {events.length === 0 && (
                                <p className="text-sm text-gray-500">Тэмцээний төрөл нэмээгүй байна</p>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Төрөл</Label>
                          <Select value={currentEvent.type} onValueChange={(value: any) => setCurrentEvent({ ...currentEvent, type: value, subType: '' })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Тэмцээний төрөл сонгох" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SINGLES">
                                <div className="flex flex-col">
                                  <span className="font-medium">Дангаар тэмцээн</span>
                                  <span className="text-xs text-gray-500">Нэг тоглогчийн тэмцээн</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="DOUBLES">
                                <div className="flex flex-col">
                                  <span className="font-medium">Хос тэмцээн</span>
                                  <span className="text-xs text-gray-500">Хоёр тоглогчийн баг</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="TEAM">
                                <div className="flex flex-col">
                                  <span className="font-medium">Багийн тэмцээн</span>
                                  <span className="text-xs text-gray-500">Олон тоглогчийн баг</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sub-type selection for DOUBLES and TEAM */}
                        {(currentEvent.type === 'DOUBLES' || currentEvent.type === 'TEAM') && (
                          <div>
                            <Label className="text-sm font-medium mb-1 block">
                              {currentEvent.type === 'DOUBLES' ? 'Хосийн төрөл' : 'Багийн төрөл'}
                            </Label>
                            <Select value={currentEvent.subType} onValueChange={(value: any) => setCurrentEvent({ ...currentEvent, subType: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder={currentEvent.type === 'DOUBLES' ? 'Хосийн төрөл сонгох' : 'Багийн төрөл сонгох'} />
                              </SelectTrigger>
                              <SelectContent>
                                {currentEvent.type === 'DOUBLES' ? (
                                  <>
                                    <SelectItem value="MEN_DOUBLES">Дан эр</SelectItem>
                                    <SelectItem value="WOMEN_DOUBLES">Дан эм</SelectItem>
                                    <SelectItem value="MIXED_DOUBLES">Холимог хос</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="MEN_TEAM">Эрэгтэйчүүдийн баг</SelectItem>
                                    <SelectItem value="WOMEN_TEAM">Эмэгтэйчүүдийн баг</SelectItem>
                                    <SelectItem value="MIXED_TEAM">Холимог баг</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm font-medium mb-1 block">Хүйс</Label>
                          <Select value={currentEvent.genderReq} onValueChange={(value: any) => setCurrentEvent({ ...currentEvent, genderReq: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Хүйс сонгох" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ANY">Бүгд</SelectItem>
                              <SelectItem value="MALE">Эрэгтэй</SelectItem>
                              <SelectItem value="FEMALE">Эмэгтэй</SelectItem>
                              <SelectItem value="MIXED">Холимог</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium mb-1 block">Насны ангилал</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              value={currentDivision.name}
                              onChange={(e) => setCurrentDivision({ ...currentDivision, name: e.target.value })}
                              placeholder="Ангилал (жишээ: U18)"
                              className="col-span-1"
                            />
                            <Input
                              value={currentDivision.minAge}
                              onChange={(e) => setCurrentDivision({ ...currentDivision, minAge: e.target.value })}
                              placeholder="Нас (хамгийн бага)"
                              type="number"
                              min="0"
                              max="100"
                              className="col-span-1"
                            />
                            <Input
                              value={currentDivision.maxAge}
                              onChange={(e) => setCurrentDivision({ ...currentDivision, maxAge: e.target.value })}
                              placeholder="Нас (хамгийн их)"
                              type="number"
                              min="0"
                              max="100"
                              className="col-span-1"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addDivisionToEvent}
                          disabled={!currentDivision.name && !currentDivision.minAge && !currentDivision.maxAge}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Насны ангилал нэмэх
                        </Button>

                        {currentEvent.divisions.length > 0 && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Одоогийн ангилалууд:</strong> {currentEvent.divisions.map((div: any, idx: number) => (
                                <span key={idx} className="mr-2">
                                  {div.name || generateDivisionName(currentEvent.type, currentEvent.genderReq.toLowerCase() as any, div.minAge, div.maxAge)}
                                  {idx < currentEvent.divisions.length - 1 && ','}
                                </span>
                              ))}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={addEvent}
                        disabled={
                          !currentEvent.type || 
                          currentEvent.divisions.length === 0 ||
                          ((currentEvent.type === 'DOUBLES' || currentEvent.type === 'TEAM') && !currentEvent.subType)
                        }
                        className="w-full mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Төрөл нэмэх
                      </Button>
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
                      {createTournamentMutation.isPending
                        ? (isEditing ? "Шинэчилж байна..." : "Хадгалж байна...")
                        : (isEditing ? "Тэмцээн шинэчлэх" : "Тэмцээн үүсгэх")
                      }
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