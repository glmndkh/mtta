
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

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

interface FormData {
  lastName: string;
  firstName: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  participationType: string;
}

export default function RegistrationForm({ tournament }: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    lastName: '',
    firstName: '',
    gender: '',
    birthDate: '',
    participationType: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Validate eligibility
  const validateEligibility = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.lastName.trim()) newErrors.lastName = 'Овог оруулна уу';
    if (!formData.firstName.trim()) newErrors.firstName = 'Нэр оруулна уу';
    if (!formData.gender) newErrors.gender = 'Хүйс сонгоно уу';
    if (!formData.birthDate) newErrors.birthDate = 'Төрсөн огноо оруулна уу';
    if (!formData.participationType) newErrors.participationType = 'Оролцох төрөл сонгоно уу';

    if (Object.keys(newErrors).length > 0) {
      return newErrors;
    }

    const age = calculateAge(formData.birthDate, tournament.startDate);
    const selectedType = formData.participationType;

    // Default gender rules
    const defaultRules: Record<string, { genders: ("male"|"female")[] }> = {
      'singles_men': { genders: ['male'] },
      'doubles_men': { genders: ['male'] },
      'singles_women': { genders: ['female'] },
      'doubles_women': { genders: ['female'] },
      'mixed_doubles': { genders: ['male', 'female'] }
    };

    // Get eligibility rules (custom or default)
    const eligibility = tournament.eligibility?.[selectedType] || defaultRules[selectedType];

    if (eligibility) {
      // Gender check
      if (eligibility.genders && !eligibility.genders.includes(formData.gender as "male"|"female")) {
        const allowedGenders = eligibility.genders.map(g => g === 'male' ? 'эрэгтэй' : 'эмэгтэй').join(', ');
        newErrors.gender = `Энэ төрөлд зөвхөн ${allowedGenders} оролцох боломжтой`;
      }

      // Age check
      if (eligibility.minAge && age < eligibility.minAge) {
        newErrors.birthDate = `Хамгийн багадаа ${eligibility.minAge} настай байх ёстой`;
      }
      if (eligibility.maxAge && age > eligibility.maxAge) {
        newErrors.birthDate = `Хамгийн ихдээ ${eligibility.maxAge} настай байх ёстой`;
      }
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateEligibility();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
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
          ...formData
        }),
      });

      if (response.ok) {
        toast({
          title: "Амжилттай",
          description: "Амжилттай бүртгүүллээ",
        });
        // Reset form
        setFormData({
          lastName: '',
          firstName: '',
          gender: '',
          birthDate: '',
          participationType: ''
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      // Save to localStorage as fallback
      const registrationData = {
        tournamentId: tournament.id,
        ...formData,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`reg-cache:${tournament.id}`, JSON.stringify(registrationData));
      
      toast({
        title: "Анхааруулга",
        description: "Бүртгэл хадгалагдлаа (түр)",
        variant: "default"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const validationErrors = validateEligibility();
    return Object.keys(validationErrors).length === 0;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lastName">Овог *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Овог оруулна уу"
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="firstName">Нэр *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Нэр оруулна уу"
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gender">Хүйс *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
              <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                <SelectValue placeholder="Хүйс сонгоно уу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Эрэгтэй</SelectItem>
                <SelectItem value="female">Эмэгтэй</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
            )}
          </div>

          <div>
            <Label htmlFor="birthDate">Төрсөн огноо *</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className={errors.birthDate ? 'border-red-500' : ''}
            />
            {errors.birthDate && (
              <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
            )}
            {formData.birthDate && (
              <p className="text-sm text-gray-600 mt-1">
                Тэмцээний өдөр: {calculateAge(formData.birthDate, tournament.startDate)} нас
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="participationType">Оролцох төрөл *</Label>
          <Select value={formData.participationType} onValueChange={(value) => handleInputChange('participationType', value)}>
            <SelectTrigger className={errors.participationType ? 'border-red-500' : ''}>
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
          {errors.participationType && (
            <p className="text-red-500 text-sm mt-1">{errors.participationType}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!isFormValid() || isSubmitting}
            className="bg-mtta-green hover:bg-green-700 text-white font-bold px-8"
          >
            {isSubmitting ? 'Бүртгүүлж байна...' : 'Бүртгүүлэх'}
          </Button>
        </div>
      </form>
    </div>
  );
}
