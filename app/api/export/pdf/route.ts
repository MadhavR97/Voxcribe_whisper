import { NextResponse } from "next/server"
import PDFDocument from "pdfkit/js/pdfkit.standalone.js"
import { Buffer } from "buffer"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { text, filename } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty transcript" },
        { status: 400 }
      )
    }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      })

      const chunks: Uint8Array[] = []

      doc.on("data", (chunk: Uint8Array) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      doc.font("Times-Roman")
      doc.fontSize(12)
      doc.fillColor("black")
      doc.text(text, {
        align: "left",
        lineGap: 4,
      })

      doc.end()
    })

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename || "transcript"}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      }
    )
  } catch (error) {
    console.error("PDF export failed:", error)
    return NextResponse.json(
      { error: "PDF export failed" },
      { status: 500 }
    )
  }
}
