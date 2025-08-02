import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  clubAffiliation?: string;
}

interface UserAutocompleteProps {
  users: User[];
  value?: string;
  onSelect: (user: User | null) => void;
  placeholder?: string;
  allowCustomName?: boolean;
  customNameValue?: string;
  onCustomNameChange?: (name: string) => void;
}

export function UserAutocomplete({
  users,
  value,
  onSelect,
  placeholder = "Тоглогч сонгох...",
  allowCustomName = false,
  customNameValue = "",
  onCustomNameChange,
}: UserAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedUser = users.find(user => user.id === value);
  const displayValue = selectedUser 
    ? `${selectedUser.firstName} ${selectedUser.lastName}` 
    : customNameValue || placeholder;

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email?.toLowerCase() || "";
    const club = user.clubAffiliation?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || 
           email.includes(search) || 
           club.includes(search);
  });

  const handleSelect = (user: User) => {
    onSelect(user);
    setOpen(false);
    setSearchTerm("");
  };

  const handleCustomNameSelect = () => {
    if (allowCustomName && searchTerm.trim()) {
      onCustomNameChange?.(searchTerm.trim());
      onSelect(null); // No user selected, using custom name
      setOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Тоглогчийн нэрээр хайх..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>
            <div className="py-2 text-center text-sm">
              {allowCustomName && searchTerm.trim() ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCustomNameSelect}
                  className="w-full"
                >
                  "{searchTerm}" гэсэн нэрийг ашиглах
                </Button>
              ) : (
                "Тоглогч олдсонгүй"
              )}
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {filteredUsers.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => handleSelect(user)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  {user.clubAffiliation && (
                    <span className="text-sm text-gray-500">
                      {user.clubAffiliation}
                    </span>
                  )}
                </div>
                <Check
                  className={cn(
                    "ml-2 h-4 w-4",
                    value === user.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}