# CodeViz Research Context

> **Note**: This file contains research context from CodeViz. Most recent contexts are at the bottom.

----

## Research Query

--

*Session: f2db9f118d5ac3d710ea2fac24433de2 | Generated: 7/8/2025, 9:36:33 PM*

### Analysis Summary

# Codebase Overview Report

This report provides a high-level overview of the `i-amp-yoqa-system` codebase, detailing its architecture, primary components, and their interrelationships.

## High-Level Architecture

The `i-amp-yoqa-system` is structured as a full-stack application, comprising a distinct **back-end** (API server) and a **front-end** (client-side application). These two main components communicate over HTTP, with the front-end consuming services exposed by the back-end API.

*   **Back-End**: Handles business logic, data storage, authentication, and serves API endpoints. It is implemented using Node.js.
*   **Front-End**: Provides the user interface and experience, interacting with the back-end API to fetch and display data, and to send user actions. It is implemented using React.

The project root directory contains the two main components: [back-end/](back-end/) and [front-end/](front-end/).

## Back-End Component

The **back-end** is responsible for managing data, user authentication, and exposing various functionalities through a RESTful API. It is built with Node.js and likely uses Express.js given the file structure.

*   **Purpose**: To provide a robust and secure API for the front-end application, manage database interactions, and implement core business logic.
*   **Key Internal Parts**:
    *   **Server Entry Point**: The main application entry point is [server.js](back-end/server.js).
    *   **Configuration**: Contains database connection settings and other configurations in the [config/](back-end/config/) directory, specifically [db.js](back-end/config/db.js) for database connection and [supabaseConfig.js](back-end/config/supabaseConfig.js) for Supabase integration.
    *   **Controllers**: Implement the logic for handling incoming requests and preparing responses. These are located in the [controllers/](back-end/controllers/) directory. Examples include [authController.js](back-end/controllers/authController.js), [classController.js](back-end/controllers/classController.js), and [userController.js](back-end/controllers/userController.js).
    *   **Models**: Define the data structures and interact with the database. These are found in the [models/](back-end/models/) directory. Examples include [user.js](back-end/models/user.js), [class.js](back-end/models/class.js), and [product.js](back-end/models/product.js).
    *   **Routes**: Define the API endpoints and map them to the respective controller functions. These are organized in the [routes/](back-end/routes/) directory. Examples include [authRoutes.js](back-end/routes/authRoutes.js), [userRoutes.js](back-end/routes/userRoutes.js), and [productRoutes.js](back-end/routes/productRoutes.js).
    *   **Middlewares**: Functions that execute in the middle of a request-response cycle, often used for authentication, logging, or error handling. The [auth.js](back-end/middlewares/auth.js) middleware handles authentication.
    *   **Utilities**: Helper functions and modules, such as [jwtUtils.js](back-end/utils/jwtUtils.js) for JSON Web Token operations and [upload.js](back-end/utils/upload.js) for file uploads, located in the [utils/](back-end/utils/) directory.
*   **External Relationships**:
    *   **Database**: Connects to a database (likely PostgreSQL given Supabase config) for data persistence, configured via [db.js](back-end/config/db.js).
    *   **Front-End**: Exposes API endpoints consumed by the front-end application.

## Front-End Component

The **front-end** provides the user interface and interacts with the back-end API. It is a React application.

*   **Purpose**: To render the user interface, manage user interactions, display data fetched from the back-end, and handle client-side routing.
*   **Key Internal Parts**:
    *   **Main Application Entry Points**: The main HTML file is [index.html](front-end/index.html), and the main JavaScript/React entry point is [main.jsx](front-end/src/main.jsx). The core application logic and routing are handled in [App.jsx](front-end/src/App.jsx) and [AppRouter.jsx](front-end/src/AppRouter.jsx).
    *   **Components**: Reusable UI elements located in the [components/](front-end/src/components/) directory. Examples include [Navbar.jsx](front-end/src/components/Navbar.jsx), [Footer.jsx](front-end/src/components/Footer.jsx), and [HeroSection.jsx](front-end/src/components/HeroSection.jsx). There's also a [dashboard/](front-end/src/components/dashboard/) subdirectory for dashboard-specific components like [SummaryCard.jsx](front-end/src/components/dashboard/SummaryCard.jsx).
    *   **Pages**: Top-level components representing different views or pages of the application, found in the [pages/](front-end/src/pages/) directory. Examples include [Home.jsx](front-end/src/pages/Home.jsx), [SignIn.jsx](front-end/src/pages/SignIn.jsx), [Product.jsx](front-end/src/pages/Product.jsx), and [Course.jsx](front-end/src/pages/Course.jsx). Admin and Instructor specific pages are in [admin/](front-end/src/pages/admin/) and [Instructor/](front-end/src/pages/Instructor/) respectively.
    *   **Services**: Modules responsible for making API calls to the back-end. These are located in the [services/](front-end/src/services/) directory. Examples include [authService.js](front-end/src/services/authService.js), [userService.js](front-end/src/services/userService.js), and [productService.js](front-end/src/services/productService.js).
    *   **Hooks**: Custom React hooks for reusable logic, such as [useAutoLogout.js](front-end/src/hooks/useAutoLogout.js).
    *   **Styles**: CSS files for styling the application, located in the [styles/](front-end/src/styles/) directory. Examples include [Home.css](front-end/src/styles/Home.css) and [Dashboard.css](front-end/src/styles/Dashboard.css).
    *   **Utilities**: Helper functions for client-side operations, such as [tokenUtils.js](front-end/src/utils/tokenUtils.js).
*   **External Relationships**:
    *   **Back-End API**: Makes HTTP requests to the back-end API endpoints via the service modules (e.g., [authService.js](front-end/src/services/authService.js)) to perform operations like user authentication, data retrieval, and data submission.

