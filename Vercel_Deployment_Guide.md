# Vercel Frontend Deployment Guide

This document provides detailed instructions for deploying the frontend of the Bajaj application to Vercel and configuring it to work with the backend hosted on Render.

## Prerequisites

1. A Vercel account (sign up at [https://vercel.com](https://vercel.com))
2. A GitHub repository containing the frontend code
3. The backend API deployed on Render with the correct environment variables

## Deployment Steps

### 1. Prepare the Repository

Make sure your repository is properly structured and contains all necessary files for the Next.js application.

### 2. Connect to Vercel

1. Go to your Vercel dashboard at [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on "Add New..." and select "Project"
3. Connect your GitHub account and select the repository containing this Next.js application
4. Click "Import"

### 3. Configure Project Settings

During the import process, Vercel will automatically detect that this is a Next.js project and configure the build settings. No additional configuration file is needed.

### 4. Set Environment Variables

In your Vercel project settings, go to "Settings" > "Environment Variables" and add the following:

#### Required Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

#### Notes:
- All variables prefixed with `NEXT_PUBLIC_` are available on the client-side
- The Supabase credentials should match those used in your backend

### 5. Build and Deploy

1. Vercel will automatically run the build process using the Next.js build system
2. Monitor the deployment logs in the Vercel dashboard to ensure successful build
3. Once built, Vercel will provide you with a preview URL

### 6. Configure Custom Domain (Optional)

If you want to use a custom domain:
1. Go to your project settings in Vercel
2. Navigate to "Domains" section
3. Add your custom domain and follow the instructions to configure DNS records

## Backend Configuration

Ensure your backend on Render is configured to accept requests from your Vercel deployment URL. You may need to update CORS settings in your backend if there are restrictions.

## Verification

After deployment, verify the following:

1. The application loads correctly on the Vercel URL
2. Authentication works (sign up, login, logout)
3. API calls to the backend on Render are successful
4. All functionality works as expected

## Troubleshooting

### Common Issues:

1. **Authentication fails**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` match your backend configuration
2. **API calls fail**: Verify that your backend allows requests from the Vercel domain
3. **CORS errors**: Check that your backend allows requests from your Vercel domain
4. **Database connection**: Confirm that your backend on Render has the correct database connection settings

### Checking Logs:

- Vercel: Check deployment logs in the Vercel dashboard
- Render: Check application logs in the Render dashboard

## Additional Notes

- The application uses Next.js App Router which is fully supported by Vercel
- Server-side API routes will be handled by Vercel's edge functions
- The frontend makes relative API calls internally to `/api/*` routes which are served from the same domain
- The application is configured to work with Supabase for authentication