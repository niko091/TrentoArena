# TrentoArena 

[![Live Website](https://img.shields.io/badge/Live-Website-success?style=for-the-badge&logo=render)](https://trentoarena.onrender.com)
[![Status Page](https://img.shields.io/badge/Status-Page-blue?style=for-the-badge)](https://stats.uptimerobot.com/BKPaFJdx1e)

**TrentoArena** is a full-stack web application developed as a university group project for the city of Trento. The platform is designed to connect sports enthusiasts by allowing them to discover local sports facilities, organize games, track their performance, and interact with other players in the community.

## 🎯 Project Overview

This application serves as a centralized hub for recreational sports in Trento. Users can navigate an interactive map of sports venues, join or create matches for various sports, and compete using a built-in Elo ranking system. 

## ✨ Key Features

* **Interactive Map & Venues:** Discover local sports facilities (places) integrated with an interactive Leaflet map.
* **Game Matchmaking:** Create, join, and manage sports games.
* **Competitive Elo System:** Tracks player performance and ranks users based on their game outcomes.
* **Authentication & Security:** Secure login using local credentials or Google OAuth 2.0.
* **User Profiles:** Customizable profiles with avatars (managed via Cloudinary) and player statistics (visualized with Chart.js).
* **Admin Dashboard:** Moderation tools, user ban management, and a reporting system.
* **Multilingual Support:** Fully localized interface utilizing Vue I18n.

## 🛠️ Tech Stack

**Frontend:**
* **Framework:** [Vue.js 3](https://vuejs.org/) with Vite
* **Styling:** [Bootstrap 5](https://getbootstrap.com/) & Sass
* **Mapping:** [Leaflet](https://leafletjs.com/)
* **Data Visualization:** [Chart.js](https://www.chartjs.org/)

**Backend:**
* **Environment:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
* **Language:** TypeScript
* **Database:** [MongoDB](https://www.mongodb.com/) & Mongoose
* **Authentication:** [Passport.js](https://www.passportjs.org/) (Local & Google OAuth2)
* **Image Hosting:** [Cloudinary](https://cloudinary.com/)
* **Emails:** Nodemailer

**Testing & Deployment:**
* **Testing:** Mocha & Supertest
* **Hosting:** Render

---

## 🚀 Getting Started

If you'd like to run this project locally, follow these steps:

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB instance (local or Atlas)

### Installation

1. Clone the repository:
   git clone https://github.com/your-username/TrentoArena.git
   cd TrentoArena

2. Install dependencies:
   This will install both backend and frontend dependencies.
   npm install

3. Environment Setup:
   Create a .env file in the root directory and configure the repository's required variables (e.g., MONGO_URI, SESSION_SECRET, Cloudinary credentials, Google OAuth keys).

### Building, Running and Testing

1. Build the project:
   ./render-build.sh
   
2. Start the development server:
   npm run dev
 
3. Testing
  npm test
