# 🚚 SmartShip Logistics – Microservices-Based Logistics Platform

SmartShip Logistics is a microservices-based web platform designed to manage shipments, tracking, and administrative operations through a scalable and modular architecture.

Built using ASP.NET Core and Angular, the system integrates multiple independent services through an API Gateway and uses RabbitMQ for asynchronous communication.

This project demonstrates real-world backend concepts such as microservices architecture, API Gateway pattern, and event-driven communication.

---

## 📌 Features

- Shipment management and tracking  
- Modular microservices architecture  
- API Gateway using Ocelot  
- Event-driven communication with RabbitMQ  
- RESTful APIs for efficient data handling  
- Scalable and maintainable backend design  
- Angular-based frontend  

---

## 🏗️ Architecture Overview

The application follows a microservices architecture where each service is independently developed and handles a specific business function.

**Key Components:**
- API Gateway (Ocelot) – routes all incoming requests  
- Microservices – handle business logic (Shipment, Tracking, Admin, Identity)  
- RabbitMQ – enables asynchronous communication  
- Angular frontend – interacts with backend APIs  

---

## 🛠️ Tech Stack

**Backend:** ASP.NET Core, C#, REST APIs  
**Frontend:** Angular, TypeScript, JavaScript  
**Database:** SQL Server  
**Communication:** RabbitMQ, Ocelot API Gateway  

---

## ⚙️ How to Run the Project

### Backend
1. Navigate to Backend folder  
2. Open `SmartShip.Logistics.sln` in Visual Studio  
3. Run the required services  

### Frontend
```bash
cd frontend/smartship-ui
npm install
ng serve
```

### Prerequisites
- .NET SDK  
- Node.js & Angular CLI  
- SQL Server  
- RabbitMQ running locally  

---

## 🔄 System Workflow

1. Client sends request from Angular UI  
2. Request passes through Ocelot API Gateway  
3. Relevant microservice processes the request  
4. Services communicate asynchronously using RabbitMQ  
5. Response is returned to the client  

---

## 📁 Project Structure

```bash
Backend/                         # .NET microservices + API Gateway (Ocelot)
  gateway/                       # API Gateway configuration
  services/
    SmartShip.AdminService/      # Admin service
    SmartShip.ShipmentService/   # Shipment service
    SmartShip.TrackingService/   # Tracking service
    SmartShip.IdentityService/   # Authentication service
    SmartShip.DocumentService/   # Document handling service
  shared/                        # Shared libraries (Core, Contracts, etc.)
  SmartShip.Logistics.sln        # Solution file

frontend/                        # Angular application
  smartship-ui/                  # Main frontend project
```
---
## 🔐 Authentication

- JWT-based authentication  
- Secure API access control  
- Role-based authorization for protected endpoints  

---

## 📊 Key Highlights

- Designed and implemented a microservices-based architecture  
- Built scalable and maintainable REST APIs  
- Implemented asynchronous communication using RabbitMQ  
- Integrated API Gateway for centralized routing and management  
- Implemented role-based authorization for secure access control  
- Added logging for monitoring and debugging system behavior  

---

## 🚀 Future Improvements

- Implement caching for performance optimization  
- Enhance monitoring and observability  
- Improve UI/UX of frontend  
