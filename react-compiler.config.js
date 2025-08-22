// React Compiler configuration
// https://react.dev/learn/react-compiler#configuring-the-compiler

export default {
  // Enable compiler for development and production
  environment: {
    enableTryCatch: true,
  },

  // Sources to compile (default: all source files)
  sources: (filename) => {
    // Compile all source files but exclude API and test files
    return (
      filename.includes("/src/") &&
      !filename.includes("/src/api/") &&
      !filename.includes(".test.") &&
      !filename.includes(".spec.")
    );
  },

  // Compilation mode
  compilationMode: "annotation", // "annotation" | "infer" | "all"

  // Enable logging for debugging
  logger: {
    // Set to true to see what the compiler is optimizing
    logOptimizations: process.env.NODE_ENV === "development",
  },

  // Hooks to ignore (these will use manual optimization)
  ignore: [
    // Keep manual optimization for performance-critical hooks
    // Example: 'src/hooks/useExpensiveComputation.ts'
  ],
};
