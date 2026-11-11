# Splitwise-Inspired Expense Sharing Application

A full-stack expense-sharing application that simplifies the process of managing shared expenses, tracking group balances, and settling debts between individuals.

Built as an independent software development project, this application explores the core concepts of collaborative expense management, real-time communication, and financial transaction tracking.

## Overview

Managing shared expenses among friends, roommates, and groups can become complicated when multiple people contribute different amounts and expenses need to be divided fairly.

This application provides a centralized platform where users can record expenses, distribute costs among participants, track outstanding balances, and manage settlements.

The project is inspired by the expense-sharing concept popularized by [Splitwise](https://www.splitwise.com/), with an independently implemented codebase and technical architecture.

## Features

- **Expense Management:** Create, record, and manage shared expenses.
- **Group Expense Tracking:** Organize expenses among multiple participants.
- **Equal Expense Splitting:** Distribute expenses equally while handling rounding at the smallest currency unit (paise).
- **Percentage-Based Splitting:** Allocate expenses using custom percentage contributions with validation.
- **Balance Tracking:** Keep track of amounts owed and amounts receivable between participants.
- **Settlement Management:** Record settlements and update outstanding balances.
- **Real-Time Communication:** Socket.IO integration for real-time application updates.
- **Authentication:** Secure user authentication using JWT.
- **Password Security:** Password hashing using bcrypt.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Real-Time Communication | Socket.IO |
| Containerization | Docker |

## Architecture

The application follows a client-server architecture.

- **Frontend:** Provides the user interface for managing expenses, groups, balances, and settlements.
- **Backend:** Handles business logic, authentication, expense calculations, and application APIs.
- **Database:** PostgreSQL stores application data, with Prisma managing database interactions.
- **Real-Time Layer:** Socket.IO enables real-time communication between connected clients.
- **Containerization:** Docker is used to support the development environment.

## Key Technical Implementations

### 1. Expense Distribution

Supports multiple expense distribution approaches, including equal splitting and percentage-based allocation.

### 2. Currency Precision

Financial calculations account for currency precision by performing monetary calculations in integer paise rather than relying directly on floating-point arithmetic.

### 3. Percentage Validation

Validates percentage-based expense allocations to ensure that participant contributions add up to 100%.

### 4. Authentication and Security

Implements JWT-based authentication and bcrypt password hashing to protect user credentials and authenticated application routes.

### 5. Settlement Workflow

Implements a settlement workflow to record payments between participants and update their outstanding balances.

### 6. Real-Time Functionality

Uses Socket.IO to facilitate real-time communication between the frontend and backend.

## Getting Started

### Prerequisites

- Node.js
- npm
- Docker and Docker Compose
- PostgreSQL (if running the database separately)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dayalshreyansh/Split_wise-clone.git
   cd Split_wise-clone
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the environment variables required by the backend and database.

4. Start the required infrastructure using the project's Docker configuration.

5. Run the database migrations using Prisma:

   ```bash
   npx prisma migrate dev
   ```

6. Start the application using the appropriate development scripts defined in the project.

*Note: Adapt the installation commands to the actual frontend/backend directory structure and scripts in the repository.*

## Project Objectives

- Understand and implement full-stack application architecture.
- Develop reliable financial calculation and expense-distribution logic.
- Work with relational databases and ORM-based data management.
- Implement authentication and secure password handling.
- Explore real-time communication using WebSockets.
- Build practical solutions to everyday collaborative financial problems.

## Acknowledgements and Intellectual Property

This project is an independently developed educational implementation inspired by the expense-sharing functionality of **[Splitwise](https://www.splitwise.com/)**.

Splitwise is a product and registered trademark of its respective owner. All rights, trademarks, branding, and proprietary assets associated with Splitwise remain the property of their respective owners.

This project is not affiliated with, endorsed by, sponsored by, or officially associated with Splitwise, Inc.

The project does not claim ownership of the original Splitwise product, its branding, proprietary source code, or copyrighted visual assets. The implementation and source code in this repository are independently developed.

The name Splitwise is used solely to identify the product that inspired the application's general functionality.

## Disclaimer

This project is intended for educational and demonstration purposes. It is not an official Splitwise application and should not be used to represent itself as such.

---

**Developed as an independent full-stack software engineering project.**
