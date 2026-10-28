# MINI PROJECT REPORT
## CampusCare: Smart Campus Complaint Tracker Using MongoDB

**Technology:** MongoDB, Node.js, Express.js, HTML, CSS, JavaScript  
**Project type:** NoSQL database mini project  
**Prepared by:** ____________________  
**Class / Roll No.:** ____________________  
**Department:** Computer Science and Engineering  
**College:** ____________________  
**Academic year:** ____________________

---

## 1. Abstract

CampusCare is a web-based complaint management system designed to help students report campus maintenance issues such as electrical faults, plumbing problems, Wi-Fi failures, classroom equipment faults and cleanliness concerns. Students submit a complaint with a title, description, location, category and priority. The application generates a unique ticket ID and initially marks the complaint as Open. The status can later be changed to In Progress or Resolved.

MongoDB is used as the NoSQL database because complaint records are stored as flexible BSON documents. Node.js and Express provide the backend API, while HTML, CSS and JavaScript provide the user interface. The dashboard displays complaint totals and supports search and status filtering. This project demonstrates CRUD operations, document-oriented storage, indexing, validation and aggregation in MongoDB.

## 2. Problem Statement

Campus maintenance issues are often reported informally through verbal communication or scattered messages. This makes it difficult to track whether a complaint has been received, assigned or resolved. A centralized digital system is needed to record reports, retrieve them quickly and show their current status.

## 3. Objectives

1. Provide a simple interface to submit campus complaints.
2. Store complaint details in MongoDB documents.
3. Generate a unique ticket ID for each report.
4. Support Create, Read, Update and Delete (CRUD) operations.
5. Search complaints and filter them by status.
6. Display total, open, in-progress and resolved counts.
7. Demonstrate MongoDB indexes and aggregation.
8. Provide a simple, understandable application for a classroom demonstration.

## 4. Scope

The project is intended for an academic demonstration on a local computer. It can be extended to support authentication, department-wise assignment, email notifications, image uploads, analytics and a role-based administrator panel. The current version does not implement authentication and should not be exposed publicly as-is.

## 5. Hardware and Software Requirements

### Hardware
- Laptop or desktop computer
- Minimum 4 GB RAM recommended
- Internet access only if installing packages or using MongoDB Atlas

### Software
- Windows, macOS or Linux
- Node.js 18 or newer
- MongoDB Community Server or MongoDB Atlas
- Visual Studio Code or another code editor
- Modern web browser

## 6. Technology Description

### MongoDB
MongoDB is a document-oriented NoSQL database. It stores records as BSON documents inside collections. Complaint records can be represented naturally as documents and can be extended with additional fields.

### Node.js
Node.js executes JavaScript on the server and connects the frontend to MongoDB through application code.

### Express.js
Express is used to create HTTP API routes for creating, listing, updating and deleting complaints.

### HTML, CSS and JavaScript
HTML structures the page, CSS styles the dashboard, and browser JavaScript sends requests to the Express API and renders returned data.

## 7. System Architecture

```text
+-----------------------------+
| Student / Campus Staff      |
| Web Browser                 |
+--------------+--------------+
               |
               | HTML / CSS / JavaScript
               v
+-----------------------------+
| CampusCare Frontend         |
| Complaint Form, Search, UI  |
+--------------+--------------+
               |
               | HTTP JSON requests
               v
+-----------------------------+
| Node.js + Express API       |
| Validation and CRUD logic   |
+--------------+--------------+
               |
               | MongoDB Node Driver
               v
+-----------------------------+
| MongoDB                     |
| smart_campus_complaints     |
| complaints collection       |
+-----------------------------+
```

### Working

1. The student fills in the complaint form.
2. The frontend sends the form as JSON to the Express API.
3. The server validates required fields and email format.
4. A ticket ID and timestamps are added.
5. MongoDB stores the complaint document.
6. The dashboard reloads the complaint list and aggregated statistics.
7. Staff can update a complaint's status or delete it.

## 8. MongoDB Database Design

**Database name:** `smart_campus_complaints`  
**Collection name:** `complaints`

### Example document

