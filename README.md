## Part 2 Description

This part is a logical continuation of the previous part ([part 1](../part-1/README.md)). If you missed it, we recommend starting with it.

## Starter Repositories

You can fork these repositories to get started. If you don't find a repository with the stack you need, create a repository yourself

- [API](https://github.com/petproject-dev/expense-tracker-backend-part-2) - Express.js
- [UI](https://github.com/petproject-dev/expense-tracker-frontend-part-2) - React

## Backend

<details>
<summary>Task 1: Implement User Model and Database Schema</summary>

---

**Description:**
Create the user model and database schema to handle user-related data securely. Additionally, set up `auth` and `user` modules with appropriate controllers, services, and repositories.

**Acceptance Criteria:**

- Database schema includes `Users` table with fields: `id`, `email`, `name`, `password`.
- Created a migration that successfully creates a new table after running. Running the migration again does not lead to anything.
- `auth` module is created with controller, service, and repository.
- `user` module is created with controller, service, and repository.

**Materials:**

- [What are database migrations?](https://www.prisma.io/dataguide/types/relational/what-are-database-migrations)

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 1 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Create all necessary files and folders yourself
- Use a modular structure for `auth` and `user` modules, each with controller, service, and repository
- Define the database schema for `Users` table with fields: `id`, `email`, `name`, `password`
- Create a migration that creates the `Users` table; running the migration again should not change the schema
- Use Prisma or another migration tool as required
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually (e.g., npm install, run migration)

</details>

---

</details>

<details>
<summary>Task 2: Implement Sign-Up and Sign-In Endpoints</summary>

---

**Description:**
Create endpoints for user registration (`POST /api/auth/sign-up`) and login (`POST /api/auth/sign-in`) with token-based authentication.

**Acceptance Criteria:**

- `RefreshToken` table created and associated with `User`.
- `POST /api/auth/sign-up`: Validates input and creates a new user.
- `POST /api/auth/sign-in`: Validates credentials and returns access and refresh tokens. A new entry must be added to the `RefreshToken` table.
- Tokens are signed and include expiration times.
- Important events (e.g., successful sign-up, failed login attempts) are logged.

**Materials:**

- [JWT Authentication](https://mihai-andrei.com/blog/jwt-authentication-using-prisma-and-express/)

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 2 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `auth` and `user` modules (controller, service, repository)
- Create endpoints `POST /api/auth/sign-up` and `POST /api/auth/sign-in` with token-based authentication
- Implement validation for input data and credentials
- Create and associate `RefreshToken` table with `User` in the database schema
- Sign tokens and set expiration times
- Log important events (successful sign-up, failed login attempts)
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually (e.g., npm install, run migration)

</details>

---

</details>

<details>
<summary>Task 3: Middleware for Access Control</summary>

---

**Description:**
Develop middleware to validate and protect routes that require authentication.

**Acceptance Criteria:**

- Middleware validates access tokens and restricts unauthorized access.
- Protected routes return `401 Unauthorized` if the token is invalid or expired.
- Unauthorized access attempts are logged.

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 3 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `auth` and `user` modules (controller, service, repository)
- Implement middleware to validate access tokens and protect routes
- Ensure protected routes return `401 Unauthorized` for invalid or expired tokens
- Log unauthorized access attempts
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 4: Implement `/api/users/me` Endpoint</summary>

---

**Description:**
Create the `/api/users/me` endpoint in the `user` module to return details of the currently authenticated user.

**Acceptance Criteria:**

- `GET /api/users/me` returns user information (excluding sensitive fields).
- Protected by authentication middleware.
- Access to `/api/users/me` endpoint is logged.

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 4 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `user` module (controller, service, repository)
- Implement the endpoint `GET /api/users/me` to return details of the currently authenticated user (excluding sensitive fields)
- Protect the endpoint with authentication middleware
- Log access to `/api/users/me`
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 5: Implement Token Refresh Endpoint</summary>

---

**Description:**
Implement the `/api/auth/token` endpoint to refresh access tokens using refresh tokens.

**Acceptance Criteria:**

- `POST /api/auth/token` validates the refresh token.
- Issues a new access and refresh tokens if the refresh token is valid.
- Invalid refresh tokens return `401 Unauthorized`.
- Token refresh attempts are logged.

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 5 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `auth` module (controller, service, repository)
- Implement the endpoint `POST /api/auth/token` to refresh access tokens using refresh tokens
- Validate the refresh token and issue new tokens if valid
- Return `401 Unauthorized` for invalid refresh tokens
- Log token refresh attempts
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 6: Forgot Password Flow</summary>

---

**Description:**
Implement the `/api/auth/forgot-password` endpoint to allow users to recover their passwords securely.

**Acceptance Criteria:**

- `POST /api/auth/forgot-password`: Sends a reset code via email. The email also contains a link to the password change page.
- `ResetCode` table is created and associated with `User` table.
- The reset code expires in 10 minutes.

**Technology-related requirements:**

<details>
<summary>NodeJS</summary>

- Use `nodemailer` for sending emails.
</details>

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 6 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `auth` module (controller, service, repository)
- Implement the endpoint `POST /api/auth/forgot-password` to send a reset code via email (with a link to the password change page)
- Create the `ResetCode` table and associate it with the `User` table in the database schema
- Ensure the reset code expires in 10 minutes
- Use `nodemailer` for sending emails
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 7: Restore Password Flow</summary>

---

**Description:**
Implement the `/api/auth/restore-password` endpoint.

**Acceptance Criteria:**

- `POST /api/auth/restore-password`: Validates the reset code and updates the user's password.
- `ResetCode` should be removed after successful password reset.
- A job has been created that deletes all expired codes once a week.
- Password reset requests and successful resets are logged.

**Technology-related requirements:**

<details>
<summary>NodeJS</summary>

- Use `node-cron` for scheduling crone jobs.
</details>

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 7 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `auth` module (controller, service, repository)
- Implement the endpoint `POST /api/auth/restore-password` to validate the reset code and update the user's password
- Remove the `ResetCode` after successful password reset
- Create a scheduled job (using `node-cron`) to delete all expired codes once a week
- Log password reset requests and successful resets
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 8: Logout</summary>

---

**Description:**
Implement the `/api/auth/logout` and `/api/auth/logoutAll` endpoints.

**Acceptance Criteria:**

- `GET /api/auth/logout`: logout the user out of the account on the current device
- `GET /api/auth/logoutAll`: logout the user out from all devices.
- A job has been created that deletes all expired refresh tokens once a week.

**Technology-related requirements:**

<details>
<summary>NodeJS</summary>

- Use `node-cron` for scheduling crone jobs.
</details>

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 8 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `auth` module (controller, service, repository)
- Implement the endpoints `GET /api/auth/logout` and `GET /api/auth/logoutAll` for logging out from current and all devices
- Create a scheduled job (using `node-cron`) to delete all expired refresh tokens once a week
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 9: Security Hardening</summary>

---

**Description:**
Implement security measures to ensure data protection and prevent common vulnerabilities.

**Acceptance Criteria:**

- Implement rate limiting for authentication endpoints.
- Ensure tokens are securely signed and validated.
- Enable CORS with secure configurations.
- Prevent common attacks such as SQL injection and XSS.

**Technology-related requirements:**

<details>
<summary>NodeJS</summary>

- Use `helmet` for basic security headers.
- Use `express-rate-limit` for rate limiting.
- Validate all incoming data and sanitize inputs.
</details>

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 9 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Implement security measures for data protection and prevention of common vulnerabilities
- Use `helmet` for security headers and `express-rate-limit` for rate limiting
- Enable CORS with secure configurations
- Validate and sanitize all incoming data
- Ensure tokens are securely signed and validated
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 10: Add unit tests</summary>

---

**Description:**
Cover the functionality of `auth` and `user` modules with unit tests.

**Acceptance Criteria:**

- The test environment is configured.
- A test script has been added to package.json, which runs the testing command.
- Tests interact only with mock data.
- Test coverage from 70%.

**Technology-related requirements:**

<details>
<summary>NodeJS</summary>

- Use `supertest` and `jest`.
</details>

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 10 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Use the modular structure for `auth` and `user` modules (controller, service, repository)
- Configure the test environment and add a test script to package.json
- Cover the functionality of `auth` and `user` modules with unit tests (using only mock data)
- Achieve at least 70% test coverage
- Use `supertest` and `jest` for testing
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 11: Final step</summary>

---

- Make sure the tests pass - `npm run test`
- Open a pull request for the `master` branch and send the solution to the code review

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 11 from the README file `ExpenseTracker/README.md`:

- Make sure all previous tasks are completed and all tests pass (`npm run test`)
- Open a pull request for the `master` branch and send the solution to code review
- After completion, provide a short report on what was done

</details>

---

</details>

## Frontend

<details>
  <summary>Task 1: Routing</summary>

---

**Description:**
Add a router with empty blank pages. This will allow you to make transitions between pages in the future.

**Acceptance Criteria:**

- Empty placeholders added for sign in, sign up, forgot password, verification code, restore password, success pages
- Router added
- Pages and routes are linked
- The root route belongs to the main page and displays a table with expenses

**Technology-related requirements:**

<details>
<summary>React</summary>

- Use `react-router-dom`
</details>

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 1 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Add routing using `react-router-dom` v6+
- Create empty placeholder pages for sign in, sign up, forgot password, verification code, restore password, and success
- Link all pages and routes according to the Acceptance Criteria
- The root route should display a table with expenses (can be a placeholder for now)
- Use a modular structure: `src/pages/`, `src/routes/`, `src/components/`
- Export all pages and routes for easy extension
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 2: Layout for Authentication Components</summary>

---

**Description:**
Create a common layout for authentication pages.

**Acceptance Criteria:**

- [Design Link](https://www.figma.com/design/rLNUulPqnl0jhhnXeGDxEb/Expense-tracker?node-id=3-25446&t=OWBBHRgYsR67Eq8H-4)
- Layout can be a wrapper for authentication pages.
- Layout added to the router for authentication pages
- Added styles for responsive design

**Materials:**

<details>
<summary>React</summary>

- [Building a Layout with React Router](https://medium.com/@ravipatel.it/building-a-layout-with-react-router-v6-step-by-step-guide-75b9637f1fbe)
</details>

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 2 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Create a reusable layout component for authentication pages in `src/layouts/AuthLayout/AuthLayout.tsx`
- Add responsive styles and match the Figma design as closely as possible
- Integrate the layout into the router for all authentication-related pages
- Use a modular structure: `src/layouts/`, `src/pages/`, `src/routes/`
- Export the layout for reuse
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 3: Implement Sign-Up Page</summary>

---

**Description:**
Create the Sign-Up page, allowing users to register by providing necessary information.

**Acceptance Criteria:**

- Added password input component.
- The page includes input fields: `name`, `email`, `password`.
- Validation guarantees a valid email. The password must contain 8-12 characters long and contain uppercase and lowercase letters, as well as numbers.
- Errors are displayed if validation fails.
- A success message is displayed after registration.
- After successful registration, the user should be redirected to the sign-in page.
- The links in the design should lead to the corresponding pages.
- Added styles for responsive design

**Endpoints:**

- `POST /api/auth/sign-up`

**Technology-related requirements:**

<details>
<summary>React</summary>

- Use `react-hook-form` for form handling.
- Use `yup` for validation.
</details>

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 3 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Create a Sign-Up page in `src/pages/SignUp/SignUp.tsx` with fields: name, email, password
- Use `react-hook-form` and `yup` for form handling and validation
- Add a password input component with show/hide functionality
- Display errors and a success message after registration
- Redirect to the sign-in page after successful registration
- Add links to other auth pages as in the design
- Add responsive styles
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 4: Implement Sign-In Page</summary>

---

**Description:**
Create the Sign-In page to authenticate users using their email and password.

**Acceptance Criteria:**

- The page includes input fields: `email`, `password`.
- The email and password validation rules must be exactly the same as on the sign-up page.
- Invalid credentials display appropriate error messages.
- On success, the user is redirected to a protected route.
- Added styles for responsive design

**Endpoints:**

- `POST /api/auth/sign-in`

**Technology-related requirements:**

<details>
<summary>React</summary>

- Use `react-hook-form` for form handling.
- Display validation and backend errors clearly.
</details>

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 4 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Create a Sign-In page in `src/pages/SignIn/SignIn.tsx` with fields: email, password
- Use `react-hook-form` for form handling and validation (same rules as sign-up)
- Display validation and backend errors clearly
- Redirect to a protected route on success
- Add responsive styles
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 5: Token Management</summary>

---

**Description:**
After successful login, the user receives an access token as a response. A refresh token will also be set as a cookie. Refresh token is controlled on the backend, access token will be controlled by the frontend. Since it is advisable not to store the access token in any storage, we will store it in a closure.

**Acceptance Criteria:**

- The access token is not stored in any storage.
- Each subsequent request must take the token and closures and add an authentication header.
- The access token is automatically renewed when the old one expires.

**Endpoints:**

- `POST /api/auth/token`

**Technology-related requirements:**

<details>
<summary>React</summary>

- Use interceptors in `axios` to manage token logic globally.
</details>

**Materials:**

- [Using Axios interceptors for refreshing your API token](https://www.thedutchlab.com/insights/using-axios-interceptors-for-refreshing-your-api-token)

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 5 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Implement token management using closures (do not store access token in storage)
- Use `axios` interceptors to add the access token to each request and handle token refresh automatically
- Integrate with the backend endpoint `POST /api/auth/token`
- Add a utility for managing tokens in `src/utils/`
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 6: Implement Forgot Password Flow</summary>

---

**Description:**
Develop a password recovery flow with pages for email submission, token validation, and resetting the password.

**Acceptance Criteria:**

- **Forgot Password Page:** User enters their email to receive a reset code.
- **Reset Code Page:** User enters the reset code.
- **Restore Password Page:** User sets a new password.
- On success, the user is redirected to a success page.
- Added styles for responsive design

**Endpoints:**

- `POST /api/auth/forgot-password`
- `POST /api/auth/restore-password`

**Technology-related requirements:**

<details>
<summary>React</summary>

- Use `react-router` for navigation across recovery pages.
- Handle loading and error states gracefully.
</details>

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 6 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Implement a password recovery flow with three pages: Forgot Password, Reset Code, Restore Password
- Use `react-router` for navigation between these pages
- Add forms for email, reset code, and new password (with validation)
- Handle loading and error states gracefully
- Redirect to a success page on completion
- Add responsive styles
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 7: Implement Protected Routes</summary>

---

**Description:**
Create route guards to protect authenticated routes and restrict unauthorized access.

**Acceptance Criteria:**

- Authenticated users can access protected routes.
- Unauthenticated users are redirected to the sign-in page.
- Make the root page with the table protected so that only authorized users have access to it.
- Each user should be able to see only their data in the table.

**Technology-related requirements:**

<details>
<summary>React</summary>

- Routes are secured using a reusable `PrivateRoute` component.
- Use `react-router-dom` to implement route protection.
</details>

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 7 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Implement route guards using a reusable `PrivateRoute` component in `src/routes/`
- Protect the root page (table) and any other authenticated routes
- Redirect unauthenticated users to the sign-in page
- Ensure each user sees only their data in the table
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 8: Implement User Profile Page</summary>

---

**Description:**
Create a user profile page displaying authenticated user details. Our design does not include this page. You can make this page whatever you want.

**Acceptance Criteria:**

- User details (excluding sensitive fields) are displayed.
- Added styles for responsive design.
- A profile icon has been added to the header when clicked on which the user should be redirected to the user's page.
- The user has access only to his data.
- Route is protected.

**Endpoints:**

- `GET /api/users/me`

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 8 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Create a user profile page in `src/pages/Profile/Profile.tsx` displaying authenticated user details (excluding sensitive fields)
- Add a profile icon to the header that links to the profile page
- Protect the route so only authenticated users can access it
- Add responsive styles
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 9: Add unit tests</summary>

---

**Description:**
Cover the functionality with unit tests.

**Acceptance Criteria:**

- The test environment is configured.
- A test script has been added to package.json, which runs the testing command.
- The main functionality of the components is covered by unit tests (this part and previous one).

**Technology-related requirements:**

<details>
<summary>React</summary>

- Use `react-testing-library`
</details>

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 9 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Configure the test environment and add a test script to package.json
- Cover the main functionality of the components with unit tests using `react-testing-library`
- Ensure tests cover both this part and the previous one
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 10: Add storybook</summary>

---

**Description:**
By now you should have a large number of components ready to be reused. As the application grows, it becomes more difficult to remember which components are ready and which have states. You are invited to add a storybook to visualize the existing components.

**Acceptance Criteria:**

- The storybook is installed.
- All components that can be reused are added to the storybook.
- The script for launching the storybook has been added to package.json

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 10 from the README file `expense-tracker/part-2/README.md`:

- Work in the `<project-name>` folder
- Install and configure Storybook for React
- Add all reusable components to Storybook with stories for each state
- Add a script for launching Storybook to package.json
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
  <summary>Task 11: Final step</summary>

---

- Make sure the tests pass - `npm run test`
- Open a pull request for the `master` branch and send the solution to the code review

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 11 from the README file `expense-tracker/part-2/README.md`:

- Make sure all previous tasks are completed and all tests pass (`npm run test`)
- Open a pull request for the `master` branch and send the solution to code review
- After completion, provide a short report on what was done

</details>

---

</details>

## Solution

In progress...

<!-- If you've already finished working on this part or are stuck, these repositories might be useful to you.
  - [API](https://github.com/petproject-dev/expense-tracker-backend-part-3) - Express.js
  - [UI](https://github.com/petproject-dev/expense-tracker-frontend-part-3) - React -->

## Next Steps

If you're ready to move forward, you can proceed to [next project part](../part-3/README.md).

## Found an Issue?

We strive to make the project as clear and helpful as possible. If you notice any errors, inconsistencies, or unclear instructions, please open a Pull Request in this repository with your suggested fixes or improvements. Your feedback helps improve the learning experience for everyone!

Happy coding, and good luck with this part of the project!
