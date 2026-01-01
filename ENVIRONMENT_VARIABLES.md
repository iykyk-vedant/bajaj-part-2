# Environment Variables for NexScan

This document lists all environment variables used by the NexScan application and their purpose.

## Required Environment Variables

### Google AI API Key
- `GEMINI_API_KEY`: Your Google AI API key for accessing Gemini models
  - Purpose: Required for AI-powered form data extraction
  - Format: String (API key from Google AI Studio)

### PostgreSQL Database Configuration
The application supports two ways to configure PostgreSQL:

#### Option 1: Using DATABASE_URL (Recommended for Render)
- `DATABASE_URL`: Complete PostgreSQL connection string
  - Purpose: Provides all database connection details in a single variable
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://myuser:mypassword@myhost:5432/mydatabase`

#### Option 2: Individual Connection Parameters (Fallback)
- `PG_HOST`: PostgreSQL server host
  - Purpose: Database server hostname or IP address
  - Format: String
  - Default: `localhost`

- `PG_PORT`: PostgreSQL server port
  - Purpose: Database server port number
  - Format: Integer
  - Default: `5432`

- `PG_USER`: PostgreSQL username
  - Purpose: Database user account for authentication
  - Format: String

- `PG_PASSWORD`: PostgreSQL password
  - Purpose: Password for the database user
  - Format: String

- `PG_DATABASE`: PostgreSQL database name
  - Purpose: Name of the database to connect to
  - Format: String
  - Default: `nexscan`

## Optional Environment Variables

### Application Configuration
- `NODE_ENV`: Node.js environment mode
  - Purpose: Sets the application environment (affects logging, error handling, etc.)
  - Format: String
  - Values: `development`, `production`, `test`
  - Default: `development`

- `PORT`: Port number for the application server
  - Purpose: The port on which the application will listen
  - Format: Integer
  - Default: `3000`
  - Note: Render automatically sets this, but you can override if needed

### Additional API Keys
- `GOOGLE_API_KEY`: Additional Google API key (optional)
  - Purpose: Used for additional Google services if needed
  - Format: String (API key from Google Cloud Console)

## How Environment Variables Are Used

### Database Connection Logic
The application follows this priority when connecting to PostgreSQL:

1. If `DATABASE_URL` is present, use it for connection (with SSL enabled)
2. If `DATABASE_URL` is not present, use individual connection parameters (`PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`)

This approach makes the application compatible with both:
- Render's PostgreSQL add-on (which provides `DATABASE_URL`)
- Traditional hosting with individual connection parameters

### Database Initialization
The application automatically creates required tables during startup:
- `sheets`: Stores sheet metadata (name, creation date)
- `sheet_data`: Stores the actual form data (as JSONB)
- `bom`: Stores bill of materials for component validation
- `consumption_entries`: Stores consumption tracking data
- `dc_numbers`: Stores DC numbers and their associated part codes
- `consolidated_data`: Stores consolidated data for export

## Setting Up Environment Variables

### For Local Development
Create a `.env` file in the project root directory with the following content:

```env
# Required
GEMINI_API_KEY=your_google_ai_api_key_here

# Database - Choose one approach:

# Option 1: Using DATABASE_URL (recommended)
DATABASE_URL=postgresql://username:password@localhost:5432/nexscan

# Option 2: Using individual parameters
PG_HOST=localhost
PG_PORT=5432
PG_USER=your_username
PG_PASSWORD=your_password
PG_DATABASE=nexscan
```

### For Render Deployment
Set these variables in your Render dashboard under your web service settings:
1. Go to your Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Add the required environment variables

When using Render's PostgreSQL add-on, the `DATABASE_URL` variable will be automatically populated, so you only need to add `GEMINI_API_KEY`.

## Security Considerations

- Never commit your `.env` file to version control
- Never expose API keys in client-side code
- Use strong, unique passwords for database access
- Rotate your API keys periodically
- Restrict database access to only necessary IP addresses when possible