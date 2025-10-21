# React Full-Stack Template

A modern, production-ready template for building full-stack web applications with React 18, TypeScript, Tailwind CSS, Node.js, and Express. This template provides a solid foundation for new projects with established patterns, best practices, and comprehensive documentation.

## 🚀 Features

### Frontend
- **React 18** with TypeScript (strict mode)
- **Vite 5+** for blazingly fast development and builds
- **Tailwind CSS 4+** with dark mode support
- Component-based architecture with clear naming conventions
- Path aliases for clean imports
- Global state management via React Context and hooks
- Built-in dark/light theme toggle

### Backend
- **Node.js 18+** with Express.js
- **TypeScript** with ESM module support
- MVC-style architecture (Models, Views/Routes, Controllers)
- Organized services layer for business logic
- CORS and security middleware setup
- Environment variable management with dotenv

### Development
- ESLint and Prettier for code quality
- Comprehensive JSDoc documentation standards
- Monorepo structure with easy dependency management
- Concurrent dev server startup for full-stack development

### Deployment
- Vercel-ready frontend static build
- Heroku-ready backend with Procfile
- Environment-based configuration

## 📋 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18+ |
| Frontend Build | Vite | 5+ |
| Frontend Styling | Tailwind CSS | 4+ |
| Frontend Language | TypeScript | 5+ |
| Backend | Express.js | 4+ |
| Backend Language | TypeScript | 5+ |
| Backend Runtime | Node.js | 18+ |
| Package Manager | npm/yarn | - |

## 📂 Project Structure

```
root/
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Button/              # Example: Button component with types
│   │   │   ├── Header/              # App header with theme toggle
│   │   │   └── Hero/                # Landing page hero section
│   │   ├── pages/                   # Page components (for routing)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utility functions
│   │   ├── types/                   # Global TypeScript types
│   │   ├── styles/                  # Global and component styles
│   │   ├── assets/                  # Images, fonts, etc.
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Root App component
│   │   └── index.css                # Global CSS with Tailwind directives
│   ├── index.html                    # HTML template
│   ├── vite.config.ts               # Vite configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── .eslintrc.json               # ESLint configuration
│   ├── .prettierrc.json             # Prettier configuration
│   └── package.json                 # Frontend dependencies
│
├── backend/                           # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   │   └── health.controller.ts # Example: Health check controller
│   │   ├── routes/                  # API route definitions
│   │   │   └── health.routes.ts     # Example: Health check routes
│   │   ├── services/                # Business logic layer
│   │   │   └── example.service.ts   # Example: Service pattern
│   │   ├── models/                  # Data models/schemas
│   │   │   └── example.model.ts     # Example: Model pattern
│   │   ├── middlewares/             # Express middlewares
│   │   │   └── example.middleware.ts # Example: Middleware pattern
│   │   ├── types/                   # TypeScript types
│   │   └── index.ts                 # Server entry point
│   ├── dist/                         # Compiled JavaScript (after build)
│   ├── tsconfig.json                # TypeScript configuration
│   ├── .eslintrc.json               # ESLint configuration
│   ├── .prettierrc.json             # Prettier configuration
│   ├── Procfile                      # Heroku deployment configuration
│   └── package.json                 # Backend dependencies
│
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── Procfile                           # Heroku deployment (backend)
├── package.json                       # Root package.json (convenience scripts)
└── README.md                          # This file
```

## 🎯 Getting Started

### Prerequisites
- **Node.js** 18 or higher
- **npm** 9+ or **yarn** 3+

### Installation

1. **Clone or use this template**
   ```bash
   # Using this template from GitHub
   git clone <repository-url>
   cd reactTemplate
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   # Just run npm install from root - it automatically installs frontend and backend deps
   npm install

   # This runs the postinstall script which installs:
   # - Root dependencies (concurrently)
   # - Backend dependencies
   # - Frontend dependencies
   # All in one command!

   # Alternative: Install individually (if needed)
   npm install --prefix frontend
   npm install --prefix backend
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env with your configuration
   # At minimum, you may need to verify FRONTEND_URL and PORT
   ```

