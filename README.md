# NexScan: AI-Powered Handwritten Form Extraction

NexScan is a Next.js application designed to capture, extract, and validate data from handwritten forms using the power of Generative AI. Users can upload an image of a form or use their device's camera to capture one. The AI then processes the image, extracts the relevant information into structured fields, and presents it in a form for review and validation.

## Running the Project Locally

To run this project on your local machine using an editor like Visual Studio Code, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A Google AI API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 1. Installation

First, open the project folder in Visual Studio Code. Then, open the integrated terminal (you can use `Ctrl+\``) and install the necessary project dependencies by running:

```bash
npm install
```

### 2. Set Up Environment Variables

This project requires an API key to connect to Google's AI services and MySQL database configuration.

1.  Create a new file named `.env` in the root of your project directory.
2.  Add your Google AI API key and MySQL database configuration to this file as follows:

```env
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=nexscan

# Gemini API Key (required for AI features)
GEMINI_API_KEY=YOUR_API_KEY_HERE

# Google API Key (optional)
GOOGLE_API_KEY=
```

Replace `YOUR_API_KEY_HERE` with the actual key you obtained from Google AI Studio.

For MySQL configuration:
- `MYSQL_HOST`: Your MySQL server host (usually localhost)
- `MYSQL_PORT`: Your MySQL server port (usually 3306)
- `MYSQL_USER`: Your MySQL username
- `MYSQL_PASSWORD`: Your MySQL password
- `MYSQL_DATABASE`: The database name (nexscan by default)
### 3. Initialize the MySQL Database

Before running the application, you need to initialize the MySQL database tables:

```bash
npm run init-db
```

This command will create the necessary tables in your MySQL database for storing sheet data.

### 4. Run the Development Servers

This application consists of two main parts that need to be run simultaneously in separate terminals:

1.  **The Next.js Web Application:** This is the user interface.
2.  **The Genkit AI Flows:** This is the backend service that runs the AI models.

You'll need two separate terminal windows or use VS Code's split terminal feature.

**In your first terminal, run the Next.js app:**

```bash
npm run dev
```

This will start the web server, typically on `http://localhost:3001`.
**In your second terminal, run the Genkit server:**

```bash
npm run genkit:dev
```

This starts the Genkit development server, which makes the AI flows available for the Next.js application to call.
### 5. Access the Application

Once both servers are running, open your web browser and navigate to:

