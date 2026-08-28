Smart Women Chama Web App

Overview

Smart Women Chama Web App is a modern web‑based financial management platform designed for women‑led Chamas, savings groups, investment groups, and community‑based financial organizations.

It is built as a customizable Web‑UI layer inspired by the Mifos X Web App architecture and uses Apache Fineract® as the financial services backend. The application leverages the Angular framework to provide a responsive, modular, and enterprise‑ready user interface for managing members, contributions, savings, loans, investments, meetings, group activities, and financial reporting.

---

Core Capabilities

· ✅ Chama and group management
· ✅ Member registration and profiles
· ✅ Contributions and savings management
· ✅ Loan application, approval, disbursement, and repayment
· ✅ Investment and portfolio tracking
· ✅ Group meetings and attendance
· ✅ Financial transactions and accounting
· ✅ Member statements and transaction history
· ✅ Financial reports and dashboards
· ✅ User roles and permissions
· ✅ Multi‑branch/group administration
· ✅ Notifications and workflow management
· ✅ Integration with payment services
· ✅ API‑driven architecture through Apache Fineract

---

Technology Stack

Layer Technology
Frontend Angular (TypeScript)
UI Angular Material / SCSS
Backend Apache Fineract (REST API)
Database Fineract‑supported (MariaDB/PostgreSQL)
Auth Role‑based authentication & authorization
Testing Angular testing + E2E
Deployment Docker / containerized environments

---

Branch Strategy

The repository follows a two‑branch development model:

```
dev
 ├── Feature development
 ├── Bug fixes
 ├── UI/UX improvements
 ├── API integrations
 └── Testing
      │
      ▼
main
 └── Stable production release
```

· main – Latest stable release. This branch should contain production‑ready code only.
· dev – Active development branch. All new features, improvements, bug fixes, and integrations should be developed and tested here before being promoted to main.

---

Project Objective

The objective of Smart Women Chama Web App is to provide a scalable digital platform that transforms traditional Chama operations into a structured, transparent, and accessible financial management system while retaining the flexibility and financial capabilities of the Fineract ecosystem.

The application can be extended with mobile applications, payment integrations such as M‑Pesa, automated notifications, investment management, analytics, AI‑assisted financial insights, and additional Chama‑specific workflows.

---

📋 Table of Contents

· Overview
· Core Capabilities
· Technology Stack
· Branch Strategy
· Project Objective
· Installation Guide
  · Prerequisites
  · Backend Setup
  · Frontend Setup
· Default Login Credentials
· Development Commands
· Proxy Configuration
· Configuration Options
· Business Logic: Chama Financial System Example
  · Monthly Statement Logic
  · Member Payout Logic
  · Contribution and Savings Structure
  · Transaction Charge Logic
  · Interest and WHT Logic
  · Funds Flow Logic
  · Special Scenarios
  · Reconciliation and Reporting
· Releases
· Contributing
· Related Projects

---

Installation Guide

Prerequisites for All Methods

· Git – Download here
· Apache Fineract® Backend – Required before running the web app.

Backend Setup (REQUIRED FIRST)

Choose one of these backend options:

· Option A: Use an existing remote Fineract server (e.g., the Mifos demo – sandbox data is reset every 6 hours).
· Option B: Install a local Fineract server – see the Installation Guide.
· Option C: Docker Compose for full stack – see the Docker Compose section.

After backend setup, configure the environment files to point to your backend:

· Update environments/environment.ts (development)
· Update environments/environment.prod.ts (production)
· Change OAuth2 settings if needed (disabled by default).

---

Frontend Setup (Web App)

Choose one of the following methods:

Method 1: Manual Installation

1. Install Node.js – Download here.
2. Install Angular CLI globally:
   ```bash
   npm install -g @angular/cli@20.3.27
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/your-org/smart-women-chama-web-app.git
   cd smart-women-chama-web-app
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   ng serve
   ```
6. Access the application at http://localhost:4200/.

Method 2: Docker Container Only

Pull the Docker image:

```bash
docker pull your-org/smart-women-chama:latest
```

Run the container:

```bash
docker run -d -p 4200:80 --env-file .env your-org/smart-women-chama:latest
```

Access the application at http://localhost:4200/.

Method 3: Docker Compose (Frontend + Backend)

Clone the repository and start both services:

