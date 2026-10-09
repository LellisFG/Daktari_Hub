# Daktari Hub — Hospital Management System Demo

A front-end prototype with patient registration and appointment booking, doctor scheduling, diagnostic test selection with sample availability times, prescription management with pharmacy serials, a dedicated pharmacy portal, supervisor dashboard, doctor enrollment, and pharmacy stock management.

## Run locally
1. Extract the ZIP archive.
2. Open the `Daktari_Hub` folder in VS Code.
3. Open `index.html` with VS Code Live Server. Internet access is required for the CDN-hosted styling and icons.

## Demo staff logins
- **Supervisor:** username `supervisor`, password `Admin123!`
- **Doctor:** username `robert`, password `Doctor123!`
- **Another sample doctor:** username `amina`, password `Doctor123!`
- **Pharmacy Portal:** username `pharmacy`, password `Pharmacy123!` (demo access)

The supervisor can enroll doctors and set their demo login credentials. Doctors use their assigned username and password to access their schedule.

## Included features
- Patient details registration: full name, age, gender, phone, email, blood group, and address/town.
- Patients enter their own name, age, gender, and contact details directly in the booking form; a profile is created or updated automatically. No shared patient dropdown or patient directory is shown.
- Search the doctor directory; the patient portal has a prescription-report lookup by serial, while the pharmacy catalogue is in its own portal.
- Role-specific portal sessions: once a role is entered, other portal links are hidden and role switching requires signing out. Doctor, supervisor, and pharmacy each have their own login credentials.
- Supervisor can enroll doctors with department, license/registration ID, experience, username, and temporary password.
- Supervisor can add new pharmacy items or increase stock for an existing item.
- Doctors can select diagnostic tests and see sample availability times.
- Doctors can select medicines, quantities, and directions; saving a prescription generates a pharmacy serial.
- Patients can enter the serial to view the medication report and estimated total price.
- Pharmacy staff can retrieve a report by serial and browse the catalogue.
- Stock levels and low-stock alerts update in the pharmacy catalogue and dashboard.
- Browser localStorage persistence and demo-data export. Patient appointment history is filtered to the patient profile associated with the current patient session.

## Important security and privacy limitations
**This is a learning/demo project, not a secure hospital information system.** The login is implemented entirely in browser JavaScript; credentials and records are stored in localStorage and can be inspected or changed by anyone with access to the browser. It does not provide real authentication, authorization, encryption, audit logs, server-side storage, backups, or regulatory compliance. Do not enter real patient information or use these credentials in production. A real deployment needs a secure backend, hashed passwords, role-based access enforcement on the server, HTTPS, database controls, and appropriate healthcare privacy safeguards.
