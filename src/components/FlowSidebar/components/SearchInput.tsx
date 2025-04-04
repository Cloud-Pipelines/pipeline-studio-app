import { Search } from "lucide-react";

import { type SearchInputProps } from "@/types/componentLibrary";

const SearchInput = ({ value, onChange }: SearchInputProps) => {
  return (
    <div className="px-2 pb-2 pt-1">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search components..."
          className="w-full py-1 pl-8 pr-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default SearchInput;
