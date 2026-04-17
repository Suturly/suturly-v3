declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      /** Optional: force marketing modal form id (otherwise from Globals → Marketing → Partner contact form). */
      NEXT_PUBLIC_PARTNER_CONTACT_FORM_ID?: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      /**
       * Set to `true` only to allow POST /next/seed when `NODE_ENV=production` (e.g. disposable
       * staging DB). Omitted/false = seed route returns 403 in production.
       */
      ALLOW_DATABASE_SEED?: string
      /** Resend API key; without it Payload emails go to the console logger only (not delivered). */
      RESEND_API_KEY?: string
      /** Default `From:` address for Resend-sent emails. */
      RESEND_FROM_ADDRESS?: string
      /** Display name used alongside the From address. */
      RESEND_FROM_NAME?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
