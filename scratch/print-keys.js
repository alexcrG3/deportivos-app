import * as mockData from "../src/lib/mock-data";

console.log("Mock data keys:");
for (const [key, val] of Object.entries(mockData)) {
  if (Array.isArray(val)) {
    console.log(`- ${key}: Array of ${val.length} items. Sample:`, val[0]);
  } else {
    console.log(`- ${key}:`, typeof val, val);
  }
}
