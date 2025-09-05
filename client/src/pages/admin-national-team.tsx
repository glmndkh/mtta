import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NationalTeamPlayer {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  imageUrl?: string | null;
}

export default function AdminNationalTeamPage() {
  const queryClient = useQueryClient();
  const { data: players = [] } = useQuery<NationalTeamPlayer[]>({
    queryKey: ["/api/admin/national-team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<NationalTeamPlayer, "id">) => {
      const res = await fetch("/api/admin/national-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(["/api/admin/national-team"]),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/national-team/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries(["/api/admin/national-team"]),
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    imageUrl: "",
  });
  const [open, setOpen] = useState(false);

  const handleCreate = () => {
    createMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      age: form.age ? parseInt(form.age) : null,
      imageUrl: form.imageUrl,
    });
    setOpen(false);
    setForm({ firstName: "", lastName: "", age: "", imageUrl: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Шигшээ тоглогчид</h1>
          <Button onClick={() => setOpen(true)}>Шинэ тоглогч</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Шигшээ тоглогчдын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Нас</TableHead>
                  <TableHead>Зураг</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.firstName} {p.lastName}
                    </TableCell>
                    <TableCell>{p.age ?? "-"}</TableCell>
                    <TableCell>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="w-12 h-12 object-cover rounded-full"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(p.id)}
                      >
                        Устгах
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {players.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                Шигшээ тоглогч байхгүй байна
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Тоглогч нэмэх</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">Нэр</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Овог</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="age">Нас</Label>
                <Input
                  id="age"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Зураг URL</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Болих
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  Нэмэх
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

