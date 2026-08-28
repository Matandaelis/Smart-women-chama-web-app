# Mifos® X Web App

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