```bash
git clone https://github.com/your-org/smart-women-chama-web-app.git
cd smart-women-chama-web-app
docker compose up -d
```

Access the application at http://localhost:4200/.

---

Default Login Credentials

When using the development server with basic authentication:

· Username: mifos
· Password: password

Important: Do not alter these credentials unless you reconfigure the backend.

---

Development Commands

Command Description
ng serve Serve the application locally
ng generate component component-name Generate a new component
ng build --configuration production or npm run build:prod Build for production
ng help Get Angular CLI help

---

Proxy Configuration

The app includes a proxy configuration (proxy.conf.js) that forwards API requests to a remote Fineract backend during local development, avoiding CORS issues.

Using the Sandbox Proxy (Default)

· Target: https://demo.mifos.community
· API Endpoint: https://apis.mifos.community
· System Reset: Demo test data and transient state are reset every 6 hours.

Sandbox Environment Variables:

```bash
FINERACT_API_URLS=https://apis.mifos.community
FINERACT_API_URL=https://apis.mifos.community
FINERACT_API_PROVIDER=/fineract-provider/api
FINERACT_API_ACTUATOR=/fineract-provider
FINERACT_API_VERSION=/v1
FINERACT_PLATFORM_TENANT_IDENTIFIER=default
MIFOS_DEFAULT_LANGUAGE=en-US
MIFOS_SUPPORTED_LANGUAGES=cs-CS,de-DE,en-US,es-MX,fr-FR,it-IT,ko-KO,lt-LT,lv-LV,ne-NE,pt-PT,sw-SW
MIFOS_PRELOAD_CLIENTS=true
MIFOS_DEFAULT_CHAR_DELIMITER=,
```

Using a Local Fineract Instance

To proxy to a local Fineract server, use the provided proxy.localhost.conf.js:

```bash
ng serve --proxy-config proxy.localhost.conf.js
```

Ensure your local Fineract instance is running on http://localhost:8443.

Proxy Features

· CORS Avoidance: Eliminates cross‑origin issues during development.
· Error Handling: Gracefully handles proxy failures with detailed logging.
· Corporate Proxy Support: Supports corporate proxy agents via HTTP_PROXY environment variable.
· Debug Logging: All proxy requests are logged for troubleshooting.

---

Configuration Options

The application supports a wide range of environment variables (same as the Mifos X Web App). Key variables are listed below:

Category Variable Description Default
Fineract Backend FINERACT_API_URLS Fineract server list https://demo.mifos.community,https://localhost:8443
 FINERACT_API_URL Default Fineract server https://localhost:8443
 FINERACT_PLATFORM_TENANT_IDENTIFIER Default tenant identifier default
Language MIFOS_DEFAULT_LANGUAGE Default language en-US
Date & Datetime MIFOS_DEFAULT_FORMAT_DATE Default date format dd MMMM yyyy
 MIFOS_DEFAULT_FORMAT_DATETIME Default datetime format dd MMMM yyyy HH:mm:ss
Session MIFOS_SESSION_IDLE_TIMEOUT Session timeout (ms) 300000
UI MIFOS_PRODUCTION_MODE Enable production UI mode false
 MIFOS_COMPLIANCE_HIDE_CLIENT_DATA Mask client names false
OAuth/OIDC MIFOS_OAUTH_SERVER_ENABLED Enable OAuth2 server false
Interbank MIFOS_INTERBANK_TRANSFERS_ENABLED Enable Interbank feature true
Remittance MIFOS_REMITTANCE_ENABLED Enable Remittance feature false
Copilot MIFOS_ENABLE_COPILOT Enable AI Copilot panel false

For a complete list, see the Mifos X Web App documentation.

---

Business Logic: Chama Financial System Example

The Smart Women Chama Web App can be configured to support a wide variety of financial use cases. The following business logic is based on a real‑world Smartmoney Women Chama (rotating savings group) implementation. It demonstrates how the platform can handle:

· Monthly member contributions
· Scheduled payouts
· Transaction charges (Mpesa, bank fees)
· Interest and withholding tax (WHT)
· Fund reconciliation across multiple accounts

This example is structured as a set of Excel sheets that work together, reflecting the underlying accounting rules that can be mapped to Fineract entities (clients, savings accounts, loan accounts, etc.).

---

1. Monthly Statement Logic

Account Structure

