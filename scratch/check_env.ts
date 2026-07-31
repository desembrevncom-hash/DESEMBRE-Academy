import fs from "fs";
import path from "path";

const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  console.log(".env.local content:\n", fs.readFileSync(envPath, "utf-8"));
} else {
  console.log(".env.local does not exist");
}
