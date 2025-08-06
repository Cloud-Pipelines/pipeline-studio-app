import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import {
  createContext,
  memo,
  type RefObject,
  useContext,
  useMemo,
  useRef,
} from "react";
import {
  createElement as ViewerCodeLine,
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { getLineHeight } from "@/utils/string";

const BATCH_SIZE = 100;
const OVERSCAN = 1;

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
  height?: string;
  fontSize?: string;
  padding?: string;
  wrapLines?: boolean;
  startingLineNumber?: number;
  virtualized?: boolean;
}

interface VirtualizedViewportProps {
  rows: rendererNode[];
  stylesheet: { [key: string]: React.CSSProperties };
  useInlineStyles: boolean;
  fontSize?: string;
}

const CodeLine = memo(function CodeLine({ id }: { id: number }) {
  const { rows, stylesheet, useInlineStyles } = useContext(
    VirtualizedViewportContext,
  );
  const row = rows[id];

  if (!row) {
    return null;
  }

  return (
    <ViewerCodeLine
      key={id}
      node={row}
      stylesheet={stylesheet}
      useInlineStyles={useInlineStyles}
    />
  );
});

const VirtualizedViewportContext = createContext<VirtualizedViewportProps>({
  rows: [],
  stylesheet: {},
  useInlineStyles: false,
});

const VirtualizedViewportContent = memo(function VirtualizedViewportContent({
  batchSize = 100,
  scrollElement,
  overscan = 0,
  lineHeight = 18,
}: {
  batchSize: number;
  scrollElement: RefObject<HTMLElement | null>;
  overscan?: number;
  lineHeight?: number;
}) {
  const { rows } = useContext(VirtualizedViewportContext);

  const virtualizer = useVirtualizer({
    count: Math.ceil(rows.length / batchSize),
    getScrollElement: () => scrollElement.current,
    estimateSize: () => lineHeight * batchSize,
    overscan,
  });

  const lines = virtualizer.getVirtualItems();

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          transform: `translateY(${lines[0]?.start ?? 0}px)`,
        }}
      >
        {lines.map((item: VirtualItem) => (
          <div
            key={item.key}
            ref={virtualizer.measureElement}
            data-index={item.index}
          >
            {Array.from(
              { length: batchSize },
              (_, i) => item.index * batchSize + i,
            ).map((index) => (
              <CodeLine key={index} id={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

function bypassScrollLocks(element: HTMLElement | null) {
  if (element) {
    /**
     * To ensure scrolling the code viewer in any context (e.g. fullscreen)
     * we need to bypass the scroll locks introduced by https://github.com/theKashey/react-remove-scroll in Dialogs
     */
    element.onwheel = (e) => e.stopPropagation();
    element.ontouchmove = (e) => e.stopPropagation();
  }

  return element;
}

function VirtualizedViewport({
  rows,
  stylesheet,
  useInlineStyles,
  fontSize = "0.75rem",
}: VirtualizedViewportProps) {
  const listRef = useRef<HTMLElement | null>(null);

  const contextValue = useMemo(
    () => ({
      rows,
      stylesheet,
      useInlineStyles,
    }),
    [rows, stylesheet, useInlineStyles],
  );

  const lineHeight = useMemo(
    () => getLineHeight(fontSize || "0.75rem"),
    [fontSize],
  );

  return (
    <div
      ref={(el) => {
        if (!listRef.current) {
          listRef.current = bypassScrollLocks(
            el?.closest("pre")?.parentElement ?? null,
          );
        }
      }}
    >
      <VirtualizedViewportContext.Provider value={contextValue}>
        <VirtualizedViewportContent
          scrollElement={listRef}
          batchSize={BATCH_SIZE}
          overscan={OVERSCAN}
          lineHeight={lineHeight}
        />
      </VirtualizedViewportContext.Provider>
    </div>
  );
}

const CodeSyntaxHighlighter = memo(function CodeSyntaxHighlighter({
  code,
  language,
  height,
  fontSize = "0.875rem",
  padding = "1rem",
  wrapLines = true,
  startingLineNumber = 1,
  virtualized = false,
}: CodeSyntaxHighlighterProps) {
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      customStyle={{
        margin: 0,
        padding,
        fontSize,
        backgroundColor: "transparent",
        height,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        overflow: "visible",
      }}
      showLineNumbers={true}
      startingLineNumber={startingLineNumber}
      lineNumberStyle={{
        minWidth: "2.5em",
        paddingRight: "1em",
        color: "rgba(156, 163, 175, 0.5)",
        textAlign: "right",
      }}
      codeTagProps={{
        style: {
          display: "inline-block",
          width: "100%",
          overflow: "visible",
          whiteSpace: wrapLines ? "pre-wrap" : "pre",
          wordBreak: wrapLines ? "break-word" : "normal",
        },
      }}
      renderer={
        virtualized
          ? ({ rows, stylesheet, useInlineStyles }: rendererProps) => (
              <VirtualizedViewport
                rows={rows}
                stylesheet={stylesheet}
                useInlineStyles={useInlineStyles}
              />
            )
          : undefined
      }
    >
      {code}
    </SyntaxHighlighter>
  );
});

export default CodeSyntaxHighlighter;
