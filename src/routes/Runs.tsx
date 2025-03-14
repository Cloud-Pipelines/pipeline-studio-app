import RunCard from "@/components/RunCard";
import mockFetch from "@/utils/mockAPI";
import { useQuery } from "@tanstack/react-query";

const Runs = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () =>
      mockFetch("https://oasis.shopify.io/api/pipeline_runs/").then(
        (response) => response.json(),
      ),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto w-3/4 p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-4">Your Runs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.pipeline_runs.map(
          (run: { id: number; root_execution_id: number }) => (
            <RunCard key={run.id} rootExecutionId={run.root_execution_id} />
          ),
        )}
      </div>
    </div>
  );
};

export default Runs;
