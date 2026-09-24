# 🛒 Zoodle E-Commerce (Back-End)

A production-ready RESTful API built with **NestJS**, **TypeORM**, and **MySQL**. The system is designed using a clean, modular architecture, handling everything from secure authentication and complex catalog relations to a dynamic cart system and Stripe payment integration.

---

## 🌐 Live Frontend

Try Zoodle E-Commerce platform through the live frontend:
**Frontend:** **https://zoodle-eco.vercel.app**

### Supplier Test Account

Use the following account to explore and test the **Supplier functionality**:

- **Email:** `supplier_test@example.com`
- **Password:** `supplier_supplier`

---

## Database Diagram

Here are the blueprints showcasing how database entities are structurally related:

<p align="center">
  <img src="docs/images/DB-Diagram.png" alt="Database Diagram" width="90%" />
</p>

---

## 🚀 Core Features

- **Authentication & Authorization:** Complete local auth loop (Sign-Up, Sign-In, Password Reset via OTP) and Social Auth via Google OAuth2.0.
- **Role-Based Access Control (RBAC):** Hierarchical guard system restricting administrative capabilities exclusively to accounts with an `admin` role.
- **Multi-Level Product Catalog:** Granular classification tree structured through Categories, nested Sub-Categories, and Brands.
- **Dynamic Inventory System:** Full tracking of stock levels, sales counts (`sold`), colors, and product variants.
- **Dynamic Cart & Coupon Engine:** Dynamic item subtotal computations on user sessions with dynamic deduction mechanics upon applying live promotional codes.
- **Comprehensive Review Engine:** Verified customer interaction flow allowing automated rating configurations and structured text feedback per product.
- **Dual Checkout Channels:** Support for structured automated billing streams processing Cash on Delivery or Card Payments.
- **Full Supplier Lifecycle & B2B Procurement:** End-to-end supplier management flow. Users can apply for supplier status (`/api/v1/users/me`), which admins review and approve/reject with feedback. Approved suppliers gain access to dedicated vendor operations, company profiles, dynamic stock restocking requests (`Request-Products`), and B2B procurement ledgers.
- **Dynamic Pricing Configuration:** Upsertable administrative control metrics managing uniform tax values and dynamic flat-rate shipping prices at checkout.
- **Automated Cloud Storage File Uploading:** Multipart data stream parsing for asynchronous profile avatar binding and multi-image product gallery storage.

---

## 🛠️ Tech Stack & Architecture Highlights

### Framework & Language

- **NestJS (v11):** Node.js framework utilizing highly modular architecture layers.
- **TypeScript (v5.9):** Strict static typing configuration for structural compilation safety.

### Database & Storage

- **MySQL (v3.19 Driver):** Relational storage engine optimized using structural database indexing strategies.
- **TypeORM (v0.3.28):** Data Mapper ORM managing automated migration trees and dynamic relational mappings.
- **Cloudinary (v2.10.0):** Cloud-native media storage handling profile avatars and multi-image product galleries.

### Security & Guards

- **JWT (@nestjs/jwt):** Decoupled stateless authentication mechanisms processing Access and Refresh token lifecycles.
- **Passport.js:** Social identity abstraction handling Google OAuth20 verification strategies.
- **Bcrypt (v6.0.0):** Computational security processing cryptographic password salting and hashing.
- **Helmet (v8.2.0):** Automated HTTP request boundary header shielding.
- **NestJS Throttler (v6.5.0):** Strategic API rate limiting mechanics to mitigate brute-force vector threats.

### Communications & Billing

- **Stripe (v22.2.0):** Integrated commercial checkout gateway managing secure webhook payment transaction confirmations.
- **Nodemailer & NestJS Mailer:** Automated SMTP server connection maps processing immediate credential recovery verification tokens.

---

## 📂 Project Structure

```text
Zoodle E-Commerce (Back-End)
├── 📁 dist                   # Compiled production code
├── 📁 docs                   # Project blueprints, design assets & API testing documentation
│   ├── 📁 images             # Design assets for the README
│   └── 📁 postman            # Embedded API documentation environment sandbox
│       ├── 📄 collection.json    # JSON collections covering full module routes
│       └── 📄 environment.json # Active baseline target environment parameters
├── 📁 src                    # Main application source code
│   ├── 📁 auth               # Credentials authentication & OTP password reset
│   ├── 📁 oauth              # Google social authentication strategy
│   ├── 📁 user               # User profiles & Admin user management control
│   ├── 📁 category           # Level-0 product taxonomy
│   ├── 📁 sub-category       # Nested child categories mapped to parents
│   ├── 📁 brand              # Product brand/manufacturer metadata
│   ├── 📁 product            # Core catalog handling stocks, pricing, and variants
│   ├── 📁 review             # User ratings and product feedback
│   ├── 📁 cart               # Dynamic cart calculations, item modification & coupons
│   ├── 📁 order              # Checkout flows (Cash on Delivery & Card via Stripe)
│   ├── 📁 coupon             # Dynamic promotional code management
│   ├── 📁 supplier           # Supplier tracking operations
│   ├── 📁 request-product    # Staff procurement & restocking requests
│   ├── 📁 tax                # Global configurations for dynamic tax & shipping prices
│   ├── 📁 upload-files       # Interceptors route mapping to Cloudinary storage
│   ├── 📁 utils              # Shareable global helper methods
│   ├── 📄 app.module.ts      # Application root module matching dependency trees
│   └── 📄 main.ts            # Application bootstrap entrypoint
└── 📁 test                   # E2E integration test suites
```

