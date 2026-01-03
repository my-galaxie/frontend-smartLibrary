# Environment Variable Setup for Smart Library

## The Issue
You saw the error `DNS_PROBE_FINISHED_NXDOMAIN` for `placeholder-url.supabase.co` because your frontend is missing the Supabase configuration settings.

## How to Fix

1.  **Open the file:** `Frontend/my-app/.env.local`
    *   (If it doesn't exist, create it)

2.  **Add your keys:**
    Copy the `SUPABASE_URL` and `SUPABASE_KEY` (Anon Key) from your Supabase Dashboard (Project Settings > API).

    The file should look like this:
    ```
    NEXT_PUBLIC_API_URL=https://qljzkg1uzd.execute-api.ap-south-1.amazonaws.com
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    ```

3.  **For Vercel Deployment:**
    *   Go to your [Vercel Project Settings](https://vercel.com/dashboard)
    *   Click **Settings** > **Environment Variables**
    *   Add `NEXT_PUBLIC_SUPABASE_URL` and your URL value.
    *   Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` and your Key value.
    *   **Redeploy** the project (Go to Deployments > Redeploy).

## After Validation
Once you have added these keys locally, restart your dev server:
```powershell
npm run dev
```
And try the "Sign up with Google" button again.
