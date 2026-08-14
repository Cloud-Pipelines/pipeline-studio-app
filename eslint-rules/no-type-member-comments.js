const MESSAGE =
  "No block comments on interface fields, type members, or Props. A field that needs a comment to say what it is should be renamed instead. If you must record a non-obvious constraint, use a // line comment. See CLAUDE.md.";

const noTypeMemberComments = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow block comments (/* */ and /** */) inside interface and type-literal bodies.",
    },
    schema: [],
    messages: { noBlockComment: MESSAGE },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const typeBodies = [];

    return {
      "TSInterfaceBody, TSTypeLiteral"(node) {
        typeBodies.push(node.range);
      },
      "Program:exit"() {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type !== "Block") continue;

          const isInsideTypeBody = typeBodies.some(
            ([start, end]) =>
              start <= comment.range[0] && comment.range[1] <= end,
          );
          if (!isInsideTypeBody) continue;

          context.report({ loc: comment.loc, messageId: "noBlockComment" });
        }
      },
    };
  },
};

export default {
  rules: {
    "no-type-member-comments": noTypeMemberComments,
  },
};
