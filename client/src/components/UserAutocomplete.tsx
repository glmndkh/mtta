import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn, formatName } from "@/lib/utils";
import type { User } from "@shared/schema";

interface UserAutocompleteProps {
  users: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    displayName?: string;
    groupInfo?: string;
    isAssigned?: boolean;
    assignedTo?: string;
  }>;
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
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (customNameValue && !value) {
      setIsCustom(true);
    }
  }, [customNameValue, value]);

  const selectedUser = users?.find(user => user.id === value);
  const displayValue = selectedUser
    ? formatName(selectedUser.firstName, selectedUser.lastName)
    : customNameValue || placeholder;

  // Filter users based on search term
  const filteredUsers = (users || []).filter(user => {
    const fullName = formatName(user.firstName, user.lastName).toLowerCase();
    const email = user.email?.toLowerCase() || "";
    const club = user.clubAffiliation?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return fullName.includes(search) || 
           email.includes(search) || 
           club.includes(search);
  });

  const handleSelect = (user: User) => {
    if (onSelect && typeof onSelect === 'function') {
      onSelect(user);
    }
    setOpen(false);
    setSearchTerm("");
  };

  const getUserDisplay = (user: any) => {
    if (!user) return '';
    if (user.displayName) return user.displayName;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email || 'Unknown User';
  };

  const getUserFullDisplay = (user: any) => {
    const display = getUserDisplay(user);
    if (user.groupInfo) {
      return `${display} — ${user.groupInfo}${user.assignedTo ? ` (already in ${user.assignedTo})` : ''}`;
    }
    return display;
  };

  const content = (
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
              {"Тоглогч олдсонгүй"}
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {filteredUsers.map((user) => (
              <CommandItem
                key={user.id}
                value={user.id}
                onSelect={() => {
                  onSelect(user);
                  setOpen(false);
                  setSearchTerm("");
                }}
                className={`cursor-pointer ${user.isAssigned ? 'text-gray-500 bg-gray-50' : ''}`}
                disabled={user.isAssigned}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === user.id ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex flex-col">
                  <span className={user.isAssigned ? 'line-through' : ''}>
                    {getUserDisplay(user)}
                  </span>
                  {user.groupInfo && (
                    <span className="text-xs text-gray-500">
                      {user.groupInfo}
                      {user.assignedTo && (
                        <span className="text-red-500 ml-1">
                          (уже в {user.assignedTo})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-2">
      {isCustom ? (
        <Input
          value={customNameValue}
          onChange={(e) => {
            onCustomNameChange?.(e.target.value);
            onSelect(null);
          }}
          placeholder={placeholder}
        />
      ) : (
        content
      )}
      {allowCustomName && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="non-system-user"
            checked={isCustom}
            onCheckedChange={(checked) => {
              const c = Boolean(checked);
              setIsCustom(c);
              if (!c) {
                onCustomNameChange?.("");
              } else {
                onSelect(null);
              }
            }}
          />
          <label htmlFor="non-system-user" className="text-sm">
            Системийн хэрэглэгч биш
          </label>
        </div>
      )}
    </div>
  );
}