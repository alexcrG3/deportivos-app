import fs from "fs";

const content = fs.readFileSync("src/components/ui/sidebar.tsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("SidebarInset")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