The system maintains two parallel accounts:

· Primary Operating Account – day‑to‑day transactions
· CIC (Investment) Account – long‑term savings

Balance Calculation

```
Balance c/f = Opening Balance
              + Total Funds Received
              – Expenditure
              – Transfer Charges
              – CIC Charges
              + Interest Earned
              – WHT
```

Transaction Charge Calculation

The system automatically calculates charges based on group size:

Charge Type Small Group (≤9 members) Large Group (12 members)
Contribution Amount 9,000 Ksh 24,000 Ksh
Mpesa transfer charges (to receiving member) 87 108
Mpesa transfer charges (to CIC) 112 205
Recipient withdrawal charges 112 197
Transfer charges to top‑up per member (Total / 9) (Total / 12)

---

2. Member Payout Logic

· Members are assigned a rotating payout order (No. 1–12).
· Each month, one member receives a payout on a specific date.
· The Total Receipt = Chama Contribution + Withdrawal Amount.
· Transfer charges are deducted from the amount received.

Column Description
Savings Member’s total accumulated savings
Deductions Any outstanding amounts owed
NET Payable Savings – Deductions – Withdrawal Charge
Topup Additional amount from interest earned
Total Request NET Payable + Topup
Withdrawal Charge Bank transfer fee
Final Payout Total Request – Withdrawal Charge

---

3. Contribution and Savings Structure

Each member’s contribution sheet tracks the following:

Field Description
Date of Payment Transaction date (must be on or before contribution month)
Month of Contribution The period to which the contribution applies
Amount Received Total cash received from member
Chama Contribution Base monthly contribution (typically 1,000–2,000 Ksh)
December Contribution Special annual savings added in December
Additional Savings Optional extra voluntary contributions
Total Contribution Sum of all contribution columns
Transfer Charges Fees deducted from the amount received
Payout Cumulative amount paid out to the member

---

4. Transaction Charge Logic

· Mpesa Transfer Charges: 87 Ksh per member (small group) / 108 Ksh (large group)
· CIC Transfer Charges: 112 Ksh (small) / 205 Ksh (large)
· Recipient Withdrawal Charges: Deducted from the recipient’s account
· NCBA Bank Charges: 66–77 Ksh depending on group size

All charges are automatically computed based on the group size and the transfer type.

---

5. Interest and WHT Logic

· Interest is accrued monthly on the account balance.
· Interest rates vary by bank and account type.
· Withholding Tax (WHT) is calculated as:
  ```
  WHT = Interest Earned × Tax Rate (typically 15%)
  ```
· WHT is deducted from the interest before it becomes available for withdrawal.

---

6. Funds Flow Logic

Incoming Funds

```
Total Funds Received = Chama Amount + Additional Savings + Transfer Charges
```

Outgoing Funds

```
Expenditure = Chama Funds Transferred
              + Withdrawal Amount
              + Mpesa Transfer Charges
              + Funds Deposited to Account
              + CIC Transfer Charges
```

Net Position

```
Balance = Opening Balance
          + Total Received
          – Total Expenditure
          + Interest Earned
          – WHT
```

---

7. Special Scenarios

Member Scenario Handling
Lyzz Significant refund (36,060 Ksh) and extra deduction (10,570 Ksh) Adjusted in cumulative savings calculation
Cony Received advance of 12,608 Ksh in November 2024 Offset from Kian’s account; net payable = savings – advance
Kian Advanced money to Cony Amount deducted from Kian’s savings; offset tracked in notes

---

8. Reconciliation and Reporting

Monthly Reconciliation

1. Verify total funds received match member contributions.
2. Confirm all transfer charges are accounted for.
3. Validate the balance carried forward.
4. Cross‑check interest and WHT calculations.

Annual Reconciliation

1. Aggregate December savings for all members.
2. Calculate total funds available for payout.
3. Allocate payouts based on individual savings.
4. Account for all deductions and adjustments.
5. Verify final balance matches bank statement.

Key Reports

· Monthly Statement – Full financial position
· Order of Members – Payout schedule and amounts
· Account Deposits – Bank account activity
· Cumulative Savings – Lifetime savings per member
· Annual Payment Summaries – Year‑end reconciliations

---

Releases

This project follows Semantic Versioning. All formal releases, changelogs, and their supported Apache Fineract® versions are available on the GitHub Releases page.

