# Deploying NexScan to Render

This guide explains how to deploy the NexScan application to Render.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. A Google AI API Key (get one from [Google AI Studio](https://aistudio.google.com/app/apikey))
3. A MySQL database (you can use Render's database service or any external MySQL provider)

## Deployment Steps

### 1. Fork the Repository

First, fork this repository to your GitHub account.

### 2. Create a New Web Service on Render

1. Log in to your Render dashboard
2. Click "New+" and select "Web Service"
3. Connect your GitHub account and select your forked repository
4. Fill in the following settings:
   - Name: `nexscan-app` (or any name you prefer)
   - Region: Choose the region closest to your users
   - Branch: `main` (or your preferred branch)
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

### 3. Configure Environment Variables

In the "Environment Variables" section, add the following variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MYSQL_HOST` | Your MySQL host |
| `MYSQL_PORT` | Your MySQL port (usually 3306) |
| `MYSQL_USER` | Your MySQL username |
| `MYSQL_PASSWORD` | Your MySQL password |
| `MYSQL_DATABASE` | Your MySQL database name |
| `GEMINI_API_KEY` | Your Google AI API key |

### 4. Configure Database

If you don't have a MySQL database yet, you can create one on Render:

1. In your Render dashboard, click "New+" and select "Database"
2. Choose "MySQL"
3. Configure the database settings
4. After creation, copy the connection details to your web service environment variables

### 5. Initialize the Database

After deploying your application, you need to initialize the database tables:

1. Go to your web service in the Render dashboard
2. Click on "Shell" in the "Connect" section
3. Run the following command:
   ```
   npm run init-db
   ```

### 6. Deploy

Click "Create Web Service" to start the deployment process. Render will automatically build and deploy your application.

## Troubleshooting

### Common Issues

1. **Build Failures**: Make sure all dependencies are correctly listed in `package.json`
2. **Runtime Errors**: Check the logs in the Render dashboard for detailed error messages
3. **Database Connection**: Ensure your database credentials are correct and the database is accessible from Render

### Checking Logs

You can view detailed logs for your deployment and runtime in the Render dashboard:
1. Go to your web service
2. Click on "Logs" to see real-time logs

## Updating the Application

To update your deployed application:
1. Push changes to your GitHub repository
2. Render will automatically redeploy the application