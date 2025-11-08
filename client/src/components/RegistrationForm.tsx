import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { cn, formatName } from '@/lib/utils';
import { ChevronLeft, ChevronRight, User, CheckCircle, CreditCard, Trophy } from 'lucide-react';

type RegistrationStep = 'auth' | 'profile' | 'event-selection' | 'payment' | 'confirmation';

// Utility function to convert event JSON to readable Mongolian text
const getEventLabel = (eventType: string): string => {
  try {
    const parsed = JSON.parse(eventType);
    const SUBTYPE_LABEL: Record<string, string> = {
      'MEN_SINGLES': 'Эрэгтэй ганцаарчилсан',
      'WOMEN_SINGLES': 'Эмэгтэй ганцаарчилсан',
      'MEN_DOUBLES': 'Дан эрэгтэй хос',
      'WOMEN_DOUBLES': 'Дан эмэгтэй хос',
      'MIXED_DOUBLES': 'Холимог хос',
      'MEN_TEAM': 'Эрэгтэй баг',
      'WOMEN_TEAM': 'Эмэгтэй баг',
      'MIXED_TEAM': 'Холимог баг',
    };

    // Handle event with subType (preferred format)
    if (parsed.subType && SUBTYPE_LABEL[parsed.subType]) {
      let label = SUBTYPE_LABEL[parsed.subType];
      if (parsed.minAge !== undefined && parsed.maxAge !== undefined) {
        label += ` ${parsed.minAge}–${parsed.maxAge} нас`;
      } else if (parsed.minAge !== undefined) {
        label += ` ${parsed.minAge}+ нас`;
      } else if (parsed.maxAge !== undefined) {
        label += ` ${parsed.maxAge} нас хүртэл`;
      }
      return label;
    }

    // Handle divisions array format
    if (parsed.divisions && Array.isArray(parsed.divisions) && parsed.divisions.length > 0) {
      const div = parsed.divisions[0];
      let typeLabel = '';
      
      // Add gender first
      let genderLabel = '';
      if (parsed.genderReq === 'MALE') {
        genderLabel = 'Эрэгтэй';
      } else if (parsed.genderReq === 'FEMALE') {
        genderLabel = 'Эмэгтэй';
      } else if (parsed.genderReq === 'MIXED') {
        genderLabel = 'Холимог';
      }

      // Determine type label
      if (parsed.type === 'DOUBLES') {
        typeLabel = genderLabel ? `${genderLabel} хос` : 'Хос';
      } else if (parsed.type === 'TEAM') {
        typeLabel = genderLabel ? `${genderLabel} баг` : 'Баг';
      } else if (parsed.type === 'SINGLES') {
        typeLabel = genderLabel ? `${genderLabel} ганцаарчилсан` : 'Ганцаарчилсан';
      }

      // Add age range
      if (div.minAge !== undefined && div.minAge !== null && div.maxAge !== undefined && div.maxAge !== null) {
        typeLabel += ` ${div.minAge}–${div.maxAge} нас`;
      } else if (div.minAge !== undefined && div.minAge !== null) {
        typeLabel += ` ${div.minAge}+ нас`;
      } else if (div.maxAge !== undefined && div.maxAge !== null) {
        typeLabel += ` ${div.maxAge} нас хүртэл`;
      }

      return typeLabel;
    }

    // Handle division field
    if (parsed.division) {
      return parsed.division;
    }

    // Legacy format with type and gender
    if (parsed.type && parsed.gender) {
      let typeLabel = '';
      if (parsed.type === 'individual') {
        typeLabel = parsed.gender === 'male' ? 'Эрэгтэй ганцаарчилсан' : 'Эмэгтэй ганцаарчилсан';
      } else if (parsed.type === 'pair') {
        typeLabel = parsed.gender === 'male' ? 'Дан эрэгтэй хос' : 'Дан эмэгтэй хос';
      } else if (parsed.type === 'team') {
        typeLabel = parsed.gender === 'male' ? 'Эрэгтэй баг' : 'Эмэгтэй баг';
      }

      if (parsed.minAge !== undefined && parsed.maxAge !== undefined) {
        typeLabel += ` ${parsed.minAge}–${parsed.maxAge} нас`;
      } else if (parsed.minAge !== undefined) {
        typeLabel += ` ${parsed.minAge}+ нас`;
      } else if (parsed.maxAge !== undefined) {
        typeLabel += ` ${parsed.maxAge} нас хүртэл`;
      }

      return typeLabel;
    }

    return eventType;
  } catch {
    return eventType;
  }
};

