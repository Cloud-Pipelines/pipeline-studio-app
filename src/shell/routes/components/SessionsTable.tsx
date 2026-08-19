import { InlineStack } from "@/components/ui/layout";
import { HoverReveal } from "@/components/ui/patterns/hover-reveal";
import { Pill } from "@/components/ui/patterns/pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/patterns/table";
import { Text } from "@/components/ui/typography";
import type { Session } from "@/shell/contracts";
import { SessionActivityCell } from "@/shell/features/sessions/components/SessionActivityCell";
import { SessionRowActions } from "@/shell/features/sessions/components/SessionRowActions";
import { SessionStatusIndicator } from "@/shell/features/sessions/components/SessionStatusIndicator";

interface SessionsTableProps {
  sessions: Session[];
  onOpen: (session: Session) => void;
}

/** Tabular list of sessions; each row opens its session. */
export function SessionsTable({ sessions, onOpen }: SessionsTableProps) {
  const sortedSessions = [...sessions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Bundle</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedSessions.map((session) => (
          <SessionRow key={session.id} session={session} onOpen={onOpen} />
        ))}
      </TableBody>
    </Table>
  );
}

interface SessionRowProps {
  session: Session;
  onOpen: (session: Session) => void;
}

function SessionRow({ session, onOpen }: SessionRowProps) {
  return (
    // `group` lets the hover-revealed row actions appear on hover/focus.
    <TableRow className="group" onClick={() => onOpen(session)}>
      <TableCell>
        <InlineStack gap="2" blockAlign="center">
          <Text weight="medium" truncate>
            {session.name}
          </Text>
          {session.archived ? (
            <Pill size="xs" tone="subdued">
              Archived
            </Pill>
          ) : null}
        </InlineStack>
      </TableCell>
      <TableCell>
        <SessionStatusIndicator sessionId={session.id} />
      </TableCell>
      <TableCell>
        <SessionActivityCell session={session} />
      </TableCell>
      <TableCell>
        {session.config ? (
          <Text size="sm" tone="subdued">
            {session.config.name} v{session.config.version}
          </Text>
        ) : (
          <Text size="sm" tone="subdued">
            &mdash;
          </Text>
        )}
      </TableCell>
      <TableCell>
        <HoverReveal>
          <SessionRowActions session={session} />
        </HoverReveal>
      </TableCell>
    </TableRow>
  );
}
