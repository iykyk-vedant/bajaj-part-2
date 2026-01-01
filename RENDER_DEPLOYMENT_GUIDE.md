# Deploying NexScan on Render

This document provides detailed instructions for deploying the NexScan application on Render.

## Prerequisites

1. A Render account (sign up at [https://render.com](https://render.com))
2. A PostgreSQL database instance (can be created on Render)
3. A Google AI API key for Gemini

## Deployment Steps

### 1. Set up PostgreSQL Database

If you don't already have a PostgreSQL instance on Render:

1. Go to your Render dashboard
2. Create a new "PostgreSQL" add-on
3. Note down the connection details (host, port, username, password, database name)

### 2. Create the Web Service

1. In your Render dashboard, create a new "Web Service"
2. Connect it to your GitHub repository containing the NexScan code
3. Choose the branch you want to deploy (typically `main` or `master`)

### 3. Configure Environment Variables

In your Render web service settings, add the following environment variables:

#### Required Environment Variables:
- `GEMINI_API_KEY`: Your Google AI API key for Gemini
- `DATABASE_URL`: Your PostgreSQL connection string (format: `postgresql://username:password@host:port/database`) - This is preferred when using Render's PostgreSQL add-on
- `PG_HOST`: Your PostgreSQL host (fallback if DATABASE_URL is not provided)
- `PG_PORT`: PostgreSQL port (usually 5432)
- `PG_USER`: PostgreSQL username
- `PG_PASSWORD`: PostgreSQL password
- `PG_DATABASE`: PostgreSQL database name

#### Optional Environment Variables:
- `NODE_ENV`: Set to `production` (default if not set)
- `PORT`: The port the app will run on (Render sets this automatically, defaults to 3000)

### 4. Configure Build and Start Commands

The deployment is already configured via the `render.yaml` file in the repository:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run db:init && npm start`

### 5. Deploy

1. Render will automatically detect the `render.yaml` file
2. It will build and deploy your application using the configuration
3. Monitor the deployment logs in the Render dashboard

## Database Initialization

On first deployment, the application will automatically initialize the required database tables. This is handled by the `npm run db:init` command in the start command.

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Verify all PostgreSQL connection environment variables are correctly set
   - Ensure your PostgreSQL instance is accessible from Render
   - Check if your database allows connections from Render's IP ranges
   - If using Render's PostgreSQL add-on, make sure to use the `DATABASE_URL` variable

2. **API Key Issues**:
   - Verify your `GEMINI_API_KEY` is valid and has the necessary permissions
   - Check that the API key hasn't exceeded usage quotas

3. **Build Failures**:
   - Check the build logs in the Render dashboard
   - Ensure all dependencies are properly specified in `package.json`

### Monitoring:
- Check the Render dashboard for deployment logs
- Monitor application logs for runtime errors
- Verify database connectivity by checking if tables are created

## Scaling

Render allows you to scale your application by adjusting the instance type and number of instances in the dashboard. The application is designed to handle multiple instances.

## Updates

To deploy updates:
1. Push changes to your connected GitHub branch
2. Render will automatically trigger a new deployment
3. Monitor the deployment in the dashboard

## Additional Notes

- The application uses PostgreSQL for data persistence
- Database migrations are handled automatically on application startup
- The application is configured to work with Render's environment variables and service architecture
- When using Render's PostgreSQL add-on, the `DATABASE_URL` environment variable is automatically provided and should be used instead of individual connection parameters