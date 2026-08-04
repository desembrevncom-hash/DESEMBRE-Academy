import fs from "fs";
import path from "path";

function searchInDir(dir: string, pattern: string, results: { path: string; line: number; text: string }[] = []) {
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== ".output" && file !== "dist") {
        searchInDir(fullPath, pattern, results);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if ([".ts", ".tsx", ".json", ".sql", ".md", ".env", ".html"].includes(ext)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        lines.forEach((lineText, idx) => {
          if (lineText.toLowerCase().includes(pattern.toLowerCase())) {
            results.push({ path: fullPath, line: idx + 1, text: lineText.trim() });
          }
        });
      }
    }
  }
  return results;
}

const targetDir = path.resolve("./src");
const scratchDir = path.resolve("./scratch");

console.log("Detailed search in src/...");
const srcResults = searchInDir(targetDir, "academy.desembre-vn.com");

console.log("Detailed search in scratch/...");
const scratchResults = searchInDir(scratchDir, "academy.desembre-vn.com");

console.log("\nResults in src/:", JSON.stringify(srcResults, null, 2));
console.log("\nResults in scratch/:", JSON.stringify(scratchResults, null, 2));
