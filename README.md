# Cloud Pipelines Editor

Cloud Pipelines Editor is a web app that allows the users to build and run Machine Learning pipelines using drag and drop without having to set up development environment.

## Video

Please take a look at the short video demonstrating the visual pipeline editor.

[Cloud Pipelines - Build machine learning pipelines without writing code](https://www.youtube.com/watch?v=7g22nupCDes)
[![image](https://user-images.githubusercontent.com/1829149/127566707-fceb9e41-1126-4588-b94a-c69e87fe0488.png)](https://www.youtube.com/watch?v=7g22nupCDes)

## Demo

[Demo](https://cloud-pipelines.net/pipeline-editor)

The early alpha version of the Cloud Pipelines Editor app shown in this video is now available at <https://cloud-pipelines.net/pipeline-editor> . The app is open and standalone. No registration is required.

Please check it out and report any bugs you find using [GitHub Issues](https://github.com/Cloud-Pipelines/pipeline-studio-app/issues).

The app is under active development, so expect some breakages as I work on the app and do not rely on the app for production.

App features:

- Build pipeline using drag and drop
- Edit component arguments
- Submit the pipeline to [Google Cloud Vertex Pipelines](https://cloud.google.com/vertex-ai/docs/pipelines/) for execution.
- Fully compatible with the Kubeflow Pipelines' components (`component.yaml` files) You can find some components here: [Ark-kun/pipeline_components](https://github.com/Ark-kun/pipeline_components/tree/master/components) or [kubeflow/pipelines/components](https://github.com/kubeflow/pipelines/tree/master/components#index-of-components)
- Preloaded component library
- User component library (add private components)
- Component search
- Import and export pipelines

There are many features that I want to add, but I want to prioritize them based on your feedback.
