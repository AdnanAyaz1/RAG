# Frontend Feature Implementation

---

# 1. Feature Information

Feature Name:
Tenant Dashboard and Document Management

Sprint:
Sprint 3

Developer:
(To be assigned)

Status:
In Progress

---

# 2. User Workflow

Tenant Admin logs in ->
System validates JWT tokens (access + refresh) and decodes tenant_id ->
Middleware redirects to /dashboard if authenticated, /login if not ->
Dashboard loads with tenant overview (document count, recent activity, storage usage) ->
Admin clicks Upload button ->
Drag-and-drop zone opens, file selected ->
File sent to NestJS backend via multipart/form-data ->
Backend validates file type (PDF/DOCX/TXT) and size (max 50MB) ->
Backend generates S3 presigned URL for direct upload ->
Frontend uploads file to Oracle Cloud Object Storage via presigned URL ->
Frontend notifies backend of upload completion ->
Backend creates document record with status uploaded ->
Backend pushes document_processing job to Upstash Redis/BullMQ queue ->
Frontend shows processing progress with status badge ->
Backend Python RAG microservice processes document (parse -> chunk -> embed -> Qdrant index) ->
Status changes to indexed ->
Admin can now search documents in the Search view ->
Admin enters natural language query ->
Frontend sends POST /search to NestJS API (tenant_id from JWT) ->
NestJS forwards query to Python RAG microservice via HTTP ->
RAG microservice embeds query, searches Qdrant (tenant namespace), calls Google Gemini LLM ->
Grounded answer with citations returned to frontend ->
Frontend displays answer with clickable source document links ->
Query and answer stored in Conversations table ->
Previous searches accessible in Conversation History sidebar

---

# 3. Pages Created

| Page | Purpose |
|------|---------|
| /login | Authentication with email and password |
| /signup | Tenant registration for new organizations |
| /dashboard | Tenant overview, storage usage, recent activity |
| /documents | Document list with status badges, upload, search, filter |
| /documents/upload | Drag-and-drop file upload with progress |
| /documents/[id] | Document detail with processing status |
| /search | Natural language query interface with RAG answers |
| /conversations | List of past search sessions |
| /conversations/[id] | Full conversation with queries and responses |
| /team | Tenant member management with role assignment |
| /invitations | Pending invitations and invite history |
| /settings | Tenant configuration (chunk size, embedding model) |
| /api-keys | API key management (create, revoke, display once) |
| /profile | User profile update and password change |
| /invite/accept/[token] | Invitation acceptance with role selection |
| /404 | Custom not-found page |
| /unauthorized | Permission denied page |

---

# 4. Components Created

| Component | Responsibility |
|-----------|----------------|
| Layout | Sidebar navigation (collapsible), header with tenant name and user menu, main content outlet |
| ProtectedRoute | Middleware that checks JWT and redirects unauthenticated users to /login |
| AuthForm | Login form with email/password fields, validation, error display |
| SignupForm | Tenant registration with tenant name, admin details, password strength indicator |
| DataTable | Sortable, filterable, paginated table for document lists and team members |
| UploadZone | Drag-and-drop file upload with progress bar, type validation, size warning |
| StatusBadge | Color-coded status indicator (processing=amber, indexed=green, failed=red, archived=gray) |
| SearchInput | Query input field with auto-focus, enter-to-submit |
| AnswerCard | Displays RAG answer with source citations as clickable document links |
| SourceLink | Shows document name and chunk preview, links to document detail |
| Toast | Animated notification (success/error/info/warning) with auto-dismiss |
| ConfirmDialog | Modal dialog for destructive actions (delete document, remove user) |
| LoadingSpinner | Full-page overlay spinner during page loads, inline spinner for table loading |
| EmptyState | Illustrated placeholder for empty lists with action button |
| ErrorBoundary | React error boundary that catches component errors with branded fallback |
| Pagination | Page controls with prev/next and page number buttons |
| SidebarNav | Role-aware sidebar menu that shows/hides navigation based on user role |

---

# 5. API Integration

| Endpoint | Purpose | Method |
|----------|---------|--------|
| POST /auth/signup | Create tenant and admin account | POST |
| POST /auth/login | Authenticate and receive JWT tokens | POST |
| POST /auth/refresh | Refresh expired access token | POST |
| POST /auth/logout | Invalidate refresh token | POST |
| GET /tenants/me | Get current tenant profile | GET |
| PATCH /tenants/me | Update tenant settings | PATCH |
| GET /tenants/me/members | List tenant members | GET |
| POST /tenants/me/invitations | Invite user to tenant | POST |
| POST /documents/upload | Upload a new document file | POST (multipart) |
| GET /documents | List tenant documents (paginated) | GET |
| GET /documents/:id | Get document details and status | GET |
| DELETE /documents/:id | Delete or archive a document | DELETE |
| POST /documents/:id/reprocess | Trigger document reprocessing | POST |
| POST /search | Submit natural language query to RAG pipeline | POST |
| GET /search/history | List past search queries | GET |
| GET /conversations | List conversation sessions | GET |
| POST /conversations | Create new conversation session | POST |
| GET /api-keys | List API keys for tenant | GET |
| POST /api-keys | Create new API key | POST |
| DELETE /api-keys/:id | Revoke an API key | DELETE |
| GET /users/me | Get current user profile | GET |
| PATCH /users/me | Update user profile | PATCH |