---

Contributing

We welcome contributions! Please read our contribution guidelines before submitting pull requests.

---

Related Projects

· Apache Fineract® – The core banking platform that powers the backend.
· Mifos X Web App – The original web application that inspired this project.

---

This README serves both as a technical guide for the Smart Women Chama Web App and as a reference for implementing a Chama‑style financial system using the platform.Smart Women Chama Web App

Overview

Smart Women Chama Web App is a modern web‑based financial management platform designed for women‑led Chamas, savings groups, investment groups, and community‑based financial organizations.

It is built as a customizable Web‑UI layer inspired by the Mifos X Web App architecture and uses Apache Fineract® as the financial services backend. The application leverages the Angular framework to provide a responsive, modular, and enterprise‑ready user interface for managing members, contributions, savings, loans, investments, meetings, group activities, and financial reporting.

---

Core Capabilities

· ✅ Chama and group management
· ✅ Member registration and profiles
· ✅ Contributions and savings management
· ✅ Loan application, approval, disbursement, and repayment
· ✅ Investment and portfolio tracking
· ✅ Group meetings and attendance
· ✅ Financial transactions and accounting
· ✅ Member statements and transaction history
· ✅ Financial reports and dashboards
· ✅ User roles and permissions
· ✅ Multi‑branch/group administration
· ✅ Notifications and workflow management
· ✅ Integration with payment services
· ✅ API‑driven architecture through Apache Fineract

---

Technology Stack

Layer Technology
Frontend Angular (TypeScript)
UI Angular Material / SCSS
Backend Apache Fineract (REST API)
Database Fineract‑supported (MariaDB/PostgreSQL)
Auth Role‑based authentication & authorization
Testing Angular testing + E2E
Deployment Docker / containerized environments

---

Branch Strategy

The repository follows a two‑branch development model:

```
dev
 ├── Feature development
 ├── Bug fixes
 ├── UI/UX improvements
 ├── API integrations
 └── Testing
      │
      ▼
main
 └── Stable production release
```

· main – Latest stable release. This branch should contain production‑ready code only.
· dev – Active development branch. All new features, improvements, bug fixes, and integrations should be developed and tested here before being promoted to main.

---

Project Objective

The objective of Smart Women Chama Web App is to provide a scalable digital platform that transforms traditional Chama operations into a structured, transparent, and accessible financial management system while retaining the flexibility and financial capabilities of the Fineract ecosystem.

The application can be extended with mobile applications, payment integrations such as M‑Pesa, automated notifications, investment management, analytics, AI‑assisted financial insights, and additional Chama‑specific workflows.

---

📋 Table of Contents

· Overview
· Core Capabilities
· Technology Stack
· Branch Strategy
· Project Objective
· Installation Guide
  · Prerequisites
  · Backend Setup
  · Frontend Setup
· Default Login Credentials
· Development Commands
· Proxy Configuration
· Configuration Options
· Business Logic: Chama Financial System Example
  · Monthly Statement Logic
  · Member Payout Logic
  · Contribution and Savings Structure
  · Transaction Charge Logic
  · Interest and WHT Logic
  · Funds Flow Logic
  · Special Scenarios
  · Reconciliation and Reporting
· Releases
· Contributing
· Related Projects

---

Installation Guide

Prerequisites for All Methods

· Git – Download here
· Apache Fineract® Backend – Required before running the web app.

Backend Setup (REQUIRED FIRST)

Choose one of these backend options:

· Option A: Use an existing remote Fineract server (e.g., the Mifos demo – sandbox data is reset every 6 hours).
· Option B: Install a local Fineract server – see the Installation Guide.
· Option C: Docker Compose for full stack – see the Docker Compose section.

After backend setup, configure the environment files to point to your backend:

· Update environments/environment.ts (development)
· Update environments/environment.prod.ts (production)
· Change OAuth2 settings if needed (disabled by default).

---

Frontend Setup (Web App)

Choose one of the following methods:

Method 1: Manual Installation

1. Install Node.js – Download here.
2. Install Angular CLI globally:
   ```bash
   npm install -g @angular/cli@20.3.27
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/your-org/smart-women-chama-web-app.git
   cd smart-women-chama-web-app
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   ng serve
   ```
6. Access the application at http://localhost:4200/.

Method 2: Docker Container Only

