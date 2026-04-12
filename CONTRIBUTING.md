# Contributing to KindHeart

Welcome to the KindHeart team! To keep our code clean and manageable for everyone, please follow these guidelines.

## 📂 Folder Rules
- **Frontend developers**: Only work inside our `client/` folder.
- **Backend developers**: Only work inside our `server/` folder. Remember to `cd server` before running any commands!
- **Root configuration**: Do not modify files in the root (like `.gitignore`) without consulting our team lead.

## 🎨 CSS Naming Convention (Simple Prefixing)
To avoid clashing styles, we use a simple **prefixing** strategy instead of BEM for now.
- Always start your class names with the page or component name.
- Example for a campaign card:
  - ✅ `.campaign-card { ... }`
  - ✅ `.campaign-title { ... }`
  - ❌ `.title { ... }`

## 📜 JavaScript Guidelines
- **External modules**: Use `js/api.js` for all backend interactions.
- **Page scripts**: Every JS file should be wrapped in an **IIFE** (Immediately Invoked Function Expression) to prevent global variable leaks, unless using `<script type="module">`.
- Template:
  ```javascript
  (function () {
    document.addEventListener("DOMContentLoaded", function () {
      // Your code here
    });
  })();
  ```

## 🔐 Git & Branching
1. Always create a new branch for your feature: `git checkout -b feature/your-feature-name`.
2. Commit your changes with clear messages: `git commit -m "Add login validation"`.
3. Push to your branch and create a Pull Request.

## 🛠 Development Workflow
1. Pull the latest changes from `main` daily.
2. Run `npm install` in the `server` folder whenever someone adds a new package.
3. Use the `assets/js/api.js` file for all fetch requests to the backend.
