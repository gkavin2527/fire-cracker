
// This API route for admin user management (/api/admin/users) has been deprecated
// as the corresponding functionality was removed from the Admin Dashboard.
// This file can be safely deleted from your project.
//
// Attempting to call this endpoint will likely result in errors if the
// Firebase Admin SDK is not correctly initialized on the server, which requires
// proper service account configuration (e.g., via FIREBASE_SERVICE_ACCOUNT_JSON_PATH
// or FIREBASE_SERVICE_ACCOUNT_JSON environment variables).

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.warn("Attempted to call deprecated API route: /api/admin/users GET");
  return NextResponse.json(
    { 
      error: 'This API endpoint is deprecated and no longer functional. User management has been removed from the admin dashboard.',
      message: 'To re-enable admin user listing, the Firebase Admin SDK must be correctly configured server-side and the frontend code in /admin/page.tsx would need to be reinstated.'
    }, 
    { status: 410 } // 410 Gone
  );
}