4. **Start development servers**
   ```bash
   # Option 1: Run both concurrently (recommended)
   npm run dev

   # Option 2: Run separately in different terminals
   # Terminal 1 - Backend
   npm run dev --prefix backend

   # Terminal 2 - Frontend
   npm run dev --prefix frontend
   ```

5. **Open in browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 📦 Available Scripts

### Root Scripts
Execute from the repository root to manage both frontend and backend:

```bash
npm install             # Installs root dependencies + automatically runs postinstall
                        # which installs frontend and backend dependencies
npm run dev             # Start both frontend and backend dev servers concurrently
npm run build           # Build both frontend and backend for production
npm run lint            # Run ESLint on both frontend and backend
npm run lint:fix        # Fix ESLint issues in both frontend and backend
npm run type-check      # Check TypeScript types in both frontend and backend
```

**How it works:**
- `npm install` installs the root package's dependencies (concurrently)
- It automatically triggers the `postinstall` script which then installs frontend and backend dependencies
- This means a single `npm install` command sets up everything!

### Frontend Scripts
Execute from the `frontend/` directory:

```bash
npm run dev             # Start Vite dev server (hot-reload)
npm run build           # Build for production (creates dist/ folder)
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Check TypeScript types
```

### Backend Scripts
Execute from the `backend/` directory:

```bash
npm run dev             # Start development server with auto-reload (nodemon)
npm run build           # Compile TypeScript to JavaScript (outputs to dist/)
npm start               # Start production server (from compiled code)
npm run start:prod      # Start with NODE_ENV=production
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Check TypeScript types
```

## 🎨 Frontend Development

### Component Structure

Components follow a consistent structure for maintainability:

```
Button/
├── Button.tsx              # Component implementation
├── Button.types.ts         # TypeScript prop interfaces and types
├── Button.stories.tsx      # (Optional) Storybook stories
└── index.ts               # Exports for easy imports
```

**Creating a new component:**

1. Create a folder in `src/components/` (e.g., `Card`)
2. Create `Card.types.ts` with prop interfaces:
   ```typescript
   /**
    * @module components/Card/Card.types
    * @description Type definitions for the Card component
    * @since 2025-10-20
    */

   export interface CardProps {
     title: string;
     description?: string;
     isActive?: boolean;
   }
   ```

3. Create `Card.tsx` with comprehensive JSDoc:
   ```typescript
   /**
    * @module components/Card/Card
    * @description A reusable card component
    * @component
    * @param {CardProps} props - Card component props
    * @returns {JSX.Element} Rendered card
    * @example
    * <Card title="Hello" description="World" />
    * @since 2025-10-20
    */

   import { CardProps } from './Card.types';

   export default function Card({ title, description, isActive }: CardProps): JSX.Element {
     return (
       <div className={`p-4 rounded-lg border ${isActive ? 'border-primary-500' : 'border-gray-200'}`}>
         <h3 className="font-bold text-lg">{title}</h3>
         {description && <p className="text-gray-600">{description}</p>}
       </div>
     );
   }
   ```

4. Create `index.ts` for clean exports:
   ```typescript
   export { default as Card } from './Card';
   export type { CardProps } from './Card.types';
   ```

### Naming Conventions

- **Components**: PascalCase (e.g., `Button.tsx`, `UserCard.tsx`)
- **Component files**: Match component name (e.g., folder `Button/`, file `Button.tsx`)
- **Boolean props**: Use `is` or `has` prefix (e.g., `isDisabled`, `hasError`)
- **Event handlers**: Use `on` prefix (e.g., `onClick`, `onSubmit`, `onToggle`)
- **Other files**: camelCase (e.g., `utils.ts`, `hooks.ts`)

### Styling with Tailwind CSS

This template uses Tailwind CSS's utility-first approach:

