import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

type RegistrationFormProps = {
  tournament: {
    id: string;
    startDate: string;
    participationTypes: string[];
    eligibility?: Record<string, {
      genders?: ("male"|"female")[];
      minAge?: number;
      maxAge?: number;
    }>;
  };
  preselectedCategory?: string;
  onSuccess?: () => void;
};

export default function RegistrationForm({ tournament, preselectedCategory, onSuccess }: RegistrationFormProps) {
  const { isAuthenticated, user } = useAuth();
  const { data: profile, loading } = usePlayerProfile();

  // Check user registration status
  const { data: userRegistrations = [], refetch: refetchRegistrations } = useQuery({
    queryKey: ["/api/registrations/me", { tid: tournament.id }],
    enabled: !!user,
  });

  const isRegistered = userRegistrations.length > 0;

  const [selectedCategory, setSelectedCategory] = useState<string>(preselectedCategory || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected category when preselected category changes
  React.useEffect(() => {
    if (preselectedCategory && !selectedCategory) {
      setSelectedCategory(preselectedCategory);
    }
  }, [preselectedCategory, selectedCategory]);

  // Calculate age on tournament start date
  const calculateAge = (birthDate: string, startDate: string): number => {
    const birth = new Date(birthDate);
    const start = new Date(startDate);
    let age = start.getFullYear() - birth.getFullYear();
    const monthDiff = start.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && start.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  // Get participation type label
  const getParticipationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'singles_men': 'Эрэгтэй дан',
      'singles_women': 'Эмэгтэй дан',
      'doubles_men': 'Эрэгтэй хос',
      'doubles_women': 'Эмэгтэй хос',
      'mixed_doubles': 'Холимог хос',
      'singles': 'Дан',
      'doubles': 'Хос',
      'team': 'Баг',
      'individual': 'Хувь хүн'
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'singles_men': 'Эрэгтэй дан',
      'singles_women': 'Эмэгтэй дан',
      'doubles_men': 'Эрэгтэй хос',
      'doubles_women': 'Эмэгтэй хос',
      'mixed_doubles': 'Холимог хос'
    };
    return labels[type] || type;
  };

  // Validate eligibility for selected category
  const validateEligibility = (category: string): { valid: boolean; error?: string } => {
    if (!profile || !category) return { valid: false };

    const age = calculateAge(profile.birthDate, tournament.startDate);

    // Default gender rules
    const defaultRules: Record<string, { genders: ("male"|"female")[] }> = {
      'singles_men': { genders: ['male'] },
      'doubles_men': { genders: ['male'] },
      'singles_women': { genders: ['female'] },
      'doubles_women': { genders: ['female'] },
      'mixed_doubles': { genders: ['male', 'female'] }
    };

    // Get eligibility rules (custom or default)
    const eligibility = tournament.eligibility?.[category] || defaultRules[category];

    if (eligibility) {
      // Gender check
      if (eligibility.genders && !eligibility.genders.includes(profile.gender)) {
        const allowedGenders = eligibility.genders.map(g => g === 'male' ? 'эрэгтэй' : 'эмэгтэй').join(', ');
        return { valid: false, error: `Энэ төрөлд зөвхөн ${allowedGenders} оролцох боломжтой` };
      }

      // Age check
      if (eligibility.minAge && age < eligibility.minAge) {
        return { valid: false, error: `Хамгийн багадаа ${eligibility.minAge} настай байх ёстой` };
      }
      if (eligibility.maxAge && age > eligibility.maxAge) {
        return { valid: false, error: `Хамгийн ихдээ ${eligibility.maxAge} настай байх ёстой` };
      }
    }

    return { valid: true };
  };

  const registerMutation = useMutation({
    mutationFn: async (data: { category: string }) => {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tournamentId: tournament.id,
          category: data.category,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Бүртгүүлэхэд алдаа гарлаа");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/tournaments", tournament.id, "participants"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/registrations/me"],
      });
      refetchRegistrations();
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    const validation = validateEligibility(selectedCategory);
    if (!validation.valid) {
      toast({
        title: "Алдаа",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    registerMutation.mutate({ category: selectedCategory });
  };

  // Not authenticated - show login CTA
  if (!isAuthenticated) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Бүртгүүлэх</CardTitle>
          <CardDescription>
            Тэмцээнд бүртгүүлэхийн тулд нэвтэрч орно уу
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={`/login?redirect=/events/${tournament.id}%23register`}>
            <Button className="bg-mtta-green hover:bg-green-700 text-white font-bold px-8">
              Нэвтэрч бүртгүүлэх
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Бүртгүүлэх</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Бүртгүүлэх</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Профайлын мэдээлэл олдсонгүй.</p>
        </CardContent>
      </Card>
    );
  }

  const age = calculateAge(profile.birthDate, tournament.startDate);
  const validation = selectedCategory ? validateEligibility(selectedCategory) : { valid: true };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Бүртгүүлэх</CardTitle>
        <CardDescription>
          Тэмцээнд оролцох төрөл сонгоод бүртгүүлнэ үү
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Information (Read-only) */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Таны мэдээлэл
          </Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {profile.fullName}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {profile.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {age} нас
            </Badge>
          </div>
        </div>

        {isRegistered ? (
          <div className="space-y-4">
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                Амжилттай бүртгэгдлээ
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Та энэ тэмцээнд бүртгэгдсэн байна
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {userRegistrations.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                  >
                    {getCategoryLabel(category)}
                  </span>
                ))}
              </div>
            </div>
            <Button disabled className="w-full" variant="secondary">
              Бүртгэгдсэн
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Оролцох төрөл сонгох
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {tournament.participationTypes?.map((type) => {
                  const validation = validateEligibility(type);
                  const isDisabled = !validation.valid;

                  return (
                    <div
                      key={type}
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                        selectedCategory === type
                          ? "border-primary bg-primary/5"
                          : isDisabled
                            ? "border-muted bg-muted/20 opacity-60 cursor-not-allowed"
                            : "border-border hover:border-primary/50 hover:bg-accent/50",
                      )}
                      onClick={() => !isDisabled && setSelectedCategory(type)}
                    >
                      <input
                        type="radio"
                        name="participationType"
                        value={type}
                        checked={selectedCategory === type}
                        onChange={() => !isDisabled && setSelectedCategory(type)}
                        disabled={isDisabled}
                        className="text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-foreground cursor-pointer">
                          {getCategoryLabel(type)}
                        </label>
                        {validation.error && (
                          <p className="text-xs text-destructive mt-1">
                            {validation.error}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                !selectedCategory ||
                !validateEligibility(selectedCategory).valid ||
                registerMutation.isPending
              }
            >
              {registerMutation.isPending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}