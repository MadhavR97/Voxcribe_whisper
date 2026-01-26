import { exec } from "child_process"
import { getFFmpegPath } from "./ffmpegInstaller"

export function convertToWav(input: string, output: string) {
    const ffmpeg = getFFmpegPath()

    return new Promise<void>((resolve, reject) => {
        const cmd = `"${ffmpeg}" -y -i "${input}" -ar 16000 -ac 1 -c:a pcm_s16le "${output}"`
        exec(cmd, err => (err ? reject(err) : resolve()))
    })
}
