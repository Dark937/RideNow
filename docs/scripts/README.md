# RideNow

**RideNow** is a modern **taxi booking web platform concept** designed to simplify urban transportation through a clean and intuitive interface.

Unlike traditional ride services, RideNow is built around a **futuristic concept** where rides are performed using **high-performance supercars powered by AI systems**, creating a fast, premium and technology-driven transportation experience.

The project focuses on creating a visually engaging experience with **smooth animations**, **modern layouts**, and **interactive components** that make the process of requesting a ride simple and enjoyable.

---

## Project Overview

RideNow is a **front-end focused web project** that explores modern web design and interaction techniques.

The concept behind the platform is a **next-generation taxi service** where artificial intelligence manages ride requests and routes while **AI-assisted supercars** provide a premium transportation experience.

The goal of the project is to design a platform that feels **futuristic, minimal, and intuitive** for users.

### Design Principles

• **Minimal and modern interface**  
• **Smooth animations and transitions**  
• **Clear visual hierarchy**  
• **Interactive sections and dynamic layouts**  
• **Responsive design for different screen sizes**

---

## School Project

RideNow was developed as a **school project** focused on **web design and user experience**.

The objective of the project is to demonstrate how **modern design principles, animations, and interaction design** can improve the usability and visual appeal of a digital platform.

The project combines elements of:

• **UI Design**  
• **UX Design**  
• **Front-End Development**  
• **Visual Interaction Design**

---

## Goals of the Project

The main goal of **RideNow** is to explore how **interface design, motion, and layout** can enhance the experience of booking transportation online.

This project also serves as a learning experience in:

• modern web design  
• interface structure  
• animation and interaction  
• version control using GitHub

---

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas for cloud)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Dark937/Ride.git
   cd Ride
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure secret key for JWT tokens

4. For MongoDB Atlas (recommended for non-local):
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get the connection string and update `MONGODB_URI`
   - Whitelist your IP address in Atlas

5. Start the server:
   ```bash
   npm start
   ```

6. Open `index.html` in your browser to access the frontend.

### API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile (requires authentication)

---

## Author

Developed by **Lori** & **PizzaGamer89** 
Students and aspiring **UI / UX Designers**