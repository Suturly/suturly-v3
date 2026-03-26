# Payload user roles

Two roles are supported via the **`users.role`** field:

| Role              | Typical use |
|-------------------|-------------|
| **Admin**         | Full access: users, pages, site globals, redirects, forms, search, categories, **delete** resources & media. |
| **Content creator** | **Resources** (posts): create, edit, publish/unpublish. **Media**: upload & edit metadata. **Cannot** delete resources or media, or edit pages/globals/users/plugins. **Header / Footer** globals are hidden in the admin sidebar (same as Users). |

- **Legacy accounts** (no `role` in the database) are treated as **admin** so existing installs keep working until you set roles explicitly.

## Add a content creator

1. Log in to Payload admin as an **admin**.
2. Open **Users** (Plugins → Users).
3. **Create new** (or invite if you use that flow).
4. Set **Role** to **Content creator**, fill **email** / **name** / **password** as usual.
5. Save.

## Remove a user

1. As **admin**, go to **Users**.
2. Open the user → **Delete** (only admins can delete users).

## Change who is admin

1. As **admin**, edit the user in **Users**.
2. Set **Role** to **Admin** or **Content creator** (only admins can change this field).

## After deploying the `role` field

Run your usual Payload/DB migration (`pnpm payload migrate` or your hosting workflow) so the new column exists. Then optionally set `role` for each existing user in the admin UI.

### Grant every existing user admin (one-time)

If everyone should be **admin** until you assign content creators manually:

1. Set `DATABASE_URL` and `PAYLOAD_SECRET` (e.g. pull production env locally, or run where those are set).
2. From the project root:

   ```bash
   pnpm run users:grant-admin
   ```

   (`npm run users:grant-admin` works too.)

This updates all users so `role` is **`admin`**. Run once; new users can still be created as content creators afterward.