[http://localhost:3001](http://localhost:3001)
You should now see the NexScan application running and be able to use its features.
## Project Structure & File Explanations

This project is built with Next.js (App Router), TypeScript, Tailwind CSS, and ShadCN UI components. AI capabilities are powered by Google's Gemini model via Genkit.

## MySQL Persistence

This project now includes MySQL persistence for storing sheet data. Previously, sheet data was stored in the browser's localStorage, which meant that data would be lost when the browser cache was cleared or when accessing the application from a different device.

With MySQL persistence:
- Sheet data is stored in a MySQL database
- Data persists across browser sessions and device changes
- Multiple users can access the same sheet data (when implemented with user authentication)
- Data is more secure and reliable than localStorage

The implementation includes:
- Database connection pooling for efficient resource usage
- Automatic table creation for sheets and sheet data
- CRUD operations for managing sheet data
- Error handling for database operations
### Root Directory

- **`.env`**: Stores environment variables. For this project, it holds the `GEMINI_API_KEY` for the AI service.
- **`apphosting.yaml`**: Configuration file for deploying the application on Firebase App Hosting.
- **`components.json`**: The configuration file for `shadcn/ui`. It defines the style, component library path, and color settings for the UI components.
- **`next.config.ts`**: The main configuration file for Next.js. It includes settings for TypeScript, ESLint, and importantly, configures allowed remote image domains (`picsum.photos`, `images.unsplash.com`).
- **`package.json`**: Lists all project dependencies (like `next`, `react`, `genkit`, `lucide-react`) and defines scripts for running, building, and linting the application (e.g., `npm run dev`).
- **`README.md`**: This file, providing an overview and documentation of the project.
- **`tailwind.config.ts`**: The configuration file for Tailwind CSS. It sets up the visual design of the app, including custom fonts and a color palette based on CSS variables defined in `globals.css`.
- **`tsconfig.json`**: The TypeScript compiler configuration file. It sets rules for how TypeScript code is checked and compiled, and defines path aliases (like `@/*`) for cleaner imports.

---

### `src/ai` - Artificial Intelligence

This directory contains the core AI logic, powered by Genkit.

- **`genkit.ts`**: Initializes and configures the Genkit instance. It specifies the AI plugin to use (`@genkit-ai/google-genai`) and sets the default model for the application, which is `googleai/gemini-2.5-flash`.
- **`dev.ts`**: A development file used by the Genkit CLI to start and manage the AI flows during local development. It imports the flow files to make them available to the Genkit development server.

#### `src/ai/flows`

This sub-directory holds the Genkit "flows," which are server-side functions that orchestrate calls to the AI model.

- **`extract-data-from-handwritten-form.ts`**:
  - Defines the primary AI flow for the application.
  - It takes a photo of a form (as a Base64 data URI) as input.
  - It uses the Gemini model to analyze the image and extract data into a structured JSON object with fields like `branch`, `productDescription`, `complaintNo`, etc.
  - It also defines a field `others` to capture any text that doesn't fit into the predefined categories.
  - It exports the `extractData` function and its associated input/output TypeScript types (`ExtractDataInput`, `ExtractDataOutput`).

- **`improve-extraction-accuracy-with-llm.ts`**:
  - Defines a secondary (currently unused but available) flow designed to refine OCR results.
  - It would take raw text from an OCR process and the form image to correct and structure the data. This provides a potential two-step extraction process for higher accuracy if needed in the future.

---

### `src/app` - Application UI & Routing

This is the heart of the Next.js application, following the App Router paradigm.

- **`layout.tsx`**: The root layout of the application. It wraps all pages, applies the global stylesheet (`globals.css`), includes custom fonts from Google Fonts, and sets up the `Toaster` component for displaying notifications.
- **`page.tsx`**: The main page of the application (`/`).
  - This is a client-side component (`'use client'`) that manages the application's state, including the uploaded image, loading status, and extracted data.
  - It orchestrates the interaction between the `ImageUploader` and `DataForm` components.
  - When an image is ready, it calls the `extractDataFromImage` server action.
- **`actions.ts`**: A file for Next.js Server Actions.
  - It exports the `extractDataFromImage` function, which acts as a bridge between the client-side components and the server-side AI flow. It calls the `extractData` flow from the AI directory and handles any potential errors, returning a consistent state object to the client.
- **`globals.css`**: The global stylesheet. It includes base Tailwind CSS layers and defines the application's color theme using HSL CSS variables for both light and dark modes (e.g., `--primary`, `--background`).

---

### `src/components` - Reusable UI Components

This directory contains all the React components used to build the user interface.

- **`image-uploader.tsx`**: A component that allows the user to either upload an image file or use their device's camera.
  - It displays a preview of the image or the live camera feed.
  - It handles camera permissions and provides keyboard shortcuts (Enter to capture, Escape to toggle camera mode).
  - When an image is captured or uploaded, it converts it to a data URI and passes it to the parent component (`page.tsx`) via the `onImageReady` prop.
- **`data-form.tsx`**: A form to display, validate, and edit the data extracted by the AI.
  - It uses `react-hook-form` for form state management and `zod` for validation.
  - It dynamically populates the form fields with the `initialData` received from the AI.
  - It includes functionality to "Export to CSV" and "Save Changes."
  - It contains a separate, non-editable "Other Extracted Text" area at the bottom to display any miscellaneous text captured by the AI, which is not part of the main form data and is discarded on save.

#### `src/components/ui`

This sub-directory contains general-purpose UI components provided by `shadcn/ui`, which are styled with Tailwind CSS. These include:

- `button.tsx`
- `card.tsx`
- `input.tsx`
- `label.tsx`
- `textarea.tsx`
- `toast.tsx` & `toaster.tsx`
- And many others that provide the building blocks for the application's interface.

---

### `src/hooks` - Custom React Hooks

- **`use-toast.ts`**: A custom hook for showing "toast" notifications. It provides a `toast()` function that can be called from any component to display messages (e.g., "Extraction Successful").
- **`use-mobile.tsx`**: A utility hook to detect if the user is on a mobile device based on screen width.

---

### `src/lib` - Library & Utility Functions

- **`utils.ts`**: Contains utility functions. The `cn` function is a helper that merges Tailwind CSS classes, making it easier to apply conditional styling.
- **`placeholder-images.json`** & **`placeholder-images.ts`**: These files manage placeholder images for the app. The JSON file defines a list of images, and the TypeScript file exports them as a typed array, ensuring consistent use of placeholders throughout the app.
