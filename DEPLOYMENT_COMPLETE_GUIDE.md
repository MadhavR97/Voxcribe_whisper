# Deployment Complete Guide for Render

## Changes Made

1. **Updated Dockerfile to compile Whisper.cpp from source** - Since pre-built Linux binaries are no longer available, the Dockerfile now clones and compiles Whisper.cpp from source during the build process
2. **Added build dependencies** - Git, CMake, and build tools are now included in the Docker build
3. **Updated Whisper installer** - Simplified to handle the compiled binary properly in Docker environment
4. **Fixed FFmpeg download URL** - Uses the full static build for better compatibility
5. **Optimized installer logic** - Streamlined for Docker deployment environment

## Deployment Steps

1. **Push all changes to your GitHub repository**
   - The updated Dockerfile with source compilation
   - Updated next.config.ts
   - Modified installer files

2. **In Render Dashboard:**
   - Go to your web service settings
   - Ensure Environment is set to "Docker"
   - Make sure it detects the Dockerfile
   - Redeploy

## Key Points

- **Build time will be longer** - Compiling Whisper.cpp from source takes additional time (but only on first build)
- **Larger Docker image** - Including build tools makes the image larger (~400MB additional)
- **FFmpeg and Whisper binaries** are now properly compiled and included in the Docker image
- **Transcription should work** without the "FFmpeg not found" error
- **Subsequent builds** will be faster due to Docker layer caching

## Environment Variables

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NODE_ENV` - Set to `production`

## Troubleshooting

If you still encounter issues:
1. Check the Render logs for specific error messages
2. Verify that all environment variables are correctly set
3. Ensure the Docker build completes successfully (may take 10-15 minutes on first build)
4. Check that the compiled Whisper binary is present in the container