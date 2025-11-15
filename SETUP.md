# OmniForge Studio - Setup Guide

This guide will help you get OmniForge Studio up and running.

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

If you encounter Prisma engine download issues, use:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

If you encounter 403 errors downloading Prisma engines, try:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

Or wait a few minutes and try again (Prisma CDN issues are usually temporary).

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update these critical values:

```env
# Database (using SQLite for local development)
DATABASE_URL="file:./dev.db"

# Generate a secure secret
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Add your OpenAI API key
OPENAI_API_KEY="sk-your-actual-openai-key-here"
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Initialize the Database

```bash
npx prisma db push
```

This will create the SQLite database file and apply the schema.

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

1. **Create an Account**: Navigate to the signup page and create your first user account
2. **Create a Project**: From the dashboard, click "New Project"
3. **Generate Content**: Select your project and try out the different tools (Text, Image, Audio, Video)

## Using PostgreSQL Instead of SQLite

For production or if you prefer PostgreSQL for local development:

### 1. Update the Prisma Schema

Edit `prisma/schema.prisma` and change the datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Also update the Asset model to use native JSON:

```prisma
model Asset {
  // ... other fields ...
  outputData  Json      // Change from String to Json
  metadata    Json?     // Change from String? to Json?
  // ... other fields ...
}
```

### 2. Update the .env File

```env
DATABASE_URL="postgresql://user:password@localhost:5432/omniforge"
```

### 3. Run Migrations

```bash
npx prisma db push
# or
npx prisma migrate dev --name init
```

## Troubleshooting

### Prisma Engine Download Issues

If you're having trouble downloading Prisma engines:

**Option 1: Ignore Checksum Validation**
```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
npx prisma generate
```

**Option 2: Use Pre-built Binaries**
```bash
npx prisma generate --skip-engine
```

**Option 3: Wait and Retry**
Sometimes Prisma's CDN has temporary issues. Wait 5-10 minutes and try again.

### Database Connection Errors

**For SQLite:**
- Make sure the `DATABASE_URL` in `.env` is set to `file:./dev.db`
- Delete `dev.db` and run `npx prisma db push` again

**For PostgreSQL:**
- Verify PostgreSQL is running: `pg_isready`
- Check your connection string is correct
- Ensure the database exists: `createdb omniforge`

### OpenAI API Errors

**Authentication Failed:**
- Verify your `OPENAI_API_KEY` in `.env` is correct
- Ensure you have credits in your OpenAI account
- Check your API key has the necessary permissions

**Rate Limit Errors:**
- You're making too many requests. Wait a moment and try again
- Consider upgrading your OpenAI plan

### Next.js Build Errors

If you encounter build errors:

```bash
# Clean everything
rm -rf .next node_modules

# Reinstall
npm install

# Generate Prisma client
npx prisma generate

# Try building
npm run build
```

## Development Tips

### View and Edit Database

Use Prisma Studio to view and edit your database:

```bash
npm run db:studio
```

This opens a web interface at [http://localhost:5555](http://localhost:5555)

### Reset Database

To start fresh:

```bash
rm dev.db
npx prisma db push
```

### TypeScript Errors

If you're seeing TypeScript errors after changing the schema:

1. Generate Prisma client: `npx prisma generate`
2. Restart your TypeScript server in your IDE
3. Restart the dev server: `npm run dev`

## Production Deployment

See the main [README.md](./README.md) for deployment instructions to Vercel and other platforms.

## Getting Help

- Check the [README.md](./README.md) for more information
- Review Prisma docs: https://www.prisma.io/docs
- Review Next.js docs: https://nextjs.org/docs
- Check OpenAI API docs: https://platform.openai.com/docs

## Next Steps

Once you have the app running:

1. Explore the four content generation tools
2. Try exporting your generated content
3. Review the code structure in `README.md`
4. Start customizing for your needs!
