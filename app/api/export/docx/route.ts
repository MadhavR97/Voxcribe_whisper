import { NextRequest, NextResponse } from "next/server"

// Minimal DOCX generator (no docx pkg) – ZIP of OOXML parts

const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++)
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf: Uint8Array): number {
  let c = 0 ^ -1
  for (let i = 0; i < buf.length; i++)
    c = (c >>> 8) ^ CRC32_TABLE[(c ^ buf[i]) & 0xff]
  return (c ^ -1) >>> 0
}

function zipStore(files: { name: string; data: Uint8Array }[]): Buffer {
  const parts: Buffer[] = []
  const central: Buffer[] = []
  let off = 0
  const dosEpoch = (d: Date) => {
    const t = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >>> 1)
    const dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
    return [dt, t]
  }
  const [dt, tm] = dosEpoch(new Date())

  for (const f of files) {
    const name = Buffer.from(f.name, "utf-8")
    const data = Buffer.from(f.data)
    const crc = crc32(data)
    const sig = Buffer.alloc(4)
    sig.writeUInt32LE(0x04034b50, 0)
    const local = Buffer.alloc(26)
    local.writeUInt16LE(20, 0)
    local.writeUInt16LE(0, 2)
    local.writeUInt16LE(0, 4) // store
    local.writeUInt16LE(tm, 6)
    local.writeUInt16LE(dt, 8)
    local.writeUInt32LE(crc, 10)
    local.writeUInt32LE(data.length, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt16LE(name.length, 22)
    local.writeUInt16LE(0, 24)
    parts.push(sig, local, name, data)
    off += sig.length + local.length + name.length + data.length

    const cent = Buffer.alloc(46)
    cent.writeUInt32LE(0x02014b50, 0)
    cent.writeUInt16LE(20, 4)
    cent.writeUInt16LE(20, 6)
    cent.writeUInt16LE(0, 8)
    cent.writeUInt16LE(0, 10)
    cent.writeUInt16LE(tm, 12)
    cent.writeUInt16LE(dt, 14)
    cent.writeUInt32LE(crc, 16)
    cent.writeUInt32LE(data.length, 20)
    cent.writeUInt32LE(data.length, 24)
    cent.writeUInt16LE(name.length, 28)
    cent.writeUInt16LE(0, 30)
    cent.writeUInt16LE(0, 32)
    cent.writeUInt16LE(0, 34)
    cent.writeUInt16LE(0, 36)
    cent.writeUInt32LE(0, 38)
    cent.writeUInt32LE(off - data.length - name.length - 26 - 4, 42)
    central.push(cent, name)
  }

  const centralBuf = Buffer.concat(central)
  const endBuf = Buffer.alloc(22)
  endBuf.writeUInt32LE(0x06054b50, 0)
  endBuf.writeUInt16LE(0, 4)
  endBuf.writeUInt16LE(0, 6)
  endBuf.writeUInt16LE(files.length, 8)
  endBuf.writeUInt16LE(files.length, 10)
  endBuf.writeUInt32LE(centralBuf.length, 12)
  endBuf.writeUInt32LE(off, 16)
  endBuf.writeUInt16LE(0, 20)

  return Buffer.concat([...parts, centralBuf, endBuf])
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildDocx(content: string): Buffer {
  const paras = content.split(/\n\n+/).filter(Boolean)
  const body =
    paras.length > 0
      ? paras
          .map(
            (p) =>
              `<w:p><w:r><w:t>${escXml(p)}</w:t></w:r></w:p>`
          )
          .join("")
      : `<w:p><w:r><w:t>(No transcript)</w:t></w:r></w:p>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2004/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}</w:body>
</w:document>`

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2004/relationships"/>
`

  const files = [
    { name: "[Content_Types].xml", data: new TextEncoder().encode(contentTypes) },
    { name: "_rels/.rels", data: new TextEncoder().encode(rels) },
    { name: "word/document.xml", data: new TextEncoder().encode(document) },
    { name: "word/_rels/document.xml.rels", data: new TextEncoder().encode(wordRels) },
  ]

  return zipStore(files)
}

export async function POST(req: NextRequest) {
  try {
    const { text = "", filename = "transcript" } = (await req.json()) as {
      text?: string
      filename?: string
    }
    const safeName = (filename || "transcript").replace(/[^a-zA-Z0-9._-]/g, "_")
    const content = String(text || "(No transcript)").trim() || "(No transcript)"

    const buf = buildDocx(content)
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    })
  } catch (e) {
    console.error("DOCX export failed:", e)
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    )
  }
}
