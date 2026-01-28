# Final Deployment Guide for Render

## Changes Made

1. Fixed Dockerfile to download Whisper.cpp binaries from the correct URL (changed to `https://github.com/ggml-org/whisper.cpp/releases/download/v1.8.3/whisper-bin-x64.zip`)
2. Updated Dockerfile to handle both possible binary names (`whisper` or `main`) from the zip file
3. Updated Whisper installer to handle both `whisper` and `main` binary names (newer versions may use either)
4. Fixed FFmpeg download URL to use the full static build
5. Updated installer logic to properly handle pre-installed binaries in Docker environment

## Deployment Steps

1. **Push all changes to your GitHub repository**
   - The updated Dockerfile
   - Updated next.config.ts
   - Modified installer files

2. **In Render Dashboard:**
   - Go to your web service settings
   - Ensure Environment is set to "Docker"
   - Make sure it detects the Dockerfile
   - Redeploy

## Key Points

- The Docker build will take longer initially (installing ~500MB of binaries)
- Whisper.cpp releases may have the binary named as either `whisper` or `main`
- Both names are now handled by the updated installer
- FFmpeg and Whisper binaries are now properly included in the Docker image
- Transcription should work without the "FFmpeg not found" error

## Environment Variables

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NODE_ENV` - Set to `production`

## Troubleshooting

If you still encounter issues:
1. Check the Render logs for specific error messages
2. Verify that all environment variables are correctly set
3. Make sure the Docker build completes successfully