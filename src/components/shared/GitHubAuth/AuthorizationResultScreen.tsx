import { Spinner } from "@/components/ui/spinner";

export function AuthorizationResultScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Spinner size={40} />
    </div>
  );
}
