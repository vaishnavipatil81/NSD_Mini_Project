# CampusCare — Smart Campus Complaint Tracker

A beginner-friendly NoSQL mini project built with MongoDB, Node.js, Express, HTML, CSS and JavaScript.

## Features

- Submit a campus maintenance complaint
- Automatic unique ticket ID
- View complaint statistics (total, open, in progress, resolved)
- Search complaints by ticket ID, title, location, student, category or description
- Filter by status
- Update complaint status and add an admin note
- Delete a complaint
- Server-side input validation
- MongoDB indexes for ticket IDs, status/date, category and text search

## Requirements

- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- A web browser

## Run on Windows (VS Code / PowerShell)

1. Extract the ZIP file.
2. Open the extracted `Smart_Campus_Complaint_Tracker` folder in VS Code.
3. Start MongoDB. If using MongoDB Community Server, confirm the MongoDB service is running. If using Atlas, copy your connection string.
4. Open the VS Code terminal in this project folder.
5. Install dependencies:

   ```powershell
   npm install
   ```

6. For local MongoDB, start the application:

   ```powershell
   npm start
   ```

   The default connection is `mongodb://127.0.0.1:27017`. For Atlas, set the environment variable before starting:

   ```powershell
   $env:MONGODB_URI="your MongoDB Atlas connection string"
   npm start
   ```

7. Open `http://localhost:3000` in your browser.

## Database details

- Database: `smart_campus_complaints`
- Collection: `complaints`

The collection and indexes are created automatically when the server connects. Submit a complaint through the UI to create the first document.

## Example API routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check the server |
| GET | `/api/complaints` | List/search/filter complaints |
| GET | `/api/stats` | Dashboard totals using aggregation |
| POST | `/api/complaints` | Submit a complaint |
| PATCH | `/api/complaints/:id/status` | Update status and admin note |
| DELETE | `/api/complaints/:id` | Delete a complaint |

Example list query: `http://localhost:3000/api/complaints?status=Open`

## Sample complaint

```json
{
  "studentName": "Aditi Sharma",
  "studentEmail": "aditi@example.com",
  "location": "Block B, Room 204",
  "category": "Electrical",
  "title": "Projector not working",
  "description": "The projector does not turn on during lectures.",
  "priority": "High"
}
```

The server adds `ticketId`, `status`, `adminNote`, `createdAt` and `updatedAt`.

## Troubleshooting

- **MongoDB connection refused:** start MongoDB Community Server or check the Atlas URI and network access settings.
- **`npm` is not recognized:** install Node.js LTS, reopen the terminal, and check `node -v` and `npm -v`.
- **Port 3000 is busy:** in PowerShell run `$env:PORT="3001"; npm start`, then open `http://localhost:3001`.
- **No reports appear:** submit a report first; the collection starts empty.

## Important

This is an academic demonstration app. It does not implement real user authentication or role-based admin access. The status-update and delete controls are available to anyone who can access the app, so do not deploy it publicly without adding authentication and authorization.


## Added dashboard features

- **Complaint insights:** category totals and monthly reporting trend from the `/api/analytics` endpoint using MongoDB aggregation.
- **Progress timeline:** each new complaint records an initial Open event; status updates append a timestamped history event. Older records without `statusHistory` display a compatible best-effort timeline.
- **Dark mode:** use the theme button in the top-right; your selection is saved in this browser.
- **Resolution time:** estimated from `createdAt` to the latest `updatedAt` for resolved reports. If a resolved complaint is edited later, the estimate can include that later update time.

After replacing the project files, run `npm install` if needed and `npm start`. Existing complaints remain in MongoDB; they are not deleted or migrated.
