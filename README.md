# Plant Analysis Service (uc2-device-composite_service)

## Project Overview

A comprehensive Node.js backend service for intelligent plant analysis combining multiple AI-driven plant health assessment capabilities. The system integrates plant identification, water stress detection, nutrient deficiency analysis, and disease recognition through external API services. Features include JWT-based authentication with OTP verification, subscription management via Razorpay, session-based usage tracking, and comprehensive data logging through Appwrite integration.

This enterprise-level service demonstrates microservice architecture integration, payment gateway implementation, and scalable plant analysis workflows for agricultural and gardening applications.

## Project Structure

```
Directory structure:
└── uc2-device-composite_service/
    ├── app.js
    ├── package.json
    ├── Analyse_Data/
    │   ├── Analyse_Data.js
    │   └── Analyse_Data_Function.js
    ├── Authentication/
    │   ├── Authentication_Middleware.js
    │   ├── Mail_Verification_OTP_Data.js
    │   └── Signup_Login.js
    ├── Authorization/
    │   ├── Authorization_MIddleware.js
    │   └── Session_Data.js
    ├── Database/
    │   ├── Appwrite_Database.js
    │   └── Mongo_Database.js
    ├── Logging/
    │   └── Logging_Function.js
    ├── Mailing/
    │   └── Node_Mailer_Function.js
    ├── Plant_Analyse/
    │   ├── Api_Calls_Function.js
    │   └── Plant_Analyse_APIs.js
    └── Razor_Pay/
        └── Payment_Check.js

```

## Technical Details

**Technology Stack:**
- **Backend**: Node.js, Express.js, Mongoose ODM
- **Database**: MongoDB (user data), Appwrite (image logging)
- **Authentication**: JWT tokens, bcrypt hashing, OTP via Nodemailer
- **Payment**: Razorpay integration for subscriptions
- **File Upload**: Multer middleware for image processing
- **External APIs**: Axios for plant analysis microservices

**Core Features:**
- Multi-endpoint plant analysis (identification, health, stress, nutrients)
- Session-based usage tracking with daily limits
- Tiered subscription model (normal/premium plans)
- 30-day rolling usage statistics with area utilization metrics
- Comprehensive image metadata logging via Appwrite
- Payment processing and plan upgrades through Razorpay

## Data Flow Model

![untitled_page-0001](https://github.com/user-attachments/assets/325d1906-c7f4-4aa4-b90b-1dd8cfaafd85)

## User Interface

![Generated Image September 03, 2025 - 5_21PM (1)](https://github.com/user-attachments/assets/bb97281e-0a0e-47cc-bb1f-ef8b08512713)

## How to Use and Play

### Installation
```bash
git clone https://github.com/organization/uc2-device-composite_service.git
cd uc2-device-composite_service
npm install
# Configure environment variables
# MongoDB URI, Appwrite credentials, Razorpay keys, Email SMTP
npm start
```
Access at `http://localhost:3000`

### Usage Flow
1. Register account with email verification via OTP
2. Login to receive JWT authentication token
3. Start analysis session and upload plant images
4. Choose analysis type (identification, health, combined)
5. View results with recommendations and usage statistics
6. Upgrade plan or purchase additional sessions as needed

### Controls & Features
- **Controls**: Image upload, analysis type selection, plan management, session tracking
- **Features**: Multi-API plant analysis, subscription management, usage analytics, payment integration, comprehensive logging
