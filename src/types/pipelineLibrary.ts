export interface PipelineLibrary {
  components: Array<{
    name: string;
    url: string;
    [key: string]: any;
  }>;
}