```json
{
  "_id": "MongoDB-generated ObjectId",
  "ticketId": "CAMP-20261026-A1B2C",
  "studentName": "Aditi Sharma",
  "studentEmail": "aditi@example.com",
  "location": "Block B, Room 204",
  "category": "Electrical",
  "title": "Projector not working",
  "description": "The projector does not turn on during lectures.",
  "priority": "High",
  "status": "Open",
  "adminNote": "",
  "createdAt": "ISODate timestamp",
  "updatedAt": "ISODate timestamp"
}
```

The `_id` field is generated by MongoDB. The displayed ticket ID is a separate human-readable identifier.

### Field description

| Field | Data type | Purpose |
|---|---|---|
| `_id` | ObjectId | MongoDB document identifier |
| `ticketId` | String | Human-readable unique ticket |
| `studentName` | String | Person reporting the issue |
| `studentEmail` | String | Contact email |
| `location` | String | Campus location |
| `category` | String | Issue category |
| `title` | String | Short issue summary |
| `description` | String | Issue details |
| `priority` | String | Low, Medium or High |
| `status` | String | Open, In Progress or Resolved |
| `adminNote` | String | Progress/resolution note |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### Why MongoDB?

- Complaint documents are easy to represent as JSON-like records.
- New fields can be introduced as requirements change.
- Documents can be filtered and sorted efficiently with indexes.
- Aggregation pipelines calculate dashboard statistics.
- The application can scale to support additional complaint categories and metadata.

### Indexes

The application creates these indexes at startup:
- Unique index on `ticketId`
- Compound index on `status` and `createdAt`
- Index on `category`
- Text index on `title`, `description` and `location`

Indexes help MongoDB locate matching documents without scanning the entire collection in many common query patterns. Actual performance depends on dataset size and query shape.

## 9. Main Modules

1. **Complaint submission:** validates and stores new complaint documents.
2. **Complaint listing:** displays the most recent reports.
3. **Search and filter:** finds reports using keywords and status.
4. **Status management:** updates status and optional admin note.
5. **Dashboard statistics:** uses a MongoDB aggregation pipeline to count reports by status.
6. **Delete operation:** removes a selected report after confirmation.

## 10. CRUD Operations

| Operation | HTTP method | API route | MongoDB operation |
|---|---|---|---|
| Create | POST | `/api/complaints` | `insertOne()` |
| Read | GET | `/api/complaints` | `find()` |
| Update | PATCH | `/api/complaints/:id/status` | `findOneAndUpdate()` |
| Delete | DELETE | `/api/complaints/:id` | `deleteOne()` |

## 11. Setup and Execution

1. Install Node.js and MongoDB Community Server, or prepare a MongoDB Atlas cluster.
2. Extract the project ZIP and open the project folder in VS Code.
3. Start the MongoDB service if using a local server.
4. Open the terminal in the project directory.
5. Install dependencies using `npm install`.
6. Run the application using `npm start`.
7. Open `http://localhost:3000`.
8. Enter sample complaint details and click **Submit report**.
9. Verify that the new ticket appears in Recent Reports.
10. Change its status, test search and filters, and confirm the dashboard counts change.

For MongoDB Atlas, set the environment variable before starting the server. In PowerShell:

```powershell
$env:MONGODB_URI="your MongoDB Atlas connection string"
npm start
```

## 12. Sample Demonstration / Expected Output

The application opens a CampusCare dashboard with four statistics: Total Reports, Open, In Progress and Resolved. Initially, these may all be zero because the collection is empty.

### Sample input

- Student name: Aditi Sharma
- Email: aditi@example.com
- Title: Projector not working
- Category: Electrical
- Priority: High
- Location: Block B, Room 204
- Description: The projector does not turn on during lectures.

### Expected output

After submission, the system displays a generated ticket such as `CAMP-20261026-A1B2C` and shows the new report with status **Open**. The actual ticket suffix is generated dynamically, so it will differ between runs.

After changing the status to **In Progress**, the In Progress count should increase by one and the report badge should update. After setting it to **Resolved**, the Resolved count should increase and the Open/In Progress counts should reflect the new state.

### Sample API tests

- `GET http://localhost:3000/api/health` — returns service health.
- `GET http://localhost:3000/api/complaints` — returns complaint documents.
- `GET http://localhost:3000/api/stats` — returns dashboard counts.
- Submit the form in the UI to test `POST /api/complaints`.

## 13. Test Cases