Pull the Docker image:

```bash
docker pull your-org/smart-women-chama:latest
```

Run the container:

```bash
docker run -d -p 4200:80 --env-file .env your-org/smart-women-chama:latest
```

Access the application at http://localhost:4200/.

Method 3: Docker Compose (Frontend + Backend)

Clone the repository and start both services:

```bash
git clone https://github.com/your-org/smart-women-chama-web-app.git
cd smart-women-chama-web-app
docker compose up -d
```

Access the application at http://localhost:4200/.

---

Default Login Credentials

When using the development server with basic authentication:

· Username: mifos
· Password: password

Important: Do not alter these credentials unless you reconfigure the backend.

---

Development Commands

Command Description
ng serve Serve the application locally
ng generate component component-name Generate a new component
ng build --configuration production or npm run build:prod Build for production
ng help Get Angular CLI help

---

Proxy Configuration

The app includes a proxy configuration (proxy.conf.js) that forwards API requests to a remote Fineract backend during local development, avoiding CORS issues.

Using the Sandbox Proxy (Default)

· Target: https://demo.mifos.community
· API Endpoint: https://apis.mifos.community
· System Reset: Demo test data and transient state are reset every 6 hours.

Sandbox Environment Variables:

```bash
FINERACT_API_URLS=https://apis.mifos.community
FINERACT_API_URL=https://apis.mifos.community
FINERACT_API_PROVIDER=/fineract-provider/api
FINERACT_API_ACTUATOR=/fineract-provider
FINERACT_API_VERSION=/v1
FINERACT_PLATFORM_TENANT_IDENTIFIER=default
MIFOS_DEFAULT_LANGUAGE=en-US
MIFOS_SUPPORTED_LANGUAGES=cs-CS,de-DE,en-US,es-MX,fr-FR,it-IT,ko-KO,lt-LT,lv-LV,ne-NE,pt-PT,sw-SW
MIFOS_PRELOAD_CLIENTS=true
MIFOS_DEFAULT_CHAR_DELIMITER=,
```

Using a Local Fineract Instance

To proxy to a local Fineract server, use the provided proxy.localhost.conf.js:

```bash
ng serve --proxy-config proxy.localhost.conf.js
```

Ensure your local Fineract instance is running on http://localhost:8443.

Proxy Features

· CORS Avoidance: Eliminates cross‑origin issues during development.
· Error Handling: Gracefully handles proxy failures with detailed logging.
· Corporate Proxy Support: Supports corporate proxy agents via HTTP_PROXY environment variable.
· Debug Logging: All proxy requests are logged for troubleshooting.

---

Configuration Options

The application supports a wide range of environment variables (same as the Mifos X Web App). Key variables are listed below:

Category Variable Description Default
Fineract Backend FINERACT_API_URLS Fineract server list https://demo.mifos.community,https://localhost:8443
 FINERACT_API_URL Default Fineract server https://localhost:8443
 FINERACT_PLATFORM_TENANT_IDENTIFIER Default tenant identifier default
Language MIFOS_DEFAULT_LANGUAGE Default language en-US
Date & Datetime MIFOS_DEFAULT_FORMAT_DATE Default date format dd MMMM yyyy
 MIFOS_DEFAULT_FORMAT_DATETIME Default datetime format dd MMMM yyyy HH:mm:ss
Session MIFOS_SESSION_IDLE_TIMEOUT Session timeout (ms) 300000
UI MIFOS_PRODUCTION_MODE Enable production UI mode false
 MIFOS_COMPLIANCE_HIDE_CLIENT_DATA Mask client names false
OAuth/OIDC MIFOS_OAUTH_SERVER_ENABLED Enable OAuth2 server false
Interbank MIFOS_INTERBANK_TRANSFERS_ENABLED Enable Interbank feature true
Remittance MIFOS_REMITTANCE_ENABLED Enable Remittance feature false
Copilot MIFOS_ENABLE_COPILOT Enable AI Copilot panel false

For a complete list, see the Mifos X Web App documentation.

---

Business Logic: Chama Financial System Example

The Smart Women Chama Web App can be configured to support a wide variety of financial use cases. The following business logic is based on a real‑world Smartmoney Women Chama (rotating savings group) implementation. It demonstrates how the platform can handle:

