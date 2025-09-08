
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
};

export default function RegistrationForm({ tournament }: RegistrationFormProps) {
  const { isAuthenticated } = useAuth();
  const { profile, loading } = usePlayerProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!selectedCategory || !profile) return;

    const validation = validateEligibility(selectedCategory);
    if (!validation.valid) {
      toast({
        title: "Алдаа",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          category: selectedCategory
        }),
      });

      if (response.ok) {
        toast({
          title: "Амжилттай",
          description: "Амжилттай бүртгүүллээ",
        });
        setSelectedCategory('');
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'Бүртгэл хийхэд алдаа гарлаа';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show specific error message if available
      if (error instanceof Error && error.message !== 'Registration failed') {
        toast({
          title: "Алдаа",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Save to localStorage as fallback
        const registrationData = {
          tournamentId: tournament.id,
          category: selectedCategory,
          timestamp: new Date().toISOString(),
          profile: {
            fullName: profile.fullName,
            gender: profile.gender,
            age: calculateAge(profile.birthDate, tournament.startDate)
          }
        };
        
        localStorage.setItem(`reg-cache:${tournament.id}`, JSON.stringify(registrationData));
        
        toast({
          title: "Анхааруулга",
          description: "Бүртгэл түр хадгаллаа. Дараа дахин оролдоно уу.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Оролцох төрөл *</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Оролцох төрөл сонгоно уу" />
            </SelectTrigger>
            <SelectContent>
              {tournament.participationTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getParticipationTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Eligibility Warning */}
        {selectedCategory && !validation.valid && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm font-medium">
              ⚠️ {validation.error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCategory || !validation.valid || isSubmitting}
            className="bg-mtta-green hover:bg-green-700 text-white font-bold px-8"
          >
            {isSubmitting ? 'Бүртгүүлж байна...' : 'Бүртгүүлэх'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