| Test | Action | Expected result |
|---|---|---|
| TC1 | Submit a valid complaint | Complaint is stored and ticket ID is returned |
| TC2 | Submit with missing required fields | Validation error is displayed |
| TC3 | Enter an invalid email | Validation error is displayed |
| TC4 | Search by title or location | Matching reports are displayed |
| TC5 | Filter by Open status | Only open complaints are displayed |
| TC6 | Update status to In Progress | Status and statistics update |
| TC7 | Update status to Resolved | Resolved status is displayed |
| TC8 | Delete a complaint | Complaint is removed from the list |
| TC9 | Stop MongoDB and start the app | Server reports a connection error |
| TC10 | Load an empty collection | Empty-state message and zero counts appear |

These are proposed test cases and expected outcomes; execute them on your own system and record actual results before submitting the report.

## 14. Advantages

- Easy to use and demonstrate
- Centralizes complaint records
- Makes status tracking transparent
- Supports searching and filtering
- Uses MongoDB CRUD operations, indexes and aggregation
- Can be extended with authentication and notifications

## 15. Limitations

- No login or role-based access control
- No email or SMS notifications
- No file/image attachments
- No automatic assignment to maintenance staff
- Intended for local academic demonstration rather than production deployment

## 16. Future Enhancements

- Student and administrator login
- Department-based assignment and access control
- Complaint image attachments
- Email notifications when status changes
- Charts showing frequent issue categories
- SLA tracking and overdue alerts
- Mobile-responsive progressive web application

## 17. Conclusion

CampusCare demonstrates how a NoSQL database can be used to build a practical campus complaint management application. MongoDB stores flexible complaint documents, while Express and Node.js implement the API and CRUD operations. Search, status filtering, indexes and aggregation make the system suitable for demonstrating core NoSQL concepts. The project can be expanded into a more complete campus maintenance platform by adding authentication, assignment workflows and notifications.

## 18. Viva Questions and Answers

**Q1. What is NoSQL?**  
NoSQL refers to database systems that use data models other than the traditional relational-table model. MongoDB is a document-oriented NoSQL database.

**Q2. What is MongoDB?**  
MongoDB stores data as BSON documents inside collections.

**Q3. What is a document?**  
A document is a record made of key-value fields, similar to a JSON object.

**Q4. What is a collection?**  
A collection is a group of MongoDB documents, broadly comparable to a table in a relational database.

**Q5. What is the difference between SQL and NoSQL?**  
Relational SQL databases commonly organize data in tables with predefined schemas and relationships. MongoDB stores document-oriented records with flexible structures and supports queries and indexes.

**Q6. Why did you choose MongoDB?**  
Complaint records are naturally represented as documents, and additional fields can be added as the application evolves. MongoDB also supports filtering, indexing and aggregation.

**Q7. What is CRUD?**  
Create, Read, Update and Delete—the four basic operations performed on stored records.

**Q8. What is BSON?**  
BSON is a binary-encoded serialization format used by MongoDB to store documents. It supports types such as dates and ObjectIds.

**Q9. What is an ObjectId?**  
It is a BSON identifier commonly generated by MongoDB for a document's `_id` field.

**Q10. Why is `ticketId` separate from `_id`?**  
`_id` is the database identifier. `ticketId` is a human-readable tracking code for students and staff.

**Q11. What is an index?**  
An index is a data structure that helps MongoDB locate documents more efficiently for supported queries. Indexes require storage and add some write overhead.

**Q12. What is aggregation?**  
Aggregation processes documents through stages to calculate results. This project uses `$group` and `$sum` to count complaints by status.

**Q13. What is Express.js used for?**  
It defines the HTTP API routes and middleware used by the application.

**Q14. What is an API?**  
An API is an interface through which software components communicate. Here, the frontend sends HTTP requests to the backend.

**Q15. How is complaint status managed?**  
Each complaint starts with `Open`; an update request can change it to `In Progress` or `Resolved`.

**Q16. How do you prevent duplicate ticket IDs?**  
The application creates a unique MongoDB index on `ticketId`, so MongoDB rejects duplicate values.

**Q17. Does this project implement authentication?**  
No. It is an academic demonstration. Authentication and authorization should be added before public deployment.

**Q18. What are the future improvements?**  
Login, role-based access, staff assignment, email notifications, attachments and analytics dashboards.