interface Event {
  id: string;
  type: 'SINGLES' | 'DOUBLES' | 'TEAM';
  name: string;
  division?: string;
  minAge?: number;
  maxAge?: number;
  minRating?: number;
  maxRating?: number;
  gender?: 'male' | 'female';
  maxEntries?: number;
  perClubLimit?: number;
  perPlayerEventLimit?: number;
  feePerPlayer: number;
  feePerTeam?: number;
  minPlayers?: number;
  maxPlayers?: number;
  maxSubs?: number;
  mixedRequired?: boolean;
}

type RegistrationFormProps = {
  tournament: {
    id: string;
    name: string;
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

// Step indicator component
const StepIndicator = ({ currentStep, completedSteps }: {
  currentStep: RegistrationStep;
  completedSteps: Set<RegistrationStep>;
}) => {
  const steps: { key: RegistrationStep; label: string; icon: React.ComponentType }[] = [
    { key: 'auth', label: 'Нэвтрэх', icon: User },
    { key: 'profile', label: 'Профайл', icon: CheckCircle },
    { key: 'event-selection', label: 'Төрөл сонгох', icon: Trophy },
    { key: 'payment', label: 'Төлбөр', icon: CreditCard },
    { key: 'confirmation', label: 'Баталгаажуулалт', icon: CheckCircle },
  ];

  return (
    <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.key;
        const isCompleted = completedSteps.has(step.key);
        const isAccessible = isCompleted || isActive || (index === 0);

        return (
          <React.Fragment key={step.key}>
            <div className={cn(
              "flex flex-col items-center space-y-2",
              isActive ? "text-green-600" : isCompleted ? "text-green-500" : "text-gray-400"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2",
                isActive ? "border-green-600 bg-green-50" :
                isCompleted ? "border-green-500 bg-green-500" :
                "border-gray-300 bg-white",
                isCompleted && "text-white"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-center">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-4",
                completedSteps.has(steps[index + 1].key) ? "bg-green-500" : "bg-gray-300"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Profile verification step
const ProfileVerificationStep = ({
  profile,
  tournament,
  onNext,
  onBack
}: {
  profile: any;
  tournament: RegistrationFormProps['tournament'];
  onNext: () => void;
  onBack: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || profile?.name || '',
    club: profile?.club || '',
    rating: profile?.rating || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
  });

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 25;
    const birth = new Date(birthDate);
    const start = new Date(tournament.startDate);
    let age = start.getFullYear() - birth.getFullYear();
    const monthDiff = start.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && start.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile?.birthDate || profile?.dateOfBirth);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          2-р алхам: Профайл баталгаажуулах
        </CardTitle>
        <CardDescription>
          Тэмцээнд бүртгүүлэхийн тулд таны мэдээлэл зөв эсэхийг баталгаажуулна уу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Бүтэн нэр</Label>
            <div className="mt-1 p-3 border rounded-md bg-gray-50">
              {profile?.fullName || profile?.name || 'Тодорхойгүй'}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Хүйс</Label>
            <div className="mt-1 p-3 border rounded-md bg-gray-50">
              {profile?.gender === 'male' ? 'Эрэгтэй' :
               profile?.gender === 'female' ? 'Эмэгтэй' : 'Тодорхойгүй'}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Нас (тэмцээний эхлэх өдрөөр)</Label>
            <div className="mt-1 p-3 border rounded-md bg-gray-50">
              {age} нас
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Клуб</Label>
            {isEditing ? (
              <Input
                value={formData.club}
                onChange={(e) => setFormData(prev => ({ ...prev, club: e.target.value }))}
                placeholder="Клубын нэр"
              />
            ) : (
              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                {profile?.club || 'Тодорхойгүй'}
              </div>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium">Рейтинг</Label>
            {isEditing ? (
              <Input
                value={formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                placeholder="Рейтинг"
              />
            ) : (
              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                {profile?.rating || 'Тодорхойгүй'}
              </div>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium">Утасны дугаар</Label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Утасны дугаар"
              />
            ) : (
              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                {profile?.phone || 'Тодорхойгүй'}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            Анхааруулга
          </h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Нас нь тэмцээний эхлэх өдрөөр тооцогдоно</li>
            <li>• Профайлын мэдээлэл буруу бол тэмцээнээс хасагдах магадлалтай</li>
            <li>• Рейтинг тодорхойгүй бол системд бүртгэгдсний дараа нэмнэ үү</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Буцах
          </Button>
          <div className="flex gap-2">
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                Засах
              </Button>
            )}
            <Button onClick={onNext} className="flex items-center gap-2">
              Үргэлжлүүлэх
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Event selection step
const EventSelectionStep = ({
  tournament,
  profile,
  selectedEvent,
  setSelectedEvent,
  onNext,
  onBack
}: {
  tournament: RegistrationFormProps['tournament'];
  profile: any;
  selectedEvent: string[];
  setSelectedEvent: (event: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) => {
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 25;
    const birth = new Date(birthDate);
    const start = new Date(tournament.startDate);
    let age = start.getFullYear() - birth.getFullYear();
    const monthDiff = start.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && start.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const validateEligibility = (eventType: string): { valid: boolean; error?: string } => {
    if (!profile) return { valid: true };

    const age = calculateAge(profile.birthDate || profile.dateOfBirth);

    try {
      const parsed = JSON.parse(eventType);

      if (parsed.gender && profile.gender && parsed.gender !== profile.gender) {
        const requiredGender = parsed.gender === 'male' ? 'эрэгтэй' : 'эмэгтэй';
        return { valid: false, error: `Энэ төрөлд зөвхөн ${requiredGender} оролцох боломжтой` };
      }

      if (parsed.minAge && age < parsed.minAge) {
        return { valid: false, error: `Хамгийн багадаа ${parsed.minAge} настай байх ёстой` };
      }

      if (parsed.maxAge && age > parsed.maxAge) {
        return { valid: false, error: `Хамгийн ихдээ ${parsed.maxAge} настай байх ёстой` };
      }
    } catch {
      // Legacy format handling
    }

    return { valid: true };
  };

  const getEventDetails = (eventType: string): string | null => {
    try {
      const parsed = JSON.parse(eventType);

      const details = [];

      // Enhanced details for team and doubles types
      if (parsed.type === 'team' || parsed.type === 'doubles') {
        if (parsed.minAge || parsed.maxAge) {
          let ageDetails = 'Насны шаардлага: ';
          if (parsed.minAge && parsed.maxAge) {
            ageDetails += `${parsed.minAge}-${parsed.maxAge} нас`;
          } else if (parsed.minAge) {
            ageDetails += `${parsed.minAge} наснаас дээш`;
          } else if (parsed.maxAge) {
            ageDetails += `${parsed.maxAge} нас хүртэл`;
          }
          details.push(ageDetails);
        }

        // Add participation format info
        if (parsed.type === 'team') {
          details.push('Багийн тэмцээн');
        } else if (parsed.type === 'doubles') {
          details.push('Хосын тэмцээн');
        }
      }

      if (parsed.metadata) {
        if (parsed.metadata.isOpen) details.push('Нээлттэй');
        if (parsed.metadata.isJunior) details.push('Өсвөрийн');
        if (parsed.metadata.isSenior) details.push('Ахмадын');
        if (parsed.metadata.competitionLevel) {
          const levelLabels: Record<string, string> = {
            'children': 'Хүүхдийн',
            'junior': 'Өсвөрийн',
            'adult': 'Том хүүхдийн',
            'veterans': 'Ахмадын',
            'open': 'Нээлттэй'
          };
          details.push(levelLabels[parsed.metadata.competitionLevel] || parsed.metadata.competitionLevel);
        }
      }

      return details.length > 0 ? details.join(' • ') : null;
    } catch {
      return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-green-600" />
          3-р алхам: Тэмцээн → Төрөл сонгох
        </CardTitle>
        <CardDescription>
          Оролцохыг хүссэн төрлөө сонгоно уу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            {tournament.name}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Эхлэх: {new Date(tournament.startDate).toLocaleDateString('mn-MN')}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Боломжтой төрлүүд (Та олон төрөл сонгож болно):</h4>
          <div className="grid grid-cols-1 gap-3">
            {tournament.participationTypes?.map((eventType) => {
              const validation = validateEligibility(eventType);
              const isDisabled = !validation.valid;
              const isSelected = selectedEvent.includes(eventType);

              return (
                <div
                  key={eventType}
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                    isSelected
                      ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                      : isDisabled
                        ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50/50",
                  )}
                  onClick={() => {
                    if (isDisabled) return;
                    
                    if (isSelected) {
                      // Remove from selection
                      setSelectedEvent(selectedEvent.filter(e => e !== eventType));
                    } else {
                      // Add to selection
                      setSelectedEvent([...selectedEvent, eventType]);
                    }
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      if (isDisabled) return;
                      
                      if (checked) {
                        setSelectedEvent([...selectedEvent, eventType]);
                      } else {
                        setSelectedEvent(selectedEvent.filter(e => e !== eventType));
                      }
                    }}
                    className="text-green-600"
                  />
                  <div className="flex-1">
                    <label className="font-medium cursor-pointer">
                      {getEventLabel(eventType)}
                    </label>
                    {getEventDetails(eventType) && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {getEventDetails(eventType)}
                      </p>
                    )}
                    {validation.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {validation.error}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Буцах
          </Button>
          <Button
            onClick={onNext}
            disabled={selectedEvent.length === 0 || selectedEvent.some(e => !validateEligibility(e).valid)}
            className="flex items-center gap-2"
          >
            Үргэлжлүүлэх
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Payment step
const PaymentStep = ({
  tournament,
  selectedEvent,
  onNext,
  onBack
}: {
  tournament: RegistrationFormProps['tournament'];
  selectedEvent: string[];
  onNext: () => void;
  onBack: () => void;
}) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // Calculate total fee based on number of selected events
  const totalFee = useMemo(() => {
    const baseFeePerEvent = 50000; // 50,000₮ per event
    return selectedEvent.length * baseFeePerEvent;
  }, [selectedEvent]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          4-р алхам: Төлбөр
        </CardTitle>
        <CardDescription>
          Бүртгэлийн төлбөрөө төлнө үү
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Бүртгэлийн дэлгэрэнгүй</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Тэмцээн:</span>
              <span className="font-medium">{tournament.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Сонгосон төрлүүд:</span>
              {selectedEvent.map((event, index) => (
                <div key={index} className="flex items-center gap-2 ml-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">{getEventLabel(event)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Нийт төлбөр:</span>
              <span className="text-green-600">{totalFee.toLocaleString()}₮</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Төлбөрийн арга сонгох:</h4>
          <div className="grid grid-cols-1 gap-3">
            {['bank_transfer', 'qpay', 'cash'].map((method) => (
              <div
                key={method}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                  paymentMethod === method
                    ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 hover:border-green-300"
                )}
                onClick={() => setPaymentMethod(method)}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                  className="text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <label className="font-medium cursor-pointer">
                    {method === 'bank_transfer' ? 'Банкны шилжүүлэг' :
                     method === 'qpay' ? 'QPay' : 'Бэлэн мөнгө'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {method === 'bank_transfer' ? 'Банкны дансанд шилжүүлэх' :
                     method === 'qpay' ? 'QPay-ээр төлөх' : 'Газар дээр төлөх'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Буцах
          </Button>
          <Button
            onClick={onNext}
            disabled={!paymentMethod}
            className="flex items-center gap-2"
          >
            Төлөх
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Confirmation step
const ConfirmationStep = ({
  tournament,
  selectedEvent,
  onBack
}: {
  tournament: RegistrationFormProps['tournament'];
  selectedEvent: string[];
  onBack: () => void;
}) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const getEventDetails = (eventType: string): string | null => {
    try {
      const parsed = JSON.parse(eventType);

      if (parsed.metadata) {
        const details = [];
        if (parsed.metadata.isOpen) details.push('Нээлттэй');
        if (parsed.metadata.isJunior) details.push('Өсвөрийн');
        if (parsed.metadata.isSenior) details.push('Ахмадын');
        if (parsed.metadata.competitionLevel) {
          const levelLabels: Record<string, string> = {
            'children': 'Хүүхдийн',
            'junior': 'Өсвөрийн',
            'adult': 'Том хүүхдийн',
            'veterans': 'Ахмадын',
            'open': 'Нээлттэй'
          };
          details.push(levelLabels[parsed.metadata.competitionLevel] || parsed.metadata.competitionLevel);
        }

        return details.length > 0 ? details.join(' • ') : null;
      }

      return null;
    } catch {
      return null;
    }
  };

  const getEventType = (eventType: string): 'singles' | 'doubles' | 'team' | null => {
    try {
      const parsed = JSON.parse(eventType);
      
      if (parsed.type === 'DOUBLES' || parsed.subType?.includes('DOUBLES')) {
        return 'doubles';
      }
      if (parsed.type === 'TEAM' || parsed.subType?.includes('TEAM')) {
        return 'team';
      }
      if (parsed.type === 'SINGLES' || parsed.subType?.includes('SINGLES')) {
        return 'singles';
      }
      
      // Legacy format
      if (parsed.type === 'pair') return 'doubles';
      if (parsed.type === 'team') return 'team';
      if (parsed.type === 'individual') return 'singles';
      
      return null;
    } catch {
      return null;
    }
  };

  // Check if any selected event is team or doubles
  const hasTeamOrDoubles = selectedEvent.some(event => {
    const type = getEventType(event);
    return type === 'team' || type === 'doubles';
  });

  const teamOrDoublesEvents = selectedEvent.filter(event => {
    const type = getEventType(event);
    return type === 'team' || type === 'doubles';
  });

  const handleFormTeam = (event: string) => {
    // Navigate to team formation page with tournament and event info
    setLocation(`/tournament/${tournament.id}/form-team?event=${encodeURIComponent(event)}`);
  };

  // Fetch sent invitations for this tournament
  const { data: sentInvitations = [] } = useQuery<any[]>({
    queryKey: [`/api/tournaments/${tournament.id}/invitations/sent`],
    enabled: !!tournament.id,
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Бүртгэл амжилттай!
        </CardTitle>
        <CardDescription>
          Таны тэмцээнд оролцох бүртгэл амжилттай хийгдлээ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
            Амжилттай бүртгүүллээ!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Таны тэмцээнд оролцох бүртгэл амжилттай хийгдлээ
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="font-medium">Тэмцээн:</span>
              <span>{tournament.name}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-medium">Бүртгэгдсэн төрлүүд:</span>
              <div className="space-y-2">
                {selectedEvent.map((event, index) => {
                  const eventType = getEventType(event);
                  const isTeamOrDoubles = eventType === 'team' || eventType === 'doubles';
                  
                  return (
                    <div key={index} className="bg-green-100 border border-green-300 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-green-800 mb-1">
                            {getEventLabel(event)}
                          </div>
                          {getEventDetails(event) && (
                            <div className="text-sm text-green-600">
                              {getEventDetails(event)}
                            </div>
                          )}
                        </div>
                        {isTeamOrDoubles && (
                          <Button
                            onClick={() => handleFormTeam(event)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                          >
                            {eventType === 'team' ? 'Баг бүрдүүлэх' : 'Хос бүрдүүлэх'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Бүртгэгдсэн:</span>
              <span>{new Date().toLocaleDateString('mn-MN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Статус:</span>
              <Badge className="bg-green-600 text-white">Бүртгэгдсэн</Badge>
            </div>
          </div>
        </div>

        {/* Sent Invitations Section */}
        {sentInvitations && sentInvitations.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Илгээсэн хүсэлтүүд
            </h4>
            <div className="space-y-2">
              {sentInvitations.map((invitation: any) => (
                <div key={invitation.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Хүсэлт илгээсэн: {formatName(invitation.receiver?.firstName, invitation.receiver?.lastName)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getEventLabel(invitation.eventType)}
                      </div>
                    </div>
                    <Badge
                      variant={
                        invitation.status === 'accepted' ? 'default' :
                        invitation.status === 'rejected' ? 'destructive' :
                        invitation.status === 'completed' ? 'default' :
                        'secondary'
                      }
                      className={
                        invitation.status === 'accepted' ? 'bg-green-600 text-white' :
                        invitation.status === 'completed' ? 'bg-blue-600 text-white' :
                        invitation.status === 'rejected' ? 'bg-red-600 text-white' :
                        'bg-yellow-600 text-white'
                      }
                    >
                      {invitation.status === 'accepted' ? 'Зөвшөөрсөн' :
                       invitation.status === 'rejected' ? 'Цуцалсан' :
                       invitation.status === 'completed' ? 'Бүртгэгдсэн' :
                       'Хүлээгдэж байна'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team/Doubles Formation Section */}
        {hasTeamOrDoubles && (
          <div className="mt-5">
            <div className="space-y-3">
              {teamOrDoublesEvents.map((event, index) => {
                const type = getEventType(event);
                const label = getEventLabel(event);
                const actionText = type === 'team' ? 'Баг үүсгэх' : 'Хос үүсгэх';
                
                return (
                  <div key={index} className="flex justify-center">
                    <Button 
                      onClick={() => handleFormTeam(event)}
                      className="bg-[#00c36a] hover:bg-[#00a85a] hover:shadow-lg text-white font-semibold px-8 py-6 text-base rounded-lg transition-all duration-200"
                      size="lg"
                    >
                      {actionText}
                    </Button>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Дараагийн алхам
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Та багийн болон/эсвэл хосын тэмцээнд бүртгүүлсэн байна. 
                    Тэмцээнд оролцохын тулд багийн гишүүд эсвэл хамтрагчаа сонгоно уу.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            Дараагийн алхамууд
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {hasTeamOrDoubles && (
              <li>• Багаа эсвэл хосоо бүрдүүлсний дараа тэмцээнд орох бэлтгэл бүрэн хангагдана</li>
            )}
            <li>• Тэмцээний хуваарь гарахад мэдэгдэл ирнэ</li>
            <li>• Профайл хэсгээс бүртгэлийн статусаа хянаж болно</li>
            <li>• Асуудал гарвал зохион байгуулагчтай холбогдоно уу</li>
          </ul>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button onClick={onBack} variant="outline">
            Буцах
          </Button>
          <Button 
            onClick={() => setLocation(`/tournament/${tournament.id}/full`)}
            variant="default"
          >
            Тэмцээн рүү буцах
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RegistrationForm({ tournament, preselectedCategory, onSuccess }: RegistrationFormProps) {
  const { isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('auth');
  const [completedSteps, setCompletedSteps] = useState<Set<RegistrationStep>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<string[]>(preselectedCategory ? [preselectedCategory] : []);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/me'],
    enabled: !!user && isAuthenticated,
    retry: false,
  });

  // Check user registration status
  const { data: userRegistrations = [] } = useQuery({
    queryKey: ["/api/registrations/me", tournament.id],
    queryFn: async () => {
      if (!tournament.id) return [];
      const res = await fetch(`/api/registrations/me?tid=${tournament.id}`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30 * 1000,
    enabled: !!tournament.id && !!isAuthenticated,
  });

  // Initialize step - allow registration without login by starting at profile
  useEffect(() => {
    if (isAuthenticated && user) {
      // If authenticated, skip auth and start at profile
      setCurrentStep('profile');
      setCompletedSteps(prev => new Set([...prev, 'auth']));
    } else {
      // If not authenticated, skip auth and go to profile to collect guest information
      setCurrentStep('profile');
      setCompletedSteps(prev => new Set([...prev, 'auth']));
    }
  }, [isAuthenticated, user]);

  const registerMutation = useMutation({
    mutationFn: async (data: { categories: string[] }) => {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tournamentId: tournament.id,
          categories: data.categories,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Бүртгүүлэхэд алдаа гарлаа");
      }

      return response.json();
    },
    onSuccess: () => {
      setCurrentStep('confirmation');
      setCompletedSteps(prev => new Set([...prev, 'payment']));
      toast({
        title: "Амжилттай!",
        description: "Тэмцээнд амжилттай бүртгүүллээ.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations/me"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа",
        description: error.message || "Бүртгүүлэхэд алдаа гарлаа",
        variant: "destructive"
      });
    },
  });

  const handleNext = () => {
    const stepOrder: RegistrationStep[] = ['auth', 'profile', 'event-selection', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);

    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: RegistrationStep[] = ['auth', 'profile', 'event-selection', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handlePayment = () => {
    // Simulate payment process and register
    registerMutation.mutate({ categories: selectedEvent });
  };

  const isRegistered = userRegistrations.length > 0;

  // Redirect registered users to confirmation step with their registered events
  useEffect(() => {
    if (isRegistered && Array.isArray(userRegistrations) && userRegistrations.length > 0) {
      // Set selected events to user's registered events
      setSelectedEvent(userRegistrations);

      // Move to confirmation step
      setCurrentStep('confirmation');

      // Mark all previous steps as completed for green progress indicator
      setCompletedSteps(new Set(['auth', 'profile', 'event-selection', 'payment']));
    }
  }, [isRegistered, userRegistrations]);

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      {currentStep === 'auth' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              1-р алхам: Нэвтрэх/Бүртгүүлэх
            </CardTitle>
            <CardDescription>
              Тэмцээнд бүртгүүлэхийн тулд нэвтэрч орно уу
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href={`/login?redirect=/events/${tournament.id}%23register`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">
                Нэвтэрч бүртгүүлэх
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {currentStep === 'profile' && profile && (
        <ProfileVerificationStep
          profile={profile}
          tournament={tournament}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'event-selection' && (
        <EventSelectionStep
          tournament={tournament}
          profile={profile}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'payment' && (
        <PaymentStep
          tournament={tournament}
          selectedEvent={selectedEvent}
          onNext={handlePayment}
          onBack={handleBack}
        />
      )}

      {currentStep === 'confirmation' && (
        <ConfirmationStep
          tournament={tournament}
          selectedEvent={selectedEvent}
          onBack={handleBack}
        />
      )}

      {profileLoading && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}