```jsx
// ✅ Preferred: Use Tailwind utilities directly
<button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
  Click Me
</button>

// Use conditional classes for variants
const buttonClass = isActive ? 'bg-primary-600' : 'bg-gray-300';

// Or use a helper function
const getButtonClasses = (variant: 'primary' | 'secondary') => {
  switch (variant) {
    case 'secondary':
      return 'bg-secondary-600 hover:bg-secondary-700';
    default:
      return 'bg-primary-600 hover:bg-primary-700';
  }
};
```

### Dark Mode

Dark mode is built-in and uses Tailwind's `dark:` variant:

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content that adapts to theme
</div>
```

Toggle dark mode by adding/removing the `dark` class on the root element. The App component provides a theme toggle button in the header.

### Importing Components

Use path aliases defined in `tsconfig.json` for clean imports:

```typescript
// ✅ Preferred: Using aliases
import { Button } from '@components/Button';
import { useCustomHook } from '@hooks/useCustomHook';
import { formatDate } from '@utils/dateUtils';

// ❌ Avoid: Relative imports
import { Button } from '../../../components/Button';
```

## 🔧 Backend Development

### Architecture Pattern

The backend follows an MVC-inspired architecture:

```
Routes → Controllers → Services → Models (Database)
  ↑           ↑           ↑          ↑
Routes define API endpoints
Controllers handle requests and responses
Services contain business logic
Models define data structures
```

### Creating API Routes

**1. Define routes** (`src/routes/users.routes.ts`):
```typescript
/**
 * @module routes/users
 * @description User API routes
 * @since 2025-10-20
 */

import { Router } from 'express';
import * as userController from '@controllers/user.controller.js';

const router = Router();

/**
 * GET /api/users/:id
 * Get a user by ID
 */
router.get('/:id', userController.getUserById);

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', userController.createUser);

export default router;
```

**2. Create controllers** (`src/controllers/user.controller.ts`):
```typescript
/**
 * @module controllers/user
 * @description User request handlers
 * @since 2025-10-20
 */

import { Request, Response } from 'express';
import * as userService from '@services/user.service.js';

/**
 * Get user by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {void}
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create new user
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {void}
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create user' });
  }
};
```

**3. Implement services** (`src/services/user.service.ts`):
```typescript
/**
 * @module services/user
 * @description User business logic
 * @since 2025-10-20
 */

export const getUserById = async (id: string) => {
  // Replace with actual database query
  // const user = await UserModel.findById(id);
  return { id, name: 'Example User' };
};

export const createUser = async (userData: any) => {
  // Replace with actual database insert
  // const user = await UserModel.create(userData);
  return userData;
};
```

**4. Register routes** in `src/index.ts`:
```typescript
import userRoutes from '@routes/users.routes.js';
app.use('/api/users', userRoutes);
```

### Environment Variables

Backend environment variables are loaded from `.env` via `dotenv`:

```typescript
// Access in your code
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET!; // Using non-null assertion
```

Required/common variables (see `.env.example`):
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `DATABASE_URL` - Database connection string (if using database)
- `JWT_SECRET` - Secret for JWT signing (if implementing auth)

## 📚 Code Documentation (JSDoc)

All code should include comprehensive JSDoc comments. The template includes examples in key files.

### Component JSDoc Example

```typescript
/**
 * @module components/Button/Button
 * @description A reusable button component with multiple variants
 * @component
 * @param {ButtonProps} props - {@link Button.types.ts|ButtonProps} for button
 * @returns {JSX.Element} A styled button element
 * @example
 * <Button onClick={() => alert('clicked')}>Click Me</Button>
 * @since 2025-10-20
 * @version 1.0.0
 * @author Your Name
 * @features
 * - Multiple color variants
 * - Three size options
 * - Loading state support
 * @status Active
 * @category UI Components
 */
```

### Function JSDoc Example

```typescript
/**
 * Format date to human-readable string
 * @param {Date} date - The date to format
 * @param {string} [format='short'] - Format style: 'short' or 'long'
 * @returns {string} Formatted date string
 * @throws {Error} If date is invalid
 * @example
 * const formatted = formatDate(new Date(), 'short');
 * // Returns: "10/20/2025"
 * @since 2025-10-20
 */
