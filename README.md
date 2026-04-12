# KindHeart Project Tracker & Platform

KindHeart is a capstone project developed as part of the 3MTT program. It is designed to be a lightweight, modular web application for community outreach and project tracking.

## Tech Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Tooling:** Google Apps Script (for automated project tracking)

## Modular Architecture
To support a team of multiple developers without code clashes, this project uses a **Namespace-Prefix Strategy**:

* **CSS Isolation:** Every page-specific style must be prefixed (e.g., `.about-form-btn`, `.contact-card`).
* **JS Scoping:** Page logic is wrapped in `{ }` blocks to prevent global variable leakage.
* **Structure:** Each developer owns a specific file set in `/public` to ensure clean merges.

## 🚀 How to Run Locally
1. Clone the repository:
   `git clone https://github.com/osazuwamatthewogbebor/3mtt-kindheart-capstone`
2. Install dependencies:
   `npm install`
3. Start the server:
   `node server.js`
4. Visit `http://localhost:3000` in your browser.

## 👥 Contributors
This project is maintained by the KindHeart Capstone Team.