---

# 6. State Management

## Local State (useState / useReducer)

- Search query input value (controlled input)
- Upload progress percentage for active document upload
- Modal visibility (delete confirmation, invite dialog, API key reveal)
- Pagination state (current page, items per page)
- Active conversation session ID
- Document detail expand/collapse state

## Global State (Zustand)

- Authenticated user info: userId, tenantId, role, displayName
- JWT tokens: accessToken, refreshToken with background auto-refresh
- Tenant context: tenantId, tenantName, plan, settings (chunk size, embedding model)
- Notification preferences (email on invite, processing complete)
- Sidebar collapsed state (persisted in localStorage)

## Server State (React Query)

- Cached document list with infinite pagination and stale-while-revalidate
- Cached search results with 5-minute TTL (same query returns cached result briefly)
- Cached conversation history with background refetch
- Cached tenant settings (refetched on settings page focus)
- API key list (mutated on create/revoke, cache invalidated)
- User profile data (refetched on profile page focus)
- Tenant member list (refetched on team page focus)

---

# 7. Forms

## Forms Implemented:

- Login (email + password)
- Tenant signup (tenantName, adminEmail, adminPassword, displayName, confirmPassword)
- Document upload (file picker with drag-and-drop, progress bar)
- Search query input (natural language text area)
- Profile update (displayName)
- Password change (currentPassword, newPassword, confirmNewPassword)
- Invite user (email, role selection)
- Tenant settings update (chunk size, embedding model preference)

## Validation:

- Email format validated with regex on blur
- Password minimum 8 characters with at least one letter and one number
- Password strength indicator (weak/fair/strong/good)
- Password must match confirmation field
- Tenant name required, max 255 characters
- Display name required, max 255 characters
- File size limit displayed before upload attempt (50 MB maximum)
- File type validated on picker (accept PDF, DOCX, TXT only)
- Search query minimum 1 character after trimming whitespace
- Required field indicators (*) on all mandatory fields
- Real-time inline validation on blur events
- All form errors displayed inline next to the relevant field

## Error Handling:

- API errors shown as toast notifications with user-friendly descriptions
- Form-level errors displayed inline next to the relevant input field
- 401 Unauthorized triggers automatic logout and redirect to login page
- 403 Forbidden shows permission-denied toast
- 422 Unprocessable Entity displays field-level validation from backend Pydantic schema
- 429 Too Many Requests shows rate-limit message with countdown
- 500 Internal Server Error shows generic error with retry option
- Network errors (offline, timeout) detected with offline-aware messaging
- Error boundary catches unexpected rendering errors with branded fallback and reload button

---

# 8. Authentication

## Protected Routes (Next.js Middleware):

- /dashboard -> requires valid JWT
- /documents -> requires valid JWT
- /search -> requires valid JWT
- /conversations -> requires valid JWT
- /settings -> requires valid JWT
- /team -> requires valid JWT (Tenant Admin)
- /invitations -> requires valid JWT (Tenant Admin)
- /api-keys -> requires valid JWT
- /profile -> requires valid JWT
- /invite/accept/:token -> no auth required (token-based acceptance)
- /login, /signup -> no auth required (redirect to dashboard if already authenticated)
- All other routes -> redirect to /dashboard

## Permissions (Role-Based UI Rendering):

### Tenant Admin Can:
- Upload, delete, and reprocess all tenant documents
- Manage team members (invite, remove, change roles)
- View and manage tenant settings
- Create, view, and revoke API keys
- View all conversations for the tenant
- Access admin-only sidebar navigation items

### End User Can:
- Search tenant documents and view RAG answers
- View own conversation history
- Update own profile (display name, password)
- View own documents list (cannot perform admin actions)
- Basic settings (profile only, no tenant configuration)

### Platform Admin Can:
- View admin panel with all tenants overview
- Monitor system health metrics
- View system-wide usage and error metrics
- Access admin navigation items (hidden from tenant users)

## Token Management:
- Access token stored in memory (not localStorage) for XSS protection
- Refresh token stored in HTTP-only, Secure, SameSite=Strict cookie
- React Query interceptor checks token expiry before each API call
- Auto-refresh triggered silently 1 minute before expiry
- Failed refresh triggers automatic logout and redirect to login
- Tab visibility change triggers token refresh check to catch stale tokens after tab switch

