import fs from "fs"
import path from "path"
import https from "https"
import { execSync } from "child_process"

const BIN_DIR = path.join(process.cwd(), "bin")
let FFMPEG_PATH =
    process.platform === "win32"
        ? path.join(BIN_DIR, "ffmpeg.exe")
        : path.join(BIN_DIR, "ffmpeg")

// Check if we're in Docker/Render environment
if (process.platform === "linux" && process.env.NODE_ENV === 'production') {
    const dockerFfmpegPath = path.join(process.cwd(), "bin", "ffmpeg");
    if (fs.existsSync(dockerFfmpegPath)) {
        FFMPEG_PATH = dockerFfmpegPath;
    }
}

export function getFFmpegPath() {
    // Check if we're in Docker/Render environment
    if (process.platform === "linux" && process.env.NODE_ENV === 'production') {
        const dockerFfmpegPath = path.join(process.cwd(), "bin", "ffmpeg");
        if (fs.existsSync(dockerFfmpegPath)) {
            return dockerFfmpegPath;
        }
    }
    return FFMPEG_PATH
}

export async function ensureFFmpegInstalled() {
    if (fs.existsSync(FFMPEG_PATH)) {
        console.log("✅ FFmpeg already installed")
        return
    }

    fs.mkdirSync(BIN_DIR, { recursive: true })

    const platform = process.platform
    
    // In production environments (like Render), FFmpeg should be pre-installed
    if (process.env.NODE_ENV === 'production') {
        throw new Error(`FFmpeg not found at ${FFMPEG_PATH}. Ensure it's included in your Docker image.`);
    }
    
    console.log("⬇️ Installing FFmpeg for", platform)

    let url: string

    if (platform === "win32") {
        // ✅ Stable, direct ZIP from GitHub
        url =
            "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    } else if (platform === "linux") {
        url =
            "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
    } else if (platform === "darwin") {
        throw new Error(
            "FFmpeg not found on macOS. Please install it using: brew install ffmpeg"
        )
    } else {
        throw new Error("Unsupported platform for FFmpeg")
    }

    const archive = path.join(BIN_DIR, path.basename(url))
    await download(url, archive)

    if (platform === "win32") {
        console.log("📦 Extracting FFmpeg ZIP")

        execSync(
            `powershell -NoProfile -Command "Expand-Archive -Path '${archive}' -DestinationPath '${BIN_DIR}' -Force"`,
            { stdio: "inherit" }
        )

        const exe = findRecursive(BIN_DIR, "ffmpeg.exe")
        fs.copyFileSync(exe, FFMPEG_PATH)
    } else {
        execSync(`tar -xf "${archive}" -C "${BIN_DIR}"`)
        fs.copyFileSync(findRecursive(BIN_DIR, "ffmpeg"), FFMPEG_PATH)
        fs.chmodSync(FFMPEG_PATH, 0o755)
    }

    fs.unlinkSync(archive)
    console.log("✅ FFmpeg installed at", FFMPEG_PATH)
}

/* ---------------- Helpers ---------------- */

function download(
    url: string,
    dest: string,
    redirects = 0
): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest)

        https
            .get(url, res => {
                // 🔁 Handle redirects
                if (
                    res.statusCode &&
                    [301, 302, 303, 307, 308].includes(res.statusCode)
                ) {
                    if (!res.headers.location || redirects > 5) {
                        reject(new Error("Too many redirects"))
                        return
                    }

                    console.log(`↪ Redirected → ${res.headers.location}`)
                    file.close(() => {
                        fs.unlinkSync(dest)
                        download(res.headers.location!, dest, redirects + 1)
                            .then(resolve)
                            .catch(reject)
                    })
                    return
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`Download failed: ${res.statusCode}`))
                    return
                }

                res.pipe(file)

                file.on("finish", () => {
                    file.close(err => {
                        if (err) reject(err)
                        else resolve()
                    })
                })
            })
            .on("error", err => {
                file.close(() => {
                    fs.unlink(dest, () => reject(err))
                })
            })
    })
}


function findRecursive(dir: string, name: string): string {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isFile() && e.name.toLowerCase() === name.toLowerCase()) return p
        if (e.isDirectory()) {
            const r = findRecursive(p, name)
            if (r) return r
        }
    }
    throw new Error("FFmpeg binary not found after extraction")
}
