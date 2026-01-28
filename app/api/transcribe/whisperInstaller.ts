import fs from "fs"
import path from "path"
import https from "https"
import { execSync } from "child_process"

const WHISPER_DIR = path.join(process.cwd(), "whisper")
const SRC_DIR = path.join(WHISPER_DIR, "src")

const MODEL_NAME = "ggml-small.bin"
const MODEL_PATH = path.join(WHISPER_DIR, MODEL_NAME)

const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"

// =========================
// Paths
// =========================

export function getWhisperBinaryPath() {
  const platform = process.platform

  if (platform === "win32") {
    return path.join(WHISPER_DIR, "whisper-cli.exe")
  }

  if (platform === "linux") {
    return path.join(WHISPER_DIR, "whisper")
  }

  if (platform === "darwin") {
    return "/usr/local/bin/whisper-cli"
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

export function getWhisperModelPath() {
  return MODEL_PATH
}

// =========================
// Installer
// =========================

export async function ensureWhisperInstalled() {
  const platform = process.platform
  const binPath = getWhisperBinaryPath()

  if (!fs.existsSync(WHISPER_DIR)) {
    fs.mkdirSync(WHISPER_DIR, { recursive: true })
  }

  // ---------- macOS ----------
  if (platform === "darwin") {
    try {
      execSync("which whisper-cli", { stdio: "ignore" })
      return
    } catch {
      throw new Error(
        "Whisper not found on macOS. Please run: brew install whisper-cpp"
      )
    }
  }

  // ---------- Linux (Render-safe, build once) ----------
  if (platform === "linux") {
    if (fs.existsSync(binPath)) return

    console.log("🔨 Building Whisper from source (linux)")

    // Clone only once
    if (!fs.existsSync(SRC_DIR)) {
      execSync(
        `cd ${WHISPER_DIR} && git clone --depth 1 --branch v1.5.4 https://github.com/ggml-org/whisper.cpp.git src`,
        { stdio: "inherit" }
      )
    }

    // Build safely (Render CPU throttling friendly)
    execSync(`cd ${SRC_DIR} && make -j2`, { stdio: "inherit" })

    // Find CLI binary dynamically
    const candidates = ["whisper", "whisper-cli", "main"]
    let builtBinary: string | null = null

    for (const name of candidates) {
      const found = findFileRecursive(SRC_DIR, name)
      if (found) {
        builtBinary = found
        break
      }
    }

    if (!builtBinary) {
      throw new Error("Whisper CLI binary was not built")
    }

    fs.copyFileSync(builtBinary, binPath)
    fs.chmodSync(binPath, 0o755)

    console.log("✅ Whisper binary built at", binPath)
    return
  }

  // ---------- Windows ----------
  if (platform === "win32") {
    if (fs.existsSync(binPath)) return

    const url =
      "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip"

    const tmpPath = path.join(WHISPER_DIR, "whisper.zip")

    await downloadFileWithProgress(url, tmpPath, "Whisper binary")

    execSync(
      `powershell -Command "Expand-Archive -Force '${tmpPath}' '${WHISPER_DIR}'"`,
      { stdio: "inherit" }
    )

    const exePath =
      findFileRecursive(WHISPER_DIR, "whisper.exe") ||
      findFileRecursive(WHISPER_DIR, "main.exe")

    if (!exePath) {
      throw new Error(
        "Whisper ZIP extracted but neither whisper.exe nor main.exe was found"
      )
    }

    fs.renameSync(exePath, binPath)
    fs.chmodSync(binPath, 0o755)
    fs.unlinkSync(tmpPath)

    console.log("✅ Whisper binary installed at", binPath)
    return
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

// =========================
// Model
// =========================

export async function ensureWhisperModel() {
  if (fs.existsSync(MODEL_PATH)) return

  console.log("⬇️ Downloading Whisper model:", MODEL_NAME)

  await downloadFileWithProgress(MODEL_URL, MODEL_PATH, "Whisper model")

  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error("Whisper model download failed")
  }

  console.log("✅ Whisper model downloaded at", MODEL_PATH)
}

// =========================
// Helpers
// =========================

function downloadFileWithProgress(
  url: string,
  dest: string,
  label: string,
  redirects = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)

    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          [301, 302, 303, 307, 308].includes(res.statusCode)
        ) {
          if (!res.headers.location) {
            reject(new Error("Redirect with no Location header"))
            return
          }

          if (redirects > 5) {
            reject(new Error("Too many redirects"))
            return
          }

          console.log(`↪ Redirected → ${res.headers.location}`)
          file.close()
          fs.unlinkSync(dest)

          downloadFileWithProgress(
            res.headers.location,
            dest,
            label,
            redirects + 1
          )
            .then(resolve)
            .catch(reject)
          return
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`))
          return
        }

        res.pipe(file)

        file.on("finish", () => {
          file.close()
          process.stdout.write("\n")
          resolve()
        })
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err))
      })
  })
}

function findFileRecursive(dir: string, filename: string): string | null {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) {
      return fullPath
    }

    if (entry.isDirectory()) {
      const found = findFileRecursive(fullPath, filename)
      if (found) return found
    }
  }
  return null
}
