import { Paragraph } from "@/components/ui/typography";

import TableVisualizer, { type DownloadFullDataset } from "./TableVisualizer";
import { fetchArtifactOrThrow, useArtifactFetch } from "./useArtifactFetch";
import { useRowCap } from "./useRowCap";
import { parseCsv, type ParsedArtifact } from "./utils";

type DelimitedArtifactType = "csv" | "tsv";

const DOWNLOAD_FORMATS: Record<
  DelimitedArtifactType,
  { filename: string; mimeType: string }
> = {
  csv: { filename: "data.csv", mimeType: "text/csv;charset=utf-8" },
  tsv: {
    filename: "data.tsv",
    mimeType: "text/tab-separated-values;charset=utf-8",
  },
};

interface CsvVisualizerValueProps {
  value: string;
  type: DelimitedArtifactType;
  isFullscreen: boolean;
}

interface CsvVisualizerRemoteProps {
  signedUrl: string;
  type: DelimitedArtifactType;
  isFullscreen: boolean;
}

const CsvContent = ({
  parsed,
  isFullscreen,
  downloadFull,
}: {
  parsed: ParsedArtifact;
  isFullscreen: boolean;
  downloadFull?: DownloadFullDataset;
}) => {
  const { data, onLoadMore, onLoadAll } = useRowCap(parsed);

  if (data.columns.length === 0) {
    return (
      <Paragraph tone="subdued" size="xs">
        No data
      </Paragraph>
    );
  }

  return (
    <TableVisualizer
      data={data}
      isFullscreen={isFullscreen}
      onLoadMore={onLoadMore}
      onLoadAll={onLoadAll}
      totalRows={parsed.totalRows}
      columnCount={parsed.columns.length}
      downloadFull={downloadFull}
    />
  );
};

export const CsvVisualizerValue = ({
  value,
  type,
  isFullscreen,
}: CsvVisualizerValueProps) => {
  const { filename, mimeType } = DOWNLOAD_FORMATS[type];

  return (
    <CsvContent
      parsed={parseCsv(value)}
      isFullscreen={isFullscreen}
      downloadFull={{
        filename,
        getBlob: async () => new Blob([value], { type: mimeType }),
      }}
    />
  );
};

export const CsvVisualizerRemote = ({
  signedUrl,
  type,
  isFullscreen,
}: CsvVisualizerRemoteProps) => {
  const parsed = useArtifactFetch<ParsedArtifact>(
    "csv",
    signedUrl,
    async (response) => parseCsv(await response.text()),
  );

  return (
    <CsvContent
      parsed={parsed}
      isFullscreen={isFullscreen}
      downloadFull={{
        filename: DOWNLOAD_FORMATS[type].filename,
        getBlob: async () => (await fetchArtifactOrThrow(signedUrl)).blob(),
      }}
    />
  );
};
