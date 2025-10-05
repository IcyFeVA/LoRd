# LoRd System Patterns

## Architecture Overview
The LoRd application follows a modern client-server architecture with a React frontend and Convex backend:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│   Convex Backend │◄──►│   Data Storage  │
│   (Vite/TypeScript) │    │   (Functions/DB) │    │   (Convex DB)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                        │
       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   AI Services   │    │   Auth System    │
│   (OpenAI/etc)  │    │   (Convex Auth)  │
└─────────────────┘    └──────────────────┘
```

## Component Structure
### Frontend Components
- **App Component**: Main application wrapper and routing
- **Authentication Components**: SignInForm, SignOutButton
- **Deck Management**: DeckBuilder, DeckList, DeckView
- **Utility Components**: Shared UI components and helpers

### Backend Functions
- **Query Functions**: Data retrieval (listDecks, getDeck, etc.)
- **Mutation Functions**: Data modification (createDeck, updateDeck, etc.)
- **Action Functions**: Complex operations (AI processing, external API calls)
- **Internal Functions**: Private backend operations

## Data Flow Patterns
### User Authentication Flow
1. User signs in through SignInForm
2. Convex Auth handles authentication state
3. Authenticated user context flows through React context
4. Protected routes and components check auth state
5. SignOutButton handles session termination

### Deck Management Flow
1. User interacts with DeckBuilder component
2. Component calls Convex mutation functions
3. Convex validates and processes data
4. Changes are persisted to Convex database
5. Real-time updates propagate to other clients
6. UI components re-render with updated data

### AI Integration Pattern
1. User triggers AI functionality (e.g., deck analysis)
2. Frontend calls Convex action function
3. Action function gathers context and calls AI service
4. AI response is processed and stored
5. Results are returned to frontend for display

## Design Patterns in Use
### Convex Function Patterns
- **Query Pattern**: For data retrieval with proper validation
- **Mutation Pattern**: For data modification with error handling
- **Action Pattern**: For complex operations with external services
- **Internal Function Pattern**: For private backend operations

### React Component Patterns
- **Container/Presentational Pattern**: Separation of data logic and UI
- **Custom Hook Pattern**: Reusable logic encapsulation
- **Context Pattern**: Global state management (auth, theme, etc.)
- **Component Composition**: Building complex UIs from simple components

### Data Management Patterns
- **Schema-First Design**: Database schema drives application structure
- **Index-Based Queries**: Performance optimization through proper indexing
- **Validation-First Approach**: Strict input validation at function boundaries
- **Real-Time Updates**: Leveraging Convex's real-time capabilities

## Key Implementation Paths
### Authentication Implementation
- Convex Auth configuration in `convex/auth.config.ts`
- Auth provider setup in frontend
- Protected route wrappers
- User context management

### Deck Management Implementation
- Database schema for decks and cards
- CRUD operations through Convex functions
- Frontend components for user interaction
- Real-time synchronization

### AI Feature Implementation
- Action functions for AI processing
- Context gathering and preparation
- External API integration
- Result processing and storage

## Error Handling Patterns
- **Validation Errors**: Input validation at function boundaries
- **Runtime Errors**: Proper error catching and user feedback
- **Network Errors**: Graceful handling of connectivity issues
- **Auth Errors**: Proper session and permission handling

## Performance Considerations
- **Query Optimization**: Proper indexing and pagination
- **Caching**: Leveraging Convex's built-in caching
- **Bundle Size**: Code splitting and lazy loading
- **Real-Time Efficiency**: Selective subscription to data changes
