# Production Scheduler & Location Breakdown

This is a web application for scheduling cinema and teledrama shoots. It allows users to manage scenes, generate location breakdowns, and download schedules as PDFs with Sinhala language support.

## Features

- **User Authentication**: Secure login using Google (Gmail) via Firebase.
- **Data Privacy**: Each user has their own private workspace.
- **Smart Input**: Auto-suggestions for Locations and Cast based on previous entries.
- **Production Breakdown**: Automatically generates location-based breakdowns.
- **PDF Export**: Download scene lists and breakdowns as PDFs with full Sinhala font support.
- **Bilingual Support**: Interface and data entry support both English and Sinhala.

## Setup Instructions

Since this application uses Firebase for Authentication and Database (to ensure data privacy and synchronization), you need to add your own Firebase Configuration.

1.  **Create a Firebase Project**:
    *   Go to [firebase.google.com](https://firebase.google.com/) and create a new project.
    *   Enable **Authentication** and set up **Google Sign-In**.
    *   Enable **Cloud Firestore** in data mode.
2.  **Get Configuration**:
    *   In your project settings, look for the "SDK Setup and Configuration" (for Web).
    *   Copy the `firebaseConfig` object.
3.  **Update `js/config.js`**:
    *   Open `js/config.js` in this folder.
    *   Replace the placeholder config with your actual Firebase configuration keys.


## Publishing to GitHub Pages

1.  **Initialize Git**: Open your project folder in your terminal or GitHub Desktop.
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  **Push to GitHub**:
    *   Create a new repository on GitHub.
    *   Follow the instructions to push an existing repository from the command line.
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```
3.  **Enable GitHub Pages**:
    *   Go to your repository **Settings**.
    *   Click on **Pages** in the left sidebar.
    *   Under **Source**, select `main` branch and `/ (root)` folder.
    *   Click **Save**.
    *   Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

## Running the App

Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox). No server installation is required for basic usage, though a local web server (like Live Server) is recommended for better performance with modules.
