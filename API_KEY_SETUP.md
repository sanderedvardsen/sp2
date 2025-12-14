# API Key Setup Instructions

## You need to create your own Noroff API Key to use bidding features

The application currently uses a placeholder API key which may not work for all features, especially bidding.

### Steps to get your own API Key:

1. **Login** to the Noroff API at: https://v2.api.noroff.dev
2. **Sign in** with your Noroff student credentials
3. Go to your **profile/settings**
4. Click on **API Keys** or **Create API Key**
5. **Generate** a new API key
6. **Copy** the generated key

### Update the application:

1. Open `src/lib/api.ts`
2. Find the line: `const API_KEY = '4f4ad3d0-630b-4ef4-8913-849fe798fe69';`
3. Replace the value with your new API key
4. Save the file
5. Restart the development server

### After updating:
- You'll be able to bid on auctions
- Your credits will be tracked correctly
- Profile features will work properly
- You can create listings (if implemented)

**Note:** Keep your API key private and don't commit it to public repositories!
