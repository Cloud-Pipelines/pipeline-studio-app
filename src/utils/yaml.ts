import yaml from "js-yaml";

const copyToYaml = (text: string | object, onSuccess: (message: string) => void, onFail: (message: string) => void) => {
    const code = yaml.dump(text, {
      lineWidth: 80,
      noRefs: true,
      indent: 2,
    });

    navigator.clipboard.writeText(code).then(
      () => onSuccess("YAML copied to clipboard"),
      (err) => onFail("Failed to copy YAML: " + err),
    );
  };

export default copyToYaml;