---

## ⚙️ Core System Workflows

### 1. Advanced Auth & Token Management

- Uses a **Dual-Token System**: Short-lived Access Tokens for authenticated routes and long-lived Refresh Tokens to dynamically maintain user sessions.
- Includes a full **Password Reset Cycle** utilizing secure email delivery for time-sensitive, numeric verification codes.

### 2. Multi-Level E-Commerce Hierarchy

- Maintains strict relational consistency across `Categories` ➡️ `Sub-Categories` ➡️ `Brands` ➡️ `Products`.
- Includes database-level index optimizations and strict relational integrity policies to secure massive catalog listings.

### 3. Live Cart Calculations & Coupon Engine

- The cart logic runs natively on database sessions, dynamically computing prices, quantity checks, and current inventory availability on every update.
- Coupons are parsed through validation checks (`expireDate` and status updates) before mutating subtotal configurations.

### 4. Checkout Operations (Stripe Integration)

- **Cash on Delivery:** Direct processing workflow that updates stock inventories and terminates the active cart session safely.
- **Card Payment:** Communicates with Stripe API to serve secure tokens. The system utilizes structured Webhook endpoints listening for `payment_intent.succeeded` events to switch order states automatically.

### 5. Standardized DTO Validation & Guards

- All inbound payloads are strict-mapped using `class-validator` and stripped of un-whitelisted properties via a global `ValidationPipe`.
- Role management explicitly locks administrative endpoints (`/api/v1/users`, `/api/v1/categories` mutations, etc.) to accounts mapped out with an `admin` role.

### 6. End-to-End Supplier Request & Onboarding Workflow

- **Application & Validation:** Users apply to become suppliers via profile endpoints by submitting company metrics (`companyName`, `website`). The system validates against duplicate company profiles and existing pending requests.
- **Admin Verification Loop:** Requests are queued for administrative review. Admins can approve requests (which elevates the user's role to `SUPPLIER`) or reject them with a structured reason (`rejectionReason`).
- **Procurement & Restocking:** Once approved, suppliers interact with product procurement channels to submit and manage stock replenishment requests (`/api/v1/request-products`).

---

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 / v20 or higher)
- MySQL active server instance

### Setup & Run

1. **Clone the project:**

```bash
git clone <your-repo-url>
cd back-end-e-commerce

```

2. **Install dependencies:**

```bash
npm install

```

3. **Setup environment variables:**
   Create a `.env` file inside the root directory of the application and map the active credentials exactly as structured below:

```env
# NODE_ENV
NODE_ENV=development

# DB
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=
DATABASE_USERNAME=root
DATABASE_NAME=
DATABASE_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_TOKEN_SECRET=
JWT_REFRESH_TOKEN_EXPIRES_IN=

# Hash
SALT=

# Mailer SMTP
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Stripe
STRIPE_SECRET_KEY=
ENDPOINT_SECRET=

# Cloudinary
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

```

4. **Launch the application:**

```bash
# Development hot-reload mode
npm run start:dev

# Production mode execution
npm run start:prod

```

---

## 📬 API Documentation & Postman Setup

> 💡 **Notice:** All endpoint routes and full API documentation are located inside the **`docs/postman`** directory. This includes complete, pre-configured testing collections and environment variables for direct execution in Postman.

### Modular Collection Structure

The Postman sandbox is split into dedicated collection entities mirroring the core module controllers:

- **Auth Module:** Manages credentials parsing (`/api/v1/auth`), validation rules for Sign-up/Sign-in actions, and the secure verification logic powering the OTP recovery cycle.
- **OAuth Module:** Simulates external callbacks (`/api/v1/auth/google`) confirming federated OAuth identity parameters.
- **User Module:** Houses protected administrative endpoints handling global profile mutations, retrieval listings, and administrative user controls (`/api/v1/users`).
- **Category & Sub-Category Modules:** Structures hierarchical endpoints executing level-0 catalog generation and child sub-category nested trees.
- **Brand & Product Modules:** Oversees inventory entity storage matrices, monitoring prices, stock limits, variant colors, and product sales fields.
- **Review Module:** Maps public reading routes and restricted customer endpoints processing verified text feedback and numerical rating evaluations.
- **Cart & Coupon Modules:** Manages dynamic database-backed session structures computing shopping basket adjustments, inventory availability verification, and coupon value calculations.
- **Order Module:** Directs checkout actions routing cash transactions or card parameters via Stripe SDK, processing events via dedicated webhook pathways.
- **Supplier & Request-Product Modules:** Internal system pathways allowing administrative tracking of third-party wholesale supplier accounts and backend supply procurement logs.
- **Tax Module:** Restricted backend configuration settings adjusting standard tax parameters and dynamic shipping price constants globally.
- **User & Supplier Application Modules:** Handles user profiles, role switches, and the full supplier onboarding request flow (`/api/v1/users/me` -> application submission, status updates, and admin approval checks).
- **Supplier & Request-Product Modules:** Internal and vendor pathways for managing registered supplier profiles, updating company details, and processing product restocking requests.

### Importing Environment Sandbox

1. Locate the files within `docs/postman/collections/` and the environment mapping at `docs/postman/environment.json`.
2. Import the chosen collections along with the JSON environment descriptor directly into your Postman Workspace.
3. Select the imported environment target to automatically authorize variables (`{{base_url}}`, active token overrides) across every automated testing endpoint layout.