· Monthly member contributions
· Scheduled payouts
· Transaction charges (Mpesa, bank fees)
· Interest and withholding tax (WHT)
· Fund reconciliation across multiple accounts

This example is structured as a set of Excel sheets that work together, reflecting the underlying accounting rules that can be mapped to Fineract entities (clients, savings accounts, loan accounts, etc.).

---

1. Monthly Statement Logic

Account Structure

The system maintains two parallel accounts:

· Primary Operating Account – day‑to‑day transactions
· CIC (Investment) Account – long‑term savings

Balance Calculation

```
Balance c/f = Opening Balance
              + Total Funds Received
              – Expenditure
              – Transfer Charges
              – CIC Charges
              + Interest Earned
              – WHT
```

Transaction Charge Calculation

The system automatically calculates charges based on group size:

Charge Type Small Group (≤9 members) Large Group (12 members)
Contribution Amount 9,000 Ksh 24,000 Ksh
Mpesa transfer charges (to receiving member) 87 108
Mpesa transfer charges (to CIC) 112 205
Recipient withdrawal charges 112 197
Transfer charges to top‑up per member (Total / 9) (Total / 12)

---

2. Member Payout Logic

· Members are assigned a rotating payout order (No. 1–12).
· Each month, one member receives a payout on a specific date.
· The Total Receipt = Chama Contribution + Withdrawal Amount.
· Transfer charges are deducted from the amount received.

Column Description
Savings Member’s total accumulated savings
Deductions Any outstanding amounts owed
NET Payable Savings – Deductions – Withdrawal Charge
Topup Additional amount from interest earned
Total Request NET Payable + Topup
Withdrawal Charge Bank transfer fee
Final Payout Total Request – Withdrawal Charge

---

3. Contribution and Savings Structure

Each member’s contribution sheet tracks the following:

Field Description
Date of Payment Transaction date (must be on or before contribution month)
Month of Contribution The period to which the contribution applies
Amount Received Total cash received from member
Chama Contribution Base monthly contribution (typically 1,000–2,000 Ksh)
December Contribution Special annual savings added in December
Additional Savings Optional extra voluntary contributions
Total Contribution Sum of all contribution columns
Transfer Charges Fees deducted from the amount received
Payout Cumulative amount paid out to the member

---

4. Transaction Charge Logic

· Mpesa Transfer Charges: 87 Ksh per member (small group) / 108 Ksh (large group)
· CIC Transfer Charges: 112 Ksh (small) / 205 Ksh (large)
· Recipient Withdrawal Charges: Deducted from the recipient’s account
· NCBA Bank Charges: 66–77 Ksh depending on group size

All charges are automatically computed based on the group size and the transfer type.

---

5. Interest and WHT Logic

· Interest is accrued monthly on the account balance.
· Interest rates vary by bank and account type.
· Withholding Tax (WHT) is calculated as:
  ```
  WHT = Interest Earned × Tax Rate (typically 15%)
  ```
· WHT is deducted from the interest before it becomes available for withdrawal.

---

6. Funds Flow Logic

Incoming Funds

```
Total Funds Received = Chama Amount + Additional Savings + Transfer Charges
```

Outgoing Funds

```
Expenditure = Chama Funds Transferred
              + Withdrawal Amount
              + Mpesa Transfer Charges
              + Funds Deposited to Account
              + CIC Transfer Charges
```

Net Position

```
Balance = Opening Balance
          + Total Received
          – Total Expenditure
          + Interest Earned
          – WHT
```

---

7. Special Scenarios

Member Scenario Handling
Lyzz Significant refund (36,060 Ksh) and extra deduction (10,570 Ksh) Adjusted in cumulative savings calculation
Cony Received advance of 12,608 Ksh in November 2024 Offset from Kian’s account; net payable = savings – advance
Kian Advanced money to Cony Amount deducted from Kian’s savings; offset tracked in notes

---

8. Reconciliation and Reporting

Monthly Reconciliation

1. Verify total funds received match member contributions.
2. Confirm all transfer charges are accounted for.
3. Validate the balance carried forward.
4. Cross‑check interest and WHT calculations.

Annual Reconciliation

1. Aggregate December savings for all members.
2. Calculate total funds available for payout.
3. Allocate payouts based on individual savings.
4. Account for all deductions and adjustments.
5. Verify final balance matches bank statement.

