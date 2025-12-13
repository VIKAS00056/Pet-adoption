Petify is a simple Pet Adoption / Pet Rescue web application built for learning full-stack web development.
In this platform, admins (pet rescuers) can add pets, and visitors can view available pets and proceed to adopt them by visiting the rescue store.

⚠️ Note: Pets do not have prices. Adoption is handled offline through the store/organization.

✨ Features
👤 Visitor

View list of rescued pets

View pet details (name, breed, age, size, description, image)

Click Apply to Adopt

Guided to visit the rescue store for adoption

🔐 Admin (Pet Rescuer)

Secure admin login

Add new pets

Upload pet images

Manage pet listings

🛠️ Tech Stack

Frontend:

HTML

CSS

JavaScript

Backend:

Node.js

Express.js

MongoDB (Mongoose)

📁 Project Structure
pet-adopt/
├─ public/
│  ├─ index.html
│  ├─ adopt.html
│  ├─ pet.html
│  ├─ admin.html
│  ├─ css/
│  │  └─ styles.css
│  └─ js/
│     ├─ app.js
│     ├─ adopt.js
│     └─ admin.js
├─ uploads/
├─ models/
│  └─ Animal.js
├─ server.js
├─ package.json
├─ .env.example
└─ README.md

🚀 How to Run Locally
1️⃣ Clone the repository
git clone https://github.com/your-username/petify.git
cd petify

2️⃣ Install dependencies
npm install

3️⃣ Setup environment variables

Create a .env file using .env.example:

MONGO_URI=your_mongodb_connection_string
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password

4️⃣ Start MongoDB

Make sure MongoDB is running locally or use MongoDB Atlas.

5️⃣ Start the server
node server.js

6️⃣ Open in browser
http://localhost:3000

🔐 Admin Access

Admin can log in using credentials defined in .env

Admin page:

http://localhost:3000/admin.html

🎯 Project Purpose

Learn Frontend + Backend integration

Understand CRUD operations

Practice authentication & role-based access

Designed for college lab assignments & mini projects

📌 Future Improvements

User authentication (login/signup)

Online adoption requests

Adoption status tracking

Email notifications

Better UI/UX

📄 License

This project is created for educational purposes.
You are free to modify and use it for learning.