---

# 9. Responsive Design

### Desktop (above 1024px)
Full dashboard layout with collapsible sidebar navigation, main content area with two-column layouts for document lists (table view), full-width search interface with source citations displayed inline alongside the answer, sticky header showing tenant name and user avatar menu, hover-activated sidebar submenu items, hover tooltips on icons, data tables with inline action buttons per row.

### Tablet (768px - 1024px)
Sidebar collapses to hamburger-triggered overlay menu, search results stack vertically instead of side-by-side, document table switches to compact card view with key fields visible, two-column layouts collapse to single column, upload zone remains full-width but with smaller padding, action buttons move to a dropdown menu per row to save horizontal space, sidebar width reduced with icon-only mode.

### Mobile (below 768px)
Hamburger menu as primary navigation, full-width cards for all content types, search bar fixed at top of viewport, document upload uses native file picker with compact progress indicator at top of screen, answer cards stack vertically with source citations expandable below each answer via tap, toast notifications slide in from bottom of screen, touch-friendly tap targets (minimum 44px height), all modals are full-screen on mobile, pagination uses previous/next arrows only (no page number buttons), sticky header with hamburger toggle and tenant name truncated with ellipsis.

---

# 10. Testing

## UI Component Testing (Vitest + Testing Library)

- Form validation rules trigger correctly on blur and submit
- Protected routes redirect unauthenticated users to /login
- Toast notifications display and auto-dismiss after configurable timeout
- ConfirmDialog open/close works with backdrop click and Escape key
- Loading spinner appears during all async operations
- Empty state renders for lists with no data (documents, conversations, API keys)
- Error boundary catches component errors and displays branded fallback UI
- Responsive breakpoint changes trigger correct layout switches
- Role-based menu items render correctly for tenant_admin vs end_user
- Search result citations are clickable and navigate to document detail

## Integration Testing (Playwright)

- Login flow: submit credentials -> receive JWT -> redirect to dashboard
- Document upload: select file -> progress bar visible -> success toast -> document appears in list
- Search flow: enter query -> show loading skeleton -> receive answer with citations -> display in UI
- Token refresh: access token expires mid-session -> auto-refresh -> continue seamlessly
- Logout: click logout -> clear tokens -> redirect to login -> subsequent API calls return 401
- Cross-tenant attempt: Tenant A user tamper with URL to Tenant B document -> get 403
- Register new tenant: signup -> auto-login -> redirect to dashboard
- Invitation flow: invite user -> user opens link -> accept role -> login with new account

## Manual Testing

- Cross-browser testing: Chrome 120+, Firefox 120+, Edge 120+, Safari 17+
- Responsive testing: Chrome DevTools device emulation for all breakpoints (mobile, tablet, desktop)
- Touch interaction testing: swipe gestures, tap targets, long-press on mobile viewport
- Visual regression: screenshot comparisons for key pages across breakpoints

### Responsive Testing Devices

- Mobile: iPhone SE, iPhone 14 Pro, Galaxy S23 (Chrome DevTools emulation)
- Tablet: iPad Air, Surface Pro (Chrome DevTools emulation)
- Desktop: 1920x1080, 1440x900, 1280x720 (Chrome DevTools emulation)

## Accessibility Testing

- Keyboard-only navigation through all pages and modals
- Screen reader testing with NVDA (Windows) and VoiceOver (macOS/iOS)
- Color contrast ratio verification (minimum 4.5:1 for text, 3:1 for large text)
- Focus indicator visibility on all interactive elements
- ARIA labels on all icon buttons and navigation elements
- Focus trap inside all modal dialogs
- Alt text on all meaningful icons and illustrations
- Form field labels associated with inputs via htmlFor attribute

---

# 11. Completion Checklist

- [ ] UI components completed and styled with Tailwind + shadcn/ui
- [ ] API client integrated with React Query (TanStack Query)
- [ ] Form validation added on all input forms with inline error messages
- [ ] Loading states (spinners, skeletons) handled on every async operation
- [ ] Error states handled with toast notifications and error boundaries
- [ ] Empty states handled for all empty data lists and tables
- [ ] Responsive behavior verified on desktop, tablet, and mobile breakpoints
- [ ] Accessibility verified (keyboard-only navigation, ARIA labels, color contrast, focus management)
- [ ] Authentication flow tested end-to-end (signup, login, logout, token refresh, auto-logout on 401)
- [ ] Tenant isolation verified at UI level (Tenant A user cannot see Tenant B data)
- [ ] Role-based UI rendering verified (admin vs end_user vs platform_admin)
- [ ] Code reviewed and approved by Frontend Lead
- [ ] Merged to main branch via pull request

---

# Approval

Frontend Lead:
(To be assigned)

Technical Lead:
(To be assigned)

Date:
(To be set)