Key Reports

· Monthly Statement – Full financial position
· Order of Members – Payout schedule and amounts
· Account Deposits – Bank account activity
· Cumulative Savings – Lifetime savings per member
· Annual Payment Summaries – Year‑end reconciliations

---

Releases

This project follows Semantic Versioning. All formal releases, changelogs, and their supported Apache Fineract® versions are available on the GitHub Releases page.

---

Contributing

We welcome contributions! Please read our contribution guidelines before submitting pull requests.

---

Related Projects

· Apache Fineract® – The core banking platform that powers the backend.
· Mifos X Web App – The original web application that inspired this project.

---

This README serves both as a technical guide for the Smart Women Chama Web App and as a reference for implementing a Chama‑style financial system using the platform.# Mifos® X Web App

## Overview

Mifos® X Web App is a modern single-page application (SPA) built on top of the Mifos® X platform for financial inclusion. It serves as the default web interface for the Mifos® user community.

This repository includes a complete **Business Logic Example** that demonstrates how the platform can be configured to manage a **Chama (rotating savings group)** financial system, based on a real‑world implementation for Smartmoney Women.

---

## Technologies Used

- HTML5, SCSS, and TypeScript  
- Angular 20 framework  
- Angular Material components

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Links](#quick-links)
- [Installation Guide](#installation-guide)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup-required-first)
  - [Frontend Setup](#frontend-setup-web-app)
    - [Method 1: Manual Installation](#method-1-manual-installation)
    - [Method 2: Docker Container Only](#method-2-docker-container-only)
    - [Method 3: Docker Compose](#method-3-docker-compose-frontend--backend)
- [Default Login Credentials](#default-login-credentials)
- [Development Commands](#development-commands)
- [Proxy Configuration](#proxy-configuration)
- [Configuration Options](#configuration-options)
  - [Environment Variables for Docker](#environment-variables-for-docker)
- [Business Logic: Chama Financial System Example](#business-logic-chama-financial-system-example)
  - [Monthly Statement Logic](#1-monthly-statement-logic)
  - [Member Payout Logic](#2-member-payout-logic)
  - [Contribution and Savings Structure](#3-contribution-and-savings-structure)
  - [Transaction Charge Logic](#4-transaction-charge-logic)
  - [Interest and WHT Logic](#5-interest-and-wht-logic)
  - [Funds Flow Logic](#6-funds-flow-logic)
  - [Special Scenarios](#7-special-scenarios)
  - [Reconciliation and Reporting](#8-reconciliation-and-reporting)
- [Releases](#releases)
- [Contributing](#contributing)
- [Related Projects](#related-projects)

---

## Quick Links

- **Live Demo** (updated nightly; sandbox data is reset every 6 hours)  
- **GitHub Repository**  
- **Slack Channel**  
- **Jira Board of Mifos**  
- **Jira Board of Mifos Web App**  
- **Project Financial Analytics Dashboards**  
- **Documentation**  
- **AI Assistance**  
- **Test Results**

---

## Installation Guide

### Prerequisites for All Methods

- **Git** – [Download here](https://git-scm.com/downloads)  
- **Mifos® X Backend (Apache Fineract®)** – Required before running the web app.

### Backend Setup (REQUIRED FIRST)

Choose **one** of these backend options:

- **Option A:** Use an existing remote server  
  - Demo (MariaDB) – sandbox data is reset every 6 hours.  
  - Demo (Keycloak)  
  - Demo (2FA)  
  - Demo (Oidc)  
  - Demo (Postgres)  
  - Configure to your server by updating API URLs in environment files.

- **Option B:** Install a local Fineract server – see the [Installation Guide](https://github.com/openMF/fineract/blob/develop/README.md).

- **Option C:** Docker Compose for full stack – see the [Docker Compose section](#method-3-docker-compose-frontend--backend).

After backend setup, configure environment files to point to your backend:
- Update `environments/environment.ts` (development)  
- Update `environments/environment.prod.ts` (production)  
- Change OAuth2 settings if needed (disabled by default)

---

### Frontend Setup (Web App)

Choose **one** of the following methods:

#### Method 1: Manual Installation

1. Install **Node.js** – [Download here](https://nodejs.org/en/download).  
2. Install **Angular CLI** globally:  
   ```bash
   npm install -g @angular/cli@20.3.27
