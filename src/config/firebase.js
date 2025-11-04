// src/config/firebase.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount;

// Check if running on Vercel/production (environment variables exist)
const isProduction = !!process.env.FIREBASE_PRIVATE_KEY;

if (isProduction) {
  console.log('🔧 [PRODUCTION] Using Firebase credentials from environment variables');
  
  // Construct full service account from environment variables
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    // CRITICAL: Replace escaped newlines
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    // These are standard Google OAuth URLs
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
      process.env.FIREBASE_CLIENT_EMAIL || ''
    )}`,
  };

  // Validate required fields
  const requiredFields = ['project_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !serviceAccount[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required Firebase environment variables:', missingFields);
    throw new Error(`Missing Firebase env vars: ${missingFields.join(', ')}`);
  }

  console.log('✅ All required Firebase environment variables present');
} else {
  console.log('🔧 [LOCAL] Using serviceAccountKey.json file');
  
  try {
    const { readFileSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
    
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    console.log('✅ serviceAccountKey.json loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load serviceAccountKey.json:', error.message);
    throw new Error('serviceAccountKey.json not found and no environment variables set');
  }
}

// Initialize Firebase Admin (only once)
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log('✅ Firebase Admin initialized successfully');
    console.log(`📦 Project ID: ${serviceAccount.project_id}`);
  } else {
    console.log('ℹ️ Firebase Admin already initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  throw error;
}

export const db = admin.firestore();
export const auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

export default admin;