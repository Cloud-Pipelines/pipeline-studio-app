// Mock API response data
const mockResponses = {
  "https://oasis.shopify.io/api/pipeline_runs/": {
    GET: {
      pipeline_runs: [
        {
          id: 1,
          root_execution_id: 1,
          created_at: "2025-03-13T10:00:53",
        },
        {
          id: 2,
          root_execution_id: 2,
          created_at: "2025-03-13T10:00:53",
        },
        {
          id: 3,
          root_execution_id: 3,
          created_at: "2025-03-13T10:00:53",
        },
        {
          id: 4,
          root_execution_id: 4,
          created_at: "2025-03-13T10:00:53",
        },
        {
          id: 5,
          root_execution_id: 5,
          created_at: "2025-03-13T10:00:53",
        },
      ],
      next_page_token: "10",
    },
    POST: {
      id: 1,
      root_execution_id: 1,
      annotations: {},
      created_by: "string",
      created_at: "2025-03-13T13:38:49.969Z",
    },
  },
  "https://oasis.shopify.io/api/pipeline_runs/1": {
    GET: {
      id: 1,
      root_execution_id: 1,
      created_at: "2025-03-13T10:00:53",
    },
  },
  "https://oasis.shopify.io/api/executions/1/details": {
    GET: {
      id: 1,
      task_spec: {
        componentRef: {
          spec: {
            name: "Train tabular regression model using XGBoost pipeline",
            metadata: {
              annotations: {
                sdk: "https://cloud-pipelines.net/pipeline-editor/",
                author: "Alexey Volkov <alexey.volkov@ark-kun.com>",
                canonical_location:
                  "https://raw.githubusercontent.com/Ark-kun/pipeline_components/master/samples/Basic_ML_training/Train_tabular_regression_model_using_XGBoost/pipeline.component.yaml",
              },
            },
            implementation: {
              graph: {
                tasks: {
                  "Xgboost train": {
                    componentRef: {
                      digest:
                        "7bbc658a62274525c7371211e78e54edfdc70326987d410d2a57f8213ec7ea34",
                      url: "https://raw.githubusercontent.com/Ark-kun/pipeline_components/37ee92778e27f9dbe3e1c1b3b25b77cd01da84dc/components/XGBoost/Train/component.yaml",
                      spec: {
                        name: "Xgboost train",
                        description: "Trains an XGBoost model.",
                        metadata: {
                          annotations: {
                            author: "Alexey Volkov <alexey.volkov@ark-kun.com>",
                            canonical_location:
                              "https://raw.githubusercontent.com/Ark-kun/pipeline_components/master/components/XGBoost/Train/component.yaml",
                          },
                        },
                        inputs: [
                          {
                            name: "training_data",
                            type: "CSV",
                            description: "Training data in CSV format.",
                          },
                          {
                            name: "label_column_name",
                            type: "String",
                            description:
                              "Name of the column containing the label data.",
                          },
                          {
                            name: "starting_model",
                            type: "XGBoostModel",
                            description:
                              "Existing trained model to start from (in the binary XGBoost format).",
                            optional: true,
                          },
                          {
                            name: "num_iterations",
                            type: "Integer",
                            description: "Number of boosting iterations.",
                            default: "10",
                            optional: true,
                          },
                          {
                            name: "booster_params",
                            type: "JsonObject",
                            description:
                              "Parameters for the booster. See https://xgboost.readthedocs.io/en/latest/parameter.html",
                            optional: true,
                          },
                          {
                            name: "objective",
                            type: "String",
                            description:
                              'The learning task and the corresponding learning objective.\nSee https://xgboost.readthedocs.io/en/latest/parameter.html#learning-task-parameters\nThe most common values are:\n"reg:squarederror" - Regression with squared loss (default).\n"reg:logistic" - Logistic regression.\n"binary:logistic" - Logistic regression for binary classification, output probability.\n"binary:logitraw" - Logistic regression for binary classification, output score before logistic transformation\n"rank:pairwise" - Use LambdaMART to perform pairwise ranking where the pairwise loss is minimized\n"rank:ndcg" - Use LambdaMART to perform list-wise ranking where Normalized Discounted Cumulative Gain (NDCG) is maximized',
                            default: "reg:squarederror",
                            optional: true,
                          },
                          {
                            name: "booster",
                            type: "String",
                            description:
                              "The booster to use. Can be `gbtree`, `gblinear` or `dart`; `gbtree` and `dart` use tree based models while `gblinear` uses linear functions.",
                            default: "gbtree",
                            optional: true,
                          },
                          {
                            name: "learning_rate",
                            type: "Float",
                            description:
                              "Step size shrinkage used in update to prevents overfitting. Range: [0,1].",
                            default: "0.3",
                            optional: true,
                          },
                          {
                            name: "min_split_loss",
                            type: "Float",
                            description:
                              "Minimum loss reduction required to make a further partition on a leaf node of the tree.\nThe larger `min_split_loss` is, the more conservative the algorithm will be. Range: [0,Inf].",
                            default: "0",
                            optional: true,
                          },
                          {
                            name: "max_depth",
                            type: "Integer",
                            description:
                              "Maximum depth of a tree. Increasing this value will make the model more complex and more likely to overfit.\n0 indicates no limit on depth. Range: [0,Inf].",
                            default: "6",
                            optional: true,
                          },
                        ],
                        outputs: [
                          {
                            name: "model",
                            type: "XGBoostModel",
                            description:
                              "Trained model in the binary XGBoost format.",
                          },
                          {
                            name: "model_config",
                            type: "XGBoostModelConfig",
                            description:
                              "The internal parameter configuration of Booster as a JSON string.",
                          },
                        ],
                        implementation: {
                          container: {
                            image: "python:3.7",
                            command: [
                              "sh",
                              "-c",
                              "(PIP_DISABLE_PIP_VERSION_CHECK=1 python3 -m pip install --quiet --no-warn-script-location 'xgboost==1.1.1' 'pandas==1.0.5' || PIP_DISABLE_PIP_VERSION_CHECK=1 python3 -m pip install --quiet --no-warn-script-location 'xgboost==1.1.1' 'pandas==1.0.5' --user) && \"$0\" \"$@\"",
                              "sh",
                              "-ec",
                              'program_path=$(mktemp)\nprintf "%s" "$0" > "$program_path"\npython3 -u "$program_path" "$@"\n',
                              'def _make_parent_dirs_and_return_path(file_path: str):\n    import os\n    os.makedirs(os.path.dirname(file_path), exist_ok=True)\n    return file_path\n\ndef xgboost_train(\n    training_data_path,\n    model_path,\n    model_config_path,\n    label_column_name,\n\n    starting_model_path = None,\n\n    num_iterations = 10,\n    booster_params = None,\n\n    # Booster parameters\n    objective = \'reg:squarederror\',\n    booster = \'gbtree\',\n    learning_rate = 0.3,\n    min_split_loss = 0,\n    max_depth = 6,\n):\n    \'\'\'Trains an XGBoost model.\n\n    Args:\n        training_data_path: Training data in CSV format.\n        model_path: Trained model in the binary XGBoost format.\n        model_config_path: The internal parameter configuration of Booster as a JSON string.\n        starting_model_path: Existing trained model to start from (in the binary XGBoost format).\n        label_column_name: Name of the column containing the label data.\n        num_iterations: Number of boosting iterations.\n        booster_params: Parameters for the booster. See https://xgboost.readthedocs.io/en/latest/parameter.html\n        objective: The learning task and the corresponding learning objective.\n            See https://xgboost.readthedocs.io/en/latest/parameter.html#learning-task-parameters\n            The most common values are:\n            "reg:squarederror" - Regression with squared loss (default).\n            "reg:logistic" - Logistic regression.\n            "binary:logistic" - Logistic regression for binary classification, output probability.\n            "binary:logitraw" - Logistic regression for binary classification, output score before logistic transformation\n            "rank:pairwise" - Use LambdaMART to perform pairwise ranking where the pairwise loss is minimized\n            "rank:ndcg" - Use LambdaMART to perform list-wise ranking where Normalized Discounted Cumulative Gain (NDCG) is maximized\n        booster: The booster to use. Can be `gbtree`, `gblinear` or `dart`; `gbtree` and `dart` use tree based models while `gblinear` uses linear functions.\n        learning_rate: Step size shrinkage used in update to prevents overfitting. Range: [0,1].\n        min_split_loss: Minimum loss reduction required to make a further partition on a leaf node of the tree.\n            The larger `min_split_loss` is, the more conservative the algorithm will be. Range: [0,Inf].\n        max_depth: Maximum depth of a tree. Increasing this value will make the model more complex and more likely to overfit.\n            0 indicates no limit on depth. Range: [0,Inf].\n\n    Annotations:\n        author: Alexey Volkov <alexey.volkov@ark-kun.com>\n    \'\'\'\n    import pandas\n    import xgboost\n\n    df = pandas.read_csv(\n        training_data_path,\n    )\n\n    training_data = xgboost.DMatrix(\n        data=df.drop(columns=[label_column_name]),\n        label=df[[label_column_name]],\n    )\n\n    booster_params = booster_params or {}\n    booster_params.setdefault(\'objective\', objective)\n    booster_params.setdefault(\'booster\', booster)\n    booster_params.setdefault(\'learning_rate\', learning_rate)\n    booster_params.setdefault(\'min_split_loss\', min_split_loss)\n    booster_params.setdefault(\'max_depth\', max_depth)\n\n    starting_model = None\n    if starting_model_path:\n        starting_model = xgboost.Booster(model_file=starting_model_path)\n\n    model = xgboost.train(\n        params=booster_params,\n        dtrain=training_data,\n        num_boost_round=num_iterations,\n        xgb_model=starting_model\n    )\n\n    # Saving the model in binary format\n    model.save_model(model_path)\n\n    model_config_str = model.save_config()\n    with open(model_config_path, \'w\') as model_config_file:\n        model_config_file.write(model_config_str)\n\nimport json\nimport argparse\n_parser = argparse.ArgumentParser(prog=\'Xgboost train\', description=\'Trains an XGBoost model.\')\n_parser.add_argument("--training-data", dest="training_data_path", type=str, required=True, default=argparse.SUPPRESS)\n_parser.add_argument("--label-column-name", dest="label_column_name", type=str, required=True, default=argparse.SUPPRESS)\n_parser.add_argument("--starting-model", dest="starting_model_path", type=str, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--num-iterations", dest="num_iterations", type=int, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--booster-params", dest="booster_params", type=json.loads, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--objective", dest="objective", type=str, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--booster", dest="booster", type=str, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--learning-rate", dest="learning_rate", type=float, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--min-split-loss", dest="min_split_loss", type=float, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--max-depth", dest="max_depth", type=int, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--model", dest="model_path", type=_make_parent_dirs_and_return_path, required=True, default=argparse.SUPPRESS)\n_parser.add_argument("--model-config", dest="model_config_path", type=_make_parent_dirs_and_return_path, required=True, default=argparse.SUPPRESS)\n_parsed_args = vars(_parser.parse_args())\n\n_outputs = xgboost_train(**_parsed_args)\n',
                            ],
                            args: [
                              "--training-data",
                              {
                                inputPath: "training_data",
                              },
                              "--label-column-name",
                              {
                                inputValue: "label_column_name",
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "starting_model",
                                  },
                                  then: [
                                    "--starting-model",
                                    {
                                      inputPath: "starting_model",
                                    },
                                  ],
                                },
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "num_iterations",
                                  },
                                  then: [
                                    "--num-iterations",
                                    {
                                      inputValue: "num_iterations",
                                    },
                                  ],
                                },
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "booster_params",
                                  },
                                  then: [
                                    "--booster-params",
                                    {
                                      inputValue: "booster_params",
                                    },
                                  ],
                                },
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "objective",
                                  },
                                  then: [
                                    "--objective",
                                    {
                                      inputValue: "objective",
                                    },
                                  ],
                                },
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "booster",
                                  },
                                  then: [
                                    "--booster",
                                    {
                                      inputValue: "booster",
                                    },
                                  ],
                                },
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "learning_rate",
                                  },
                                  then: [
                                    "--learning-rate",
                                    {
                                      inputValue: "learning_rate",
                                    },
                                  ],
                                },
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "min_split_loss",
                                  },
                                  then: [
                                    "--min-split-loss",
                                    {
                                      inputValue: "min_split_loss",
                                    },
                                  ],
                                },
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "max_depth",
                                  },
                                  then: [
                                    "--max-depth",
                                    {
                                      inputValue: "max_depth",
                                    },
                                  ],
                                },
                              },
                              "--model",
                              {
                                outputPath: "model",
                              },
                              "--model-config",
                              {
                                outputPath: "model_config",
                              },
                            ],
                          },
                        },
                      },
                    },
                    arguments: {
                      training_data: {
                        taskOutput: {
                          outputName: "transformed_table",
                          taskId: "Select columns using Pandas on CSV data",
                        },
                      },
                      label_column_name: "tips",
                    },
                    annotations: {
                      "editor.position":
                        '{"x":140,"y":250,"width":180,"height":40}',
                    },
                  },
                  "Xgboost predict": {
                    componentRef: {
                      digest:
                        "9fba0413388c06509e054282a4396c8ebc30877b545644c8888a94d750f6122a",
                      url: "https://raw.githubusercontent.com/Ark-kun/pipeline_components/37ee92778e27f9dbe3e1c1b3b25b77cd01da84dc/components/XGBoost/Predict/component.yaml",
                      spec: {
                        name: "Xgboost predict",
                        description:
                          "Makes predictions using a trained XGBoost model.",
                        metadata: {
                          annotations: {
                            author: "Alexey Volkov <alexey.volkov@ark-kun.com>",
                            canonical_location:
                              "https://raw.githubusercontent.com/Ark-kun/pipeline_components/master/components/XGBoost/Predict/component.yaml",
                          },
                        },
                        inputs: [
                          {
                            name: "data",
                            type: "CSV",
                            description:
                              "Feature data in Apache Parquet format.",
                          },
                          {
                            name: "model",
                            type: "XGBoostModel",
                            description:
                              "Trained model in binary XGBoost format.",
                          },
                          {
                            name: "label_column_name",
                            type: "String",
                            description:
                              "Optional. Name of the column containing the label data that is excluded during the prediction.",
                            optional: true,
                          },
                        ],
                        outputs: [
                          {
                            name: "predictions",
                            type: "Text",
                            description: "Model predictions.",
                          },
                        ],
                        implementation: {
                          container: {
                            image: "python:3.7",
                            command: [
                              "sh",
                              "-c",
                              "(PIP_DISABLE_PIP_VERSION_CHECK=1 python3 -m pip install --quiet --no-warn-script-location 'xgboost==1.1.1' 'pandas==1.0.5' || PIP_DISABLE_PIP_VERSION_CHECK=1 python3 -m pip install --quiet --no-warn-script-location 'xgboost==1.1.1' 'pandas==1.0.5' --user) && \"$0\" \"$@\"",
                              "sh",
                              "-ec",
                              'program_path=$(mktemp)\nprintf "%s" "$0" > "$program_path"\npython3 -u "$program_path" "$@"\n',
                              'def _make_parent_dirs_and_return_path(file_path: str):\n    import os\n    os.makedirs(os.path.dirname(file_path), exist_ok=True)\n    return file_path\n\ndef xgboost_predict(\n    data_path,\n    model_path,\n    predictions_path,\n    label_column_name = None,\n):\n    \'\'\'Makes predictions using a trained XGBoost model.\n\n    Args:\n        data_path: Feature data in Apache Parquet format.\n        model_path: Trained model in binary XGBoost format.\n        predictions_path: Model predictions.\n        label_column_name: Optional. Name of the column containing the label data that is excluded during the prediction.\n\n    Annotations:\n        author: Alexey Volkov <alexey.volkov@ark-kun.com>\n    \'\'\'\n    from pathlib import Path\n\n    import numpy\n    import pandas\n    import xgboost\n\n    df = pandas.read_csv(\n        data_path,\n    )\n\n    if label_column_name is not None:\n        df = df.drop(columns=[label_column_name])\n\n    testing_data = xgboost.DMatrix(\n        data=df,\n    )\n\n    model = xgboost.Booster(model_file=model_path)\n\n    predictions = model.predict(testing_data)\n\n    Path(predictions_path).parent.mkdir(parents=True, exist_ok=True)\n    numpy.savetxt(predictions_path, predictions)\n\nimport argparse\n_parser = argparse.ArgumentParser(prog=\'Xgboost predict\', description=\'Makes predictions using a trained XGBoost model.\')\n_parser.add_argument("--data", dest="data_path", type=str, required=True, default=argparse.SUPPRESS)\n_parser.add_argument("--model", dest="model_path", type=str, required=True, default=argparse.SUPPRESS)\n_parser.add_argument("--label-column-name", dest="label_column_name", type=str, required=False, default=argparse.SUPPRESS)\n_parser.add_argument("--predictions", dest="predictions_path", type=_make_parent_dirs_and_return_path, required=True, default=argparse.SUPPRESS)\n_parsed_args = vars(_parser.parse_args())\n\n_outputs = xgboost_predict(**_parsed_args)\n',
                            ],
                            args: [
                              "--data",
                              {
                                inputPath: "data",
                              },
                              "--model",
                              {
                                inputPath: "model",
                              },
                              {
                                if: {
                                  cond: {
                                    isPresent: "label_column_name",
                                  },
                                  then: [
                                    "--label-column-name",
                                    {
                                      inputValue: "label_column_name",
                                    },
                                  ],
                                },
                              },
                              "--predictions",
                              {
                                outputPath: "predictions",
                              },
                            ],
                          },
                        },
                      },
                    },
                    arguments: {
                      data: {
                        taskOutput: {
                          outputName: "transformed_table",
                          taskId: "Select columns using Pandas on CSV data",
                        },
                      },
                      model: {
                        taskOutput: {
                          outputName: "model",
                          taskId: "Xgboost train",
                        },
                      },
                      label_column_name: "tips",
                    },
                    annotations: {
                      "editor.position":
                        '{"x":40,"y":370,"width":180,"height":40}',
                    },
                  },
                  "Download from GCS": {
                    componentRef: {
                      digest:
                        "30c424ac6156c478aa0c3027b470baf9cb7dbbf90aebcabde7469bfbd02a512e",
                      url: "https://raw.githubusercontent.com/Ark-kun/pipeline_components/d8c4cf5e6403bc65bcf8d606e6baf87e2528a3dc/components/google-cloud/storage/download/component.yaml",
                      spec: {
                        name: "Download from GCS",
                        metadata: {
                          annotations: {
                            author: "Alexey Volkov <alexey.volkov@ark-kun.com>",
                            canonical_location:
                              "https://raw.githubusercontent.com/Ark-kun/pipeline_components/master/components/google-cloud/storage/download/component.yaml",
                          },
                        },
                        inputs: [
                          {
                            name: "GCS path",
                            type: "URI",
                          },
                        ],
                        outputs: [
                          {
                            name: "Data",
                          },
                        ],
                        implementation: {
                          container: {
                            image: "google/cloud-sdk",
                            command: [
                              "bash",
                              "-ex",
                              "-c",
                              'if [ -n "${GOOGLE_APPLICATION_CREDENTIALS}" ]; then\n    gcloud auth activate-service-account --key-file="${GOOGLE_APPLICATION_CREDENTIALS}"\nfi\n\nuri="$0"\noutput_path="$1"\n\n# Checking whether the URI points to a single blob, a directory or a URI pattern\n# URI points to a blob when that URI does not end with slash and listing that URI only yields the same URI\nif [[ "$uri" != */ ]] && (gsutil ls "$uri" | grep --fixed-strings --line-regexp "$uri"); then\n    mkdir -p "$(dirname "$output_path")"\n    gsutil -m cp -r "$uri" "$output_path"\nelse\n    mkdir -p "$output_path" # When source path is a directory, gsutil requires the destination to also be a directory\n    gsutil -m rsync -r "$uri" "$output_path" # gsutil cp has different path handling than Linux cp. It always puts the source directory (name) inside the destination directory. gsutil rsync does not have that problem.\nfi\n',
                              {
                                inputValue: "GCS path",
                              },
                              {
                                outputPath: "Data",
                              },
                            ],
                          },
                        },
                      },
                    },
                    arguments: {
                      "GCS path":
                        "gs://ml-pipeline-dataset/Chicago_taxi_trips/chicago_taxi_trips_2019-01-01_-_2019-02-01_limit=10000.csv",
                    },
                    annotations: {
                      "editor.position":
                        '{"x":40,"y":40,"width":180,"height":40}',
                    },
                  },
                  "Select columns using Pandas on CSV data": {
                    componentRef: {
                      digest:
                        "706a611997f9354fc9380747db7265a5a18b34ae7f3deadf29c9b994042fb511",
                      url: "https://raw.githubusercontent.com/Ark-kun/pipeline_components/0f0650b8446277b10f7ab48d220e413eef04ec69/components/pandas/Select_columns/in_CSV_format/component.yaml",
                      spec: {
                        name: "Select columns using Pandas on CSV data",
                        metadata: {
                          annotations: {
                            author: "Alexey Volkov <alexey.volkov@ark-kun.com>",
                            canonical_location:
                              "https://raw.githubusercontent.com/Ark-kun/pipeline_components/master/components/pandas/Select_columns/in_CSV_format/component.yaml",
                          },
                        },
                        inputs: [
                          {
                            name: "table",
                            type: "CSV",
                          },
                          {
                            name: "column_names",
                            type: "JsonArray",
                          },
                        ],
                        outputs: [
                          {
                            name: "transformed_table",
                            type: "CSV",
                          },
                        ],
                        implementation: {
                          container: {
                            image: "python:3.9",
                            command: [
                              "sh",
                              "-c",
                              "(PIP_DISABLE_PIP_VERSION_CHECK=1 python3 -m pip install --quiet --no-warn-script-location 'pandas==1.4.2' || PIP_DISABLE_PIP_VERSION_CHECK=1 python3 -m pip install --quiet --no-warn-script-location 'pandas==1.4.2' --user) && \"$0\" \"$@\"",
                              "sh",
                              "-ec",
                              'program_path=$(mktemp)\nprintf "%s" "$0" > "$program_path"\npython3 -u "$program_path" "$@"\n',
                              'def _make_parent_dirs_and_return_path(file_path: str):\n    import os\n    os.makedirs(os.path.dirname(file_path), exist_ok=True)\n    return file_path\n\ndef select_columns_using_Pandas_on_CSV_data(\n    table_path,\n    transformed_table_path,\n    column_names,\n):\n    import pandas\n\n    df = pandas.read_csv(table_path)\n    df = df[column_names]\n    df.to_csv(transformed_table_path, index=False)\n\nimport json\nimport argparse\n_parser = argparse.ArgumentParser(prog=\'Select columns using Pandas on CSV data\', description=\'\')\n_parser.add_argument("--table", dest="table_path", type=str, required=True, default=argparse.SUPPRESS)\n_parser.add_argument("--column-names", dest="column_names", type=json.loads, required=True, default=argparse.SUPPRESS)\n_parser.add_argument("--transformed-table", dest="transformed_table_path", type=_make_parent_dirs_and_return_path, required=True, default=argparse.SUPPRESS)\n_parsed_args = vars(_parser.parse_args())\n\n_outputs = select_columns_using_Pandas_on_CSV_data(**_parsed_args)\n',
                            ],
                            args: [
                              "--table",
                              {
                                inputPath: "table",
                              },
                              "--column-names",
                              {
                                inputValue: "column_names",
                              },
                              "--transformed-table",
                              {
                                outputPath: "transformed_table",
                              },
                            ],
                          },
                        },
                      },
                    },
                    arguments: {
                      table: {
                        taskOutput: {
                          outputName: "Data",
                          taskId: "Download from GCS",
                        },
                      },
                      column_names:
                        '["tips", "trip_seconds", "trip_miles", "pickup_community_area", "dropoff_community_area", "fare", "tolls", "extras"]',
                    },
                    annotations: {
                      "editor.position":
                        '{"x":40,"y":120,"width":180,"height":50}',
                    },
                  },
                },
                outputValues: {},
              },
            },
          },
        },
      },
      child_task_execution_ids: {
        "Download from GCS": 2,
        "Select columns using Pandas on CSV data": 3,
        "Xgboost train": 4,
        "Xgboost predict": 5,
      },
    },
  },
  "https://oasis.shopify.io/api/executions/2/details": {
    GET: {
      id: 2,
      task_spec: {
        componentRef: {
          spec: {
            name: "Failed Pipeline Run",
            metadata: {
              annotations: {
                sdk: "https://cloud-pipelines.net/pipeline-editor/",
                author: "Alexey Volkov <alexey.volkov@ark-kun.com>",
                canonical_location:
                  "https://raw.githubusercontent.com/Ark-kun/pipeline_components/master/samples/Basic_ML_training/Train_tabular_regression_model_using_XGBoost/pipeline.component.yaml",
              },
            },
            implementation: {
              graph: {
                tasks: {
                  "Xgboost train": {
                    componentRef: {
                      digest:
                        "7bbc658a62274525c7371211e78e54edfdc70326987d410d2a57f8213ec7ea34",
                      url: "https://raw.githubusercontent.com/Ark-kun/pipeline_components/37ee92778e27f9dbe3e1c1b3b25b77cd01da84dc/components/XGBoost/Train/component.yaml",
                      spec: {
                        name: "Xgboost train",
                        description: "Trains an XGBoost model.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      child_task_execution_ids: {
        "Failed Task": 8,
      },
    },
  },
  "https://oasis.shopify.io/api/executions/3/details": {
    GET: {
      id: 3,
      task_spec: {
        componentRef: {
          spec: {
            name: "Running Pipeline Run",
            metadata: {
              annotations: {
                sdk: "https://cloud-pipelines.net/pipeline-editor/",
              },
            },
          },
        },
      },
      child_task_execution_ids: {
        "Running Task": 6,
      },
    },
  },
  "https://oasis.shopify.io/api/executions/4/details": {
    GET: {
      id: 4,
      task_spec: {
        componentRef: {
          spec: {
            name: "Mixed Status Pipeline Run",
            metadata: {
              annotations: {
                sdk: "https://cloud-pipelines.net/pipeline-editor/",
              },
            },
          },
        },
      },
      child_task_execution_ids: {
        "Succeeded Task": 7,
        "Failed Task": 8,
        "Running Task": 6,
      },
    },
  },
  "https://oasis.shopify.io/api/executions/5/details": {
    GET: {
      id: 5,
      task_spec: {
        componentRef: {
          spec: {
            name: "All States Pipeline Run",
            metadata: {
              annotations: {
                sdk: "https://cloud-pipelines.net/pipeline-editor/",
              },
            },
          },
        },
      },
      child_task_execution_ids: {
        "Invalid Task": 1,
        "Uninitialized Task": 2,
        "Created Task": 3,
        "Waiting For Upstream Task": 4,
        "Starting Task": 5,
        "Running Task": 6,
        "Succeeded Task": 7,
        "Failed Task": 8,
        "Upstream Failed Task": 9,
        "Conditionally Skipped Task": 10,
        "System Error Task": 11,
        "Ready To Start Task": 12,
        "Cancelling Task": 13,
        "Cancelled Task": 14,
        "Upstream Failed Or Skipped Task": 15,
      },
    },
  },
  "https://oasis.shopify.io/api/executions/1/state": {
    GET: {
      child_execution_status_stats: {
        "2": {
          SUCCEEDED: 1,
        },
        "3": {
          SUCCEEDED: 1,
        },
        "4": {
          SUCCEEDED: 1,
        },
        "5": {
          SUCCEEDED: 1,
        },
      },
    },
  },
  "https://oasis.shopify.io/api/executions/2/state": {
    GET: {
      child_execution_status_stats: {
        "8": {
          FAILED: 1,
        },
      },
    },
  },
  "https://oasis.shopify.io/api/executions/3/state": {
    GET: {
      child_execution_status_stats: {
        "6": {
          RUNNING: 1,
        },
      },
    },
  },
  "https://oasis.shopify.io/api/executions/4/state": {
    GET: {
      child_execution_status_stats: {
        "7": {
          SUCCEEDED: 1,
        },
        "8": {
          FAILED: 1,
        },
        "6": {
          RUNNING: 1,
        },
      },
    },
  },
  "https://oasis.shopify.io/api/executions/5/state": {
    GET: {
      child_execution_status_stats: {
        "1": {
          INVALID: 1,
        },
        "2": {
          UNINITIALIZED: 1,
        },
        "3": {
          CREATED: 1,
        },
        "4": {
          WAITING_FOR_UPSTREAM: 1,
        },
        "5": {
          STARTING: 1,
        },
        "6": {
          RUNNING: 1,
        },
        "7": {
          SUCCEEDED: 1,
        },
        "8": {
          FAILED: 1,
        },
        "9": {
          UPSTREAM_FAILED: 1,
        },
        "10": {
          CONDITIONALLY_SKIPPED: 1,
        },
        "11": {
          SYSTEM_ERROR: 1,
        },
        "12": {
          READY_TO_START: 1,
        },
        "13": {
          CANCELLING: 1,
        },
        "14": {
          CANCELLED: 1,
        },
        "15": {
          UPSTREAM_FAILED_OR_SKIPPED: 1,
        },
      },
    },
  },
};

const mockFetch = (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  return new Promise((resolve) => {
    type MockResponsesKey = keyof typeof mockResponses;
    if (url in mockResponses) {
      const method = options.method || "GET";
      const responseData =
        mockResponses[url as MockResponsesKey][
          method as keyof (typeof mockResponses)[MockResponsesKey]
        ] || {};

      // Create a proper Response object
      resolve(
        new Response(JSON.stringify(responseData), {
          headers: {
            "content-type": "application/json",
            "x-request-id": "21511c75-24f8-428c-9229-76551dfb2170-1741872402",
          },
          status: 200,
          statusText: "OK",
        }),
      );
    } else {
      // Default empty response for unmocked endpoints
      resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          statusText: "OK",
        }),
      );
    }
  });
};

export default mockFetch;
