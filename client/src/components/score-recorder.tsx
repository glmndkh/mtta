import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calculator, Save, X, Plus, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const scoreRecordSchema = z.object({
  matchId: z.string().optional(),
  player1Id: z.string(),
  player2Id: z.string(),
  winnerId: z.string(),
  notes: z.string().optional(),
  sets: z.array(z.object({
    setNumber: z.number(),
    player1Score: z.number().min(0).max(21),
    player2Score: z.number().min(0).max(21),
  })).min(3).max(7),
});

type ScoreRecordForm = z.infer<typeof scoreRecordSchema>;

interface ScoreRecorderProps {
  matchId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ScoreRecorder({ matchId, onSuccess, onCancel }: ScoreRecorderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sets, setSets] = useState([
    { setNumber: 1, player1Score: 0, player2Score: 0 },
    { setNumber: 2, player1Score: 0, player2Score: 0 },
    { setNumber: 3, player1Score: 0, player2Score: 0 },
  ]);

  const form = useForm<ScoreRecordForm>({
    resolver: zodResolver(scoreRecordSchema),
    defaultValues: {
      matchId: matchId || "",
      player1Id: "",
      player2Id: "",
      winnerId: "",
      notes: "",
      sets: sets,
    },
  });

  // Update match result mutation
  const updateMatchMutation = useMutation({
    mutationFn: async (data: ScoreRecordForm) => {
      const response = await apiRequest("PUT", `/api/matches/${data.matchId}/result`, {
        winnerId: data.winnerId,
        sets: data.sets.map(set => ({
          ...set,
          matchId: data.matchId!,
        })),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Тоглолтын үр дүн амжилттай хадгалагдлаа",
      });
      form.reset();
      setSets([
        { setNumber: 1, player1Score: 0, player2Score: 0 },
        { setNumber: 2, player1Score: 0, player2Score: 0 },
        { setNumber: 3, player1Score: 0, player2Score: 0 },
      ]);
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
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
        description: "Тоглолтын үр дүн хадгалахад алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const addSet = () => {
    if (sets.length < 7) {
      const newSet = { setNumber: sets.length + 1, player1Score: 0, player2Score: 0 };
      const newSets = [...sets, newSet];
      setSets(newSets);
      form.setValue('sets', newSets);
    }
  };

  const removeSet = (setIndex: number) => {
    if (sets.length > 3) {
      const newSets = sets.filter((_, index) => index !== setIndex)
        .map((set, index) => ({ ...set, setNumber: index + 1 }));
      setSets(newSets);
      form.setValue('sets', newSets);
    }
  };

  const updateSetScore = (setIndex: number, field: 'player1Score' | 'player2Score', value: number) => {
    const newSets = sets.map((set, index) => 
      index === setIndex ? { ...set, [field]: Math.max(0, Math.min(21, value)) } : set
    );
    setSets(newSets);
    form.setValue('sets', newSets);
  };

  const calculateWinner = () => {
    const player1Wins = sets.filter(set => set.player1Score > set.player2Score).length;
    const player2Wins = sets.filter(set => set.player2Score > set.player1Score).length;
    
    if (player1Wins > player2Wins) {
      form.setValue('winnerId', form.getValues('player1Id'));
    } else if (player2Wins > player1Wins) {
      form.setValue('winnerId', form.getValues('player2Id'));
    }
  };

  const onSubmit = (data: ScoreRecordForm) => {
    if (!data.matchId) {
      toast({
        title: "Алдаа",
        description: "Тоглолт сонгоно уу",
        variant: "destructive",
      });
      return;
    }
    updateMatchMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5 text-mtta-green" />
          Оноо бүртгэх
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Player Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="player1Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглогч 1</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Тоглогч сонгоно уу" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="player1">Болдбаатар Б.</SelectItem>
                        <SelectItem value="player2">Дашдорж Д.</SelectItem>
                        <SelectItem value="player3">Энхбат Э.</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="player2Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглогч 2</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Тоглогч сонгоно уу" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="player2">Дашдорж Д.</SelectItem>
                        <SelectItem value="player3">Энхбат Э.</SelectItem>
                        <SelectItem value="player4">Батбаяр Б.</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Set Scores */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-900">Сетийн оноо</h4>
                <div className="flex space-x-2">
                  {sets.length < 7 && (
                    <Button type="button" size="sm" variant="outline" onClick={addSet}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  {sets.length > 3 && (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => removeSet(sets.length - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {sets.map((set, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-center">
                    <Label className="text-sm font-medium">Сет {set.setNumber}:</Label>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateSetScore(index, 'player1Score', set.player1Score - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="21"
                        value={set.player1Score}
                        onChange={(e) => updateSetScore(index, 'player1Score', parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateSetScore(index, 'player1Score', set.player1Score + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <span className="text-center text-gray-500">-</span>

                    <div className="flex items-center space-x-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateSetScore(index, 'player2Score', set.player2Score - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="21"
                        value={set.player2Score}
                        onChange={(e) => updateSetScore(index, 'player2Score', parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateSetScore(index, 'player2Score', set.player2Score + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {sets.length > 3 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSet(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={calculateWinner}
              >
                Ялагчийг тооцоолох
              </Button>
            </div>

            {/* Winner Selection */}
            <FormField
              control={form.control}
              name="winnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ялагч</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ялагч сонгоно уу" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.getValues('player1Id') && (
                        <SelectItem value={form.getValues('player1Id')}>Тоглогч 1</SelectItem>
                      )}
                      {form.getValues('player2Id') && (
                        <SelectItem value={form.getValues('player2Id')}>Тоглогч 2</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тэмдэглэл</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Тоглолтын тайлбар (заавал биш)"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button 
                type="submit" 
                className="flex-1 mtta-green text-white hover:bg-mtta-green-dark"
                disabled={updateMatchMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMatchMutation.isPending ? "Хадгалж байна..." : "Оноо хадгалах"}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Цуцлах
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
