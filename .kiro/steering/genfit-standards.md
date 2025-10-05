# GenFit Project Standards

## Code Style and Architecture

### Frontend (React/TypeScript)
- Use TypeScript for all new components with proper typing
- Follow existing API client pattern using GFapi
- Implement proper error handling with try-catch blocks
- Use React hooks for state management
- Follow existing component structure and naming conventions
- Ensure responsive design for mobile and desktop

### API Integration
- Use the existing GFapi client for all HTTP requests
- Follow the established API response patterns
- Implement proper loading states and error handling
- Use existing API types and extend them as needed

### File Organization
- Components go in `src/components/` or feature-specific folders
- API types in `src/lib/types/api.ts`
- Custom hooks in `src/hooks/` or component-specific folders
- Follow existing folder structure patterns

### Design Consistency
- Reference existing Goals page for design patterns
- Use consistent styling and component structure
- Ensure proper accessibility compliance
- Follow existing color scheme and typography

### Security and Permissions
- Implement proper user type checking (User vs Coach)
- Use existing authentication patterns
- Handle CSRF tokens through GFapi client
- Validate user permissions on both frontend and backend

## Backend (Django)
- **CRITICAL: ALWAYS USE EXISTING BACKEND APIs** - Never create new endpoints
- Follow existing API view patterns
- Use proper serializers for data validation
- Implement appropriate permissions classes
- Follow RESTful API conventions
- Use existing authentication system

## API Integration Requirements
- **MANDATORY: Use existing backend endpoints exactly as implemented**
- All challenge functionality uses `/api/challenges/` endpoints
- Never modify existing API endpoints or create new ones
- Follow the documented API contracts and response formats
- Use proper error handling for existing API responses

## W3C Standards Compliance

### WCAG 2.1 AA Accessibility
- Provide text alternatives for all non-text content
- Ensure minimum 4.5:1 color contrast ratio
- Support full keyboard navigation
- Use proper ARIA labels and roles
- Test with screen readers and assistive technologies

### Internationalization (i18n)
- Use standard language tags (BCP 47)
- Support both LTR and RTL text directions
- Apply locale-appropriate formatting for dates and numbers
- Externalize all user-facing strings for translation

## Smart Environment Design Principles

### Inclusive Design
- Design for widest possible range of users
- Consider ability, language, culture, age, and background
- Favor solutions usable without special adaptation

### Community Health
- Foster collaboration and constructive dialogue
- Encourage diverse participation
- Provide mechanisms for reporting harmful behavior
- Implement fair and transparent moderation processes

### Valuing Contributions
- Recognize positive contributions through feedback systems
- Provide visible impact and recognition mechanisms
- Encourage participation through community engagement

## Ethics & Data Protection

### Privacy by Design
- Collect only minimum necessary data
- Implement user consent and control mechanisms
- Apply anonymization where possible
- Provide clear data use transparency

### Security & Protection
- Use encryption for data in transit and at rest
- Implement strong access controls
- Plan for safe data retention and deletion
- Regular security audits and updates

### Fairness & Non-Discrimination
- Avoid reinforcing biases in algorithms
- Ensure equitable access across demographics
- Regular auditing for unintended harms
- Document assumptions and limitations