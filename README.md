# OmniForge Studio

**Universal Generative Creation Studio** - Create, manage, and export AI-generated content across multiple modalities (text, images, audio, and video) from a single unified interface.

## Features

- **Multi-Modal Content Generation**
  - 📝 **Text Tool**: Generate articles, stories, scripts, and marketing copy with advanced LLMs
  - 🎨 **Image Tool**: Create images with DALL-E integration and customizable parameters
  - 🎵 **Audio Tool**: Text-to-speech and music generation (stub for external APIs)
  - 🎬 **Video Tool**: AI-generated storyboards with frame-by-frame descriptions

- **Project Management**
  - Organize content into projects
  - Track all generated assets with version history
  - Export capabilities (Markdown, JSON, image downloads)

- **Secure Authentication**
  - Email/password authentication with NextAuth.js
  - Protected routes and API endpoints
  - User-specific workspaces

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **AI Integration**: OpenAI API (easily extensible to other providers)

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (or SQLite for local development)
- OpenAI API key

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Omniforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/omniforge"

# Or use SQLite for local development
# DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-with-openssl-rand-base64-32"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Optional: Other AI providers
# ANTHROPIC_API_KEY=""
# REPLICATE_API_KEY=""
# STABILITY_API_KEY=""
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Set up the database

#### For PostgreSQL:

```bash
# Push the schema to the database
npm run db:push

# Or run migrations
npm run db:migrate
```

#### For SQLite (local development):

Update your `.env` file:

```env
DATABASE_URL="file:./dev.db"
```

Then run:

```bash
npm run db:push
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Database Management

### View database with Prisma Studio

```bash
npm run db:studio
```

### Reset database

```bash
npx prisma db push --force-reset
```

### Create a migration

```bash
npx prisma migrate dev --name your_migration_name
```

## Project Structure

```
Omniforge/
├── app/                          # Next.js app directory
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── projects/           # Project CRUD endpoints
│   │   └── generate/           # AI generation endpoints
│   ├── auth/                   # Auth pages (signin, signup)
│   ├── dashboard/              # Dashboard pages
│   └── page.tsx                # Landing page
├── components/                  # React components
│   ├── dashboard/              # Dashboard-specific components
│   ├── tools/                  # Tool components (text, image, audio, video)
│   └── providers/              # Context providers
├── lib/                         # Utility libraries
│   ├── ai/                     # AI client abstraction layer
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma client
│   └── password.ts             # Password hashing utilities
├── prisma/                      # Database schema and migrations
│   └── schema.prisma           # Prisma schema
├── public/                      # Static assets
└── types/                       # TypeScript type definitions
```

## Usage

### 1. Create an Account

- Navigate to the signup page
- Enter your email, password, and name
- Click "Sign Up"

### 2. Create a Project

- From the dashboard, click "New Project"
- Enter a project name and optional description
- Click "Create Project"

### 3. Generate Content

Navigate to a project and use any of the four tools:

#### Text Tool
- Enter a prompt describing what you want to write
- Optionally configure advanced options (system prompt, temperature, max tokens)
- Click "Generate Text"
- Export as Markdown or JSON

#### Image Tool
- Enter a descriptive prompt
- Optionally add a negative prompt
- Select size and model
- Click "Generate Image"
- Download the generated image

#### Audio Tool
- Choose between text-to-speech or music generation
- Enter your text or music description
- Select voice (for speech)
- Click "Generate Audio"

#### Video Tool
- Enter your video concept
- Set the number of frames and duration
- Click "Generate Storyboard"
- Export the storyboard as Markdown

### 4. View History

All generated assets are automatically saved and displayed in the History panel for each tool.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Database for Production

For production, use a managed PostgreSQL database:

- **Vercel Postgres**
- **Supabase**
- **PlanetScale**
- **Railway**
- **Neon**

Update your `DATABASE_URL` environment variable with the production database URL.

## Architecture & Extensibility

### AI Client Abstraction

The AI clients are designed to be easily extensible. To add a new AI provider:

1. Create a new client file in `lib/ai/`
2. Implement the generation functions
3. Update the API routes to use the new client

Example structure:
```typescript
// lib/ai/my-new-provider.ts
export async function generateWithNewProvider(params) {
  // Implementation
}
```

### Adding New Content Types

To add a new content type:

1. Update the Prisma schema to add the new enum value
2. Create a new generation client in `lib/ai/`
3. Add a new API route in `app/api/generate/`
4. Create a new tool component in `components/tools/`
5. Add the tab to `ProjectWorkspace`

### Database Schema

The application uses three main models:

- **User**: Authentication and user data
- **Project**: User projects
- **Asset**: Generated content (flexible JSON storage for different types)

The `outputData` field in `Asset` is JSON, allowing different asset types to store different data structures.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in (handled by NextAuth)
- `POST /api/auth/signout` - Sign out (handled by NextAuth)

### Projects
- `GET /api/projects` - List all user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get single project
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Assets
- `GET /api/projects/[id]/assets` - List project assets
- `POST /api/projects/[id]/assets` - Create new asset
- `GET /api/projects/[id]/assets/[assetId]` - Get single asset
- `DELETE /api/projects/[id]/assets/[assetId]` - Delete asset

### Generation
- `POST /api/generate/text` - Generate text
- `POST /api/generate/image` - Generate image
- `POST /api/generate/audio` - Generate audio
- `POST /api/generate/video` - Generate video storyboard

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI generation | Yes |
| `ANTHROPIC_API_KEY` | (Optional) Anthropic API key | No |
| `REPLICATE_API_KEY` | (Optional) Replicate API key | No |
| `STABILITY_API_KEY` | (Optional) Stability AI API key | No |

## Troubleshooting

### Database connection issues

If you're having trouble connecting to the database:

1. Verify your `DATABASE_URL` is correct
2. Ensure PostgreSQL is running (if using PostgreSQL)
3. Try running `npx prisma db push` again
4. Check Prisma Studio: `npm run db:studio`

### OpenAI API errors

If you're getting OpenAI API errors:

1. Verify your `OPENAI_API_KEY` is correct
2. Check you have sufficient credits in your OpenAI account
3. Ensure your API key has the necessary permissions

### Build errors

If you encounter build errors:

1. Delete `.next` folder: `rm -rf .next`
2. Delete `node_modules`: `rm -rf node_modules`
3. Reinstall dependencies: `npm install`
4. Try building again: `npm run build`

## License

MIT License - feel free to use this project as a template for your own applications.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