export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  // Implementation
}
```

**Common JSDoc Tags:**
- `@module` - File/module identifier
- `@description` - What the function/component does
- `@param` - Parameter documentation
- `@returns` - Return value documentation
- `@throws` - Exceptions that might be thrown
- `@example` - Usage examples
- `@since` - When it was added
- `@version` - Version number
- `@deprecated` - If deprecated, with migration info
- `@see` - Related documentation links
- `@category` - Functional category
- `@status` - Active/Draft/Deprecated

## 🚀 Deployment

### Deploying Frontend to Vercel

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Create new project and select your repository
4. Configure settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:** Set `VITE_API_URL` to your backend URL
5. Deploy!

### Deploying Backend to Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   # Set other required variables
   ```
5. Deploy: `git push heroku main`

The included `Procfile` tells Heroku how to start the backend server.

## 🔄 Workflow

### Adding a New Feature

1. **Create a frontend component** (if UI-related):
   - Add component to `frontend/src/components/`
   - Follow the component structure pattern
   - Export via `index.ts`

2. **Create backend routes and controllers** (if backend needed):
   - Add route definition to `src/routes/`
   - Create controller in `src/controllers/`
   - Implement service in `src/services/`
   - Register route in `src/index.ts`

3. **Connect frontend to backend**:
   - Use Vite proxy or fetch to `/api/...` endpoints
   - Handle loading and error states

4. **Test and lint**:
   ```bash
   npm run lint:fix    # Fix formatting
   npm run type-check  # Check types
   npm run build       # Test production build
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add new feature: description"
   git push
   ```

## 🛠️ Customization

### Project Name

Update in multiple places:

1. `frontend/package.json`: `"name": "your-app-name"`
2. `backend/package.json`: `"name": "your-app-name-backend"`
3. `package.json`: `"name": "your-app-name"`
4. `frontend/index.html`: `<title>` tag

### Colors and Theming

Edit `frontend/tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Customize primary color palette
        600: '#YOUR_COLOR',
        700: '#YOUR_COLOR',
      },
    },
  },
}
```

### Adding Database (MongoDB + Mongoose)

1. Install: `npm install mongoose --prefix backend`
2. Create `backend/src/db/connection.ts`:
   ```typescript
   import mongoose from 'mongoose';

   export const connectDB = async () => {
     const conn = await mongoose.connect(process.env.DATABASE_URL!);
     console.log(`✓ MongoDB connected: ${conn.connection.host}`);
   };
   ```
3. Call in `backend/src/index.ts`:
   ```typescript
   import { connectDB } from '@/db/connection.js';
   connectDB().catch(console.error);
   ```

### Adding Authentication (JWT)

1. Install: `npm install jsonwebtoken --prefix backend`
2. Create `backend/src/middlewares/auth.middleware.ts`
3. Use in protected routes
4. See `example.middleware.ts` for pattern

### Adding Testing

**Frontend (Jest + React Testing Library):**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom --prefix frontend
```

**Backend (Jest):**
```bash
npm install --save-dev jest @types/jest ts-jest --prefix backend
```

## 📖 Additional Resources

- [React 18 Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Express.js Documentation](https://expressjs.com)
- [Node.js Documentation](https://nodejs.org)

## 🤝 Contributing

When contributing to this template:

1. Follow the established naming conventions
2. Add comprehensive JSDoc comments
3. Maintain consistent code style (ESLint will help)
4. Test your changes thoroughly
5. Update README if adding new features

## 📝 License

This template is provided as-is for use in your projects.

## 🙏 Acknowledgments

This template is inspired by best practices from production applications and combines patterns that have proven effective for full-stack development. Special thanks to the React, TypeScript, Tailwind CSS, and Node.js communities for creating excellent tools.

---

**Happy coding! 🚀**

Start building your project with this template and let the established structure guide your development!