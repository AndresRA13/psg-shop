# Firebase Storage CORS Configuration Fix

## Problem
You're seeing CORS errors when trying to upload images to Firebase Storage:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Solution

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Create a CORS configuration file
Create a file named `cors.json` in your project root with the following content:

```json
[
  {
    "origin": ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 4: Deploy the CORS rules
From your project root directory, run:
```bash
firebase init storage
```

Then deploy the CORS configuration:
```bash
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_NAME.appspot.com
```

Replace `YOUR_STORAGE_BUCKET_NAME` with your actual Firebase Storage bucket name (you can find this in your Firebase Console under Storage settings).

### Alternative Method: Using Firebase CLI directly
If you prefer to use the Firebase CLI:

1. Initialize Firebase in your project:
```bash
firebase init
```

2. Select Storage when prompted

3. Edit the generated `storage.rules` file to allow read/write access:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Deploy the rules:
```bash
firebase deploy --only storage
```

## Testing
After applying the CORS configuration:
1. Restart your development server
2. Try uploading images again
3. The CORS error should be resolved

## Additional Notes
- Make sure your Firebase project has the Blaze (pay-as-you-go) plan enabled for production, as the Spark plan has limitations with CORS
- For production deployments, you should restrict the origins to only your deployed domain(s)
- The CORS configuration may take a few minutes to propagate