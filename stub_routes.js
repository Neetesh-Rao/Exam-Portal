const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/app/api', function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('import { db } from "@/db"')) {
      const stub = `import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api-utils";
import { connectToDatabase } from "@/lib/mongoose";

export async function GET(req: NextRequest) {
  return jsonError("Not Implemented", 501);
}

export async function POST(req: NextRequest) {
  return jsonError("Not Implemented", 501);
}

export async function PATCH(req: NextRequest) {
  return jsonError("Not Implemented", 501);
}

export async function DELETE(req: NextRequest) {
  return jsonError("Not Implemented", 501);
}
`;
      fs.writeFileSync(filePath, stub);
      console.log('Stubbed: ' + filePath);
    }
  }
});
