import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { type SearchInputProps } from "@/types/componentLibrary";

const SearchInput = ({ value, onChange }: SearchInputProps) => {
  return (
    <div className="px-2 pb-2 pt-1">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 z-10 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search components..."
          className={"w-full pl-8 text-sm h-8 focus-visible:ring-gray-400/50"}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default SearchInput;
