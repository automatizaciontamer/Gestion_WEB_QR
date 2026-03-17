# **App Name**: TamerWorks Admin

## Core Features:

- Authentication & Session Management: Secure login with 'admin' and predefined key or Firebase Auth, plus an inactivity hook for automatic logout after 5 minutes, always requiring login on app start.
- Work Listing & Filtering: Display a table of technical works with filtering capabilities by Número OF, OT, or Client.
- Work Creation & Editing: A comprehensive form for creating and editing work entries, including all technical fields, image uploads for cover, and initial PDF document associations.
- Google Drive Document Upload: Integrate an interface for uploading technical files (in base64 format) to Google Drive via the provided Google Apps Script API.
- Document Management within Work: Allow managing uploaded documents within each work, including marking them as 'visibleCliente' and saving URLs to Firestore.
- QR Code Poster Generation: Generate and allow downloading a printable A4 poster containing work details, corporate header/footer, and a large central QR code.
- Client User Management (CRUD): CRUD interface for managing client users with name, email, and password.

## Style Guidelines:

- Primary color: A deep corporate blue (#1F7ECC) for professionalism and reliability, chosen to evoke a technical and industrial aesthetic.
- Background color: A very light desaturated blue-gray (#ECF4F7) to maintain a clean and uncluttered interface, visually linked to the primary hue but in a lighter, softer tone.
- Accent color: A vibrant purple-blue (#5666ED) to draw attention to interactive elements and highlights, providing an energetic contrast without being overly bold.
- Body and headline font: 'Inter', a grotesque-style sans-serif for its modern, objective, and neutral appearance, ensuring readability across data tables and forms.
- Utilize Lucide React icons for a clear, modern, and consistent visual language throughout the dashboard, enhancing navigation and feature recognition.
- A clean, professional SaaS dashboard layout with a clear sidebar navigation and a primary content area. Focus on efficient data display, form clarity, and responsive design with Tailwind CSS.
- Implement subtle animations and hover effects on interactive elements like buttons and table rows to provide a smooth, engaging user experience without distracting from content.