# Updated Deployment Guide for Render

## Changes Made

1. Fixed Dockerfile to download Whisper.cpp binaries from the correct URL (changed from `whisper-cli-linux-x64` to `whisper-bin-linux-x64.zip`)
2. Updated Whisper installer to handle both `whisper` and `main` binary names (newer versions use `main`)
3. Fixed FFmpeg download URL to use the full static build
4. Updated installer logic to properly handle pre-installed binaries in Docker environment

## Deployment Steps

1. **Push all changes to your GitHub repository**
   - The updated Dockerfile
   - Updated next.config.ts
   - Modified installer files

2. **In Render Dashboard:**
   - Go to your web service settings
   - Change Environment from "Node" to "Docker" (if not already done)
   - Make sure it detects the Dockerfile
   - Redeploy

## Key Points

- The Docker build will take longer initially (installing ~500MB of binaries)
- Whisper.cpp newer releases use `main` as the binary name instead of `whisper`
- Both names are now handled by the updated installer
- FFmpeg and Whisper binaries are now properly included in the Docker image
- Transcription should work without the "FFmpeg not found" error

## Environment Variables

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NODE_ENV` - Set to `production`