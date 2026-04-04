export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let text = "";

    if (fileName.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (fileName.endsWith(".docx")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else if (fileName.endsWith(".pptx") || fileName.endsWith(".ppt")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const officeParser = require("officeparser");
      text = await officeParser.parseOfficeAsync(buffer, { outputErrorToConsole: true });
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, PPTX, or TXT." },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from file. Please try pasting the text instead." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error("[extract-text]", err);
    return NextResponse.json(
      { error: "Failed to read file. Please try pasting the text instead." },
      { status: 500 }
    );
  }
}
