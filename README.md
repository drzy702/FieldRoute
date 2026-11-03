# Travlr – Full-Stack Travel Booking Application

A full-stack travel booking web application built using the **MEAN stack (MongoDB, Express.js, Angular, and Node.js)**. Travlr allows users to explore travel packages, search and filter available trips, create accounts, and manage their bookings. The application also includes an Angular-based administration dashboard for managing travel packages.

Originally developed as part of the CS-465 Full Stack Development course, the application was further expanded with authentication, trip management, enhanced search functionality, and a customer booking system.

## Technologies Used

- **Frontend:** Angular, TypeScript, HTML, CSS, Handlebars
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JSON Web Tokens (JWT), Passport.js
- **Architecture:** RESTful APIs, MVC (Model-View-Controller)
- **Development Tools:** Git, GitHub, VS Code, Postman

## Key Features

### Customer-Facing Website
- Browse available travel packages and view trip details.
- Search, sort, and filter trips.
- Register and log in to a customer account.
- Book available travel packages.
- View and delete personal bookings.
- Prevent duplicate bookings for the same trip.

### Administration Dashboard
- Angular single-page application (SPA).
- Create, read, update, and delete travel packages.
- JWT-based authentication and protected routes.
- Search, sort, and filter trip listings.
- Pagination for easier navigation through travel packages.
- Star-based filtering for featured trips.

### Backend and Database
- RESTful API built using Express.js and Node.js.
- MongoDB database integration through Mongoose.
- Data models for trips, users, and bookings.
- Authentication and authorization using JWT.
- API endpoints for trip management, customer authentication, and bookings.

## Project Structure

The repository is organized into the following major directories:

- `app_admin/` – Angular administration dashboard
- `app_api/` – RESTful API routes, controllers, and MongoDB models
- `app_server/` – Express server-rendered pages, Handlebars views, and controllers
- `bin/` – Node.js server startup configuration
- `data/` – Project data files
- `public/` – Static assets, including CSS, JavaScript, and images
- `app.js` – Main Express application configuration

## Installation and Setup

### Prerequisites

Install Node.js, npm, MongoDB Community Server, and Git before running the application.

### 1. Clone the Repository

```bash
git clone https://github.com/drzy702/Travlr-FullStack.git
cd Travlr-FullStack
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure the Environment

Create a `.env` file in the project root and add a secure JWT signing secret:

```env
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

Keep the `.env` file out of version control.

### 4. Start MongoDB

Ensure that your local MongoDB service is running. By default, the application connects to a database named `travlr` on `127.0.0.1`.

### 5. Start the Express Server

From the project root, run:

```bash
npm start
```

Customer-facing application: http://localhost:3000

### 6. Start the Angular Admin Application

Open a second terminal:

```bash
cd app_admin
npm install
npm start
```

Angular application: http://localhost:4200

Both applications should run simultaneously, with MongoDB running in the background.

## API Overview

The backend exposes the following REST API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips` | Retrieve all trips |
| GET | `/api/trips/:tripCode` | Retrieve a specific trip |
| POST | `/api/trips` | Create a trip (authenticated) |
| PUT | `/api/trips/:tripCode` | Update a trip (authenticated) |
| DELETE | `/api/trips/:tripCode` | Delete a trip (authenticated) |
| POST | `/api/register` | Register an account |
| POST | `/api/login` | Authenticate a user |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings` | Retrieve personal bookings (authenticated) |
| DELETE | `/api/bookings/:bookingId` | Delete a booking (authenticated) |

## Development Highlights

This project demonstrates experience developing and extending a full-stack web application through several key enhancements:

**Authentication and Security**

Implemented JWT authentication, account registration, login functionality, and middleware for protecting application routes.

**Search and Data Management**

Enhanced travel package management with search, sorting, filtering, and pagination to improve navigation and usability.

**Customer Booking System**

Developed a booking system connecting the frontend, Express API, and MongoDB database. Added functionality to create bookings, manage personal reservations, and prevent duplicate bookings.

## Project Purpose

Travlr demonstrates practical experience with full-stack JavaScript development, RESTful API design, relational data modeling concepts implemented in a NoSQL database, authentication, and responsive web application development.

The project was completed as part of a Bachelor of Science in Computer Science program and further enhanced to demonstrate software engineering and full-stack development skills.
