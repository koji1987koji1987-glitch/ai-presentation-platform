import { execSync } from "child_process";

let cachedPythonCommand: string | null = null;

/**
 * Dynamically resolves the available Python command in the current environment PATH
 * (checking 'python3' and falling back to 'python'), caching the result.
 */
export function getPythonCommand(): string {
  if (cachedPythonCommand) {
    return cachedPythonCommand;
  }

  // 1. Try 'python3' command
  try {
    execSync("python3 --version", { stdio: "ignore" });
    cachedPythonCommand = "python3";
    return cachedPythonCommand;
  } catch {
    // Silently fallback to next check
  }

  // 2. Try 'python' command
  try {
    execSync("python --version", { stdio: "ignore" });
    cachedPythonCommand = "python";
    return cachedPythonCommand;
  } catch {
    // Silently fallback
  }

  // 3. Absolute default if both fail (let the process command run fail cleanly with command not found)
  cachedPythonCommand = "python3";
  return cachedPythonCommand;
}
