# LoRd Technical Context

## Technology Stack
### Frontend Technologies
- **React**: Component-based UI library
- **TypeScript**: Static typing for JavaScript
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable component library
- **React Router**: Client-side routing (implied by project structure)

### Backend Technologies
- **Convex**: Real-time backend platform
- **Convex Auth**: Authentication system
- **TypeScript**: Consistent typing across frontend and backend
- **OpenAI API**: AI functionality integration

### Development Tools
- **ESLint**: Code linting and quality enforcement
- **Prettier**: Code formatting (implied by project structure)
- **PostCSS**: CSS processing
- **npm/pnpm**: Package management
- **Git**: Version control

## Development Environment
### Prerequisites
- Node.js (version inferred from package.json)
- npm or pnpm package manager
- Modern code editor (VS Code recommended)
- Git for version control
- Convex account and CLI tools

### Setup Process
1. Clone repository
2. Install dependencies with `npm install` or `pnpm install`
3. Set up Convex project with `npx convex dev`
4. Configure environment variables for authentication and AI services
5. Run development server with `npm run dev`

### Configuration Files
- **package.json**: Project dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **vite.config.ts**: Vite build configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **eslint.config.js**: ESLint rules and configuration
- **convex/*.ts**: Convex function and schema configuration

## Key Dependencies
### Frontend Dependencies
- `react`, `react-dom`: Core React libraries
- `@vitejs/plugin-react`: Vite React plugin
- `tailwindcss`: CSS framework
- `@tailwindcss/typography`: Typography plugin
- `@tailwindcss/forms`: Form styling plugin
- `autoprefixer`: CSS vendor prefixing
- `postcss`: CSS processing
- `lucide-react`: Icon library
- `class-variance-authority`: Component styling utility
- `clsx`: Conditional class utility
- `tailwind-merge`: Class merging utility

### Backend Dependencies
- `convex`: Core Convex SDK
- `@convex-dev/auth`: Authentication library
- `openai`: OpenAI API client
- `@ts-reset`: TypeScript utilities

### Development Dependencies
- `typescript`: TypeScript compiler
- `@types/*`: TypeScript type definitions
- `eslint`: Linting tool
- `globals`: Global variable definitions
- `vite`: Build tool
- `@types/node`: Node.js type definitions

## Convex Integration
### Function Structure
- **Queries**: Data retrieval functions (`convex/*.ts`)
- **Mutations**: Data modification functions (`convex/*.ts`)
- **Actions**: Complex operations and external API calls (`convex/*.ts`)
- **Internal Functions**: Private backend operations (`convex/*.ts`)

### Schema Design
- **Tables**: Defined in `convex/schema.ts`
- **Indexes**: Performance optimization through proper indexing
- **Validators**: Runtime type checking with `convex/values`

### Authentication
- **Providers**: Configured in `convex/auth.config.ts`
- **Integration**: Implemented in `convex/auth.ts`
- **Frontend**: Authentication components in `src/SignInForm.tsx`, `src/SignOutButton.tsx`

## AI Integration
### OpenAI Integration
- **Client**: OpenAI SDK integration in Convex actions
- **Functions**: AI processing in `convex/ai.ts`
- **Context**: Data gathering for AI prompts
- **Results**: Processing and storage of AI responses

## Testing Strategy
### Current Testing Approach
- Manual testing during development
- Convex function testing through dashboard
- UI component testing through browser

### Planned Testing Improvements
- Unit tests for React components
- Integration tests for Convex functions
- End-to-end tests for critical user flows
- AI functionality testing with mock responses

## Deployment Considerations
### Convex Deployment
- Automatic deployment through Convex CLI
- Environment variable management
- Function versioning and rollback

### Frontend Deployment
- Static site deployment (Vercel, Netlify, etc.)
- Environment variable configuration
- Asset optimization and CDN delivery

## Performance Optimization
### Frontend Optimization
- Code splitting and lazy loading
- Bundle size monitoring
- Image optimization
- Caching strategies

### Backend Optimization
- Database indexing
- Query optimization
- Function caching
- Real-time subscription efficiency

## Security Considerations
- Authentication and authorization
- Input validation and sanitization
- Environment variable security
- Secure API key management
- Data privacy and compliance
