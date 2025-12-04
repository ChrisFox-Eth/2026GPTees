# Contributing to GPTees

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs
1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features
1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear use case
   - Expected behavior
   - Why this would be valuable
   - Mockups or examples if applicable

### Submitting Code

#### Setup Development Environment
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/GPTees.git
cd GPTees

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Create a branch
git checkout -b feature/your-feature-name
```

#### Development Workflow
1. Make your changes
2. Test thoroughly (both backend and frontend)
3. Follow code style guidelines
4. Write/update tests if applicable
5. Update documentation
6. Commit with clear messages

#### Code Style
- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

#### Commit Messages
```
type(scope): subject

body (optional)

footer (optional)
```

Types: feat, fix, docs, style, refactor, test, chore

Examples:
- `feat(design): add new style option for AI generation`
- `fix(cart): resolve quantity update bug`
- `docs(readme): update installation instructions`

#### Pull Request Process
1. Update README if needed
2. Ensure all tests pass
3. Update CHANGELOG if applicable
4. Create PR with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Test results

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Build tests
npm run build
```

## Project Structure

### Backend
- `controllers/`: Request handlers
- `services/`: Business logic
- `middleware/`: Express middleware
- `routes/`: API routes
- `config/`: Configuration files

### Frontend
- `components/`: Reusable components
- `pages/`: Page components
- `hooks/`: Custom hooks
- `utils/`: Utility functions

## Development Tips

### Backend Development
- Use TypeScript strict mode
- Implement proper error handling
- Validate all inputs
- Use Prisma for database queries
- Log important events

### Frontend Development
- Use functional components and hooks
- Implement loading states
- Handle errors gracefully
- Follow accessibility best practices
- Optimize for performance

## Questions?

Feel free to ask questions by:
- Opening an issue
- Joining discussions
- Reaching out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
