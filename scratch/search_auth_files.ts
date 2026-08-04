import fs from "fs";
import path from "path";

function listDirFiles(dir: string, results: string[] = []) {
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      listDirFiles(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const routes = listDirFiles(path.resolve("./src/routes"));
console.log("Routes in src/routes:");
routes.forEach((r) => console.log(" -", path.relative("./src/routes", r)));
