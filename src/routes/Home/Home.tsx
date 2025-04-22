import { PipelineSection, RunSection } from "@/components/Home";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Home = () => {
  return (
    <div className="container mx-auto w-3/4 p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipelines</h1>
      </div>
      <Tabs defaultValue="runs" className="w-full">
        <TabsList>
          <TabsTrigger value="runs">All Runs</TabsTrigger>
          <TabsTrigger value="pipelines">My pipelines</TabsTrigger>
        </TabsList>
        <TabsContent value="pipelines">
          <PipelineSection />
        </TabsContent>
        <TabsContent value="runs" className="flex flex-col gap-1">
          <RunSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
