import { ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type SearchFilterProps } from "@/types/componentLibrary";

const SearchFilter = ({
  availableFilters,
  activeFilters,
  disableCounter = false,
  onFiltersChange,
}: SearchFilterProps) => {
  const handleCheckboxChange = (filter: string, checked: boolean) => {
    if (checked) {
      onFiltersChange([...activeFilters, filter]);
    } else {
      onFiltersChange(activeFilters.filter((f) => f !== filter));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button variant="outline" size="icon" className="h-8 w-8 p-0">
            <ListFilter className="w-4 h-4" />
          </Button>
          {activeFilters.length > 0 && !disableCounter && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold">
              {activeFilters.length}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-40">
        <div className="grid gap-2">
          <h4>Filter Search</h4>
          <div className="space-y-2">
            {availableFilters.map((filter) => (
              <div key={filter} className="flex items-center space-x-2">
                <Checkbox
                  id={filter}
                  checked={activeFilters.includes(filter)}
                  onCheckedChange={(checked: boolean) =>
                    handleCheckboxChange(filter, !!checked)
                  }
                  className="hover:cursor-pointer"
                />
                <Label htmlFor={filter} className="font-light text-sm">
                  {filter}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchFilter;
