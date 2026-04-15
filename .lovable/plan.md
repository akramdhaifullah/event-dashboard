

## Running Event Ticketing Dashboard

A clean, minimal dashboard for managing running events and their ticketing, using mock data.

### Pages & Layout
- **Sidebar navigation** with collapsible menu (Events, Participants)
- **Events page** (default `/`): List of running events as cards showing name, date, location, registration count, and revenue. CRUD actions: create, edit, delete events via modal/dialog forms.
- **Event detail page** (`/events/:id`): 
  - **Stats section**: KPI cards showing total registrations, revenue, tickets sold by type, remaining capacity
  - **Ticket configuration**: Table of ticket types (e.g. 5K, 10K, Half Marathon) with name, price, capacity, sold count. Add/edit/delete ticket types.
  - **Participant list**: Searchable, filterable table of registered participants (name, email, ticket type, registration date, status). 

### Mock Data
- 3-4 sample events with varied dates and locations
- 2-3 ticket types per event
- 15-20 sample participants spread across events

### Design
- Clean & minimal with the existing shadcn/ui components
- Card-based KPI stats with icons
- Tables with search input and filters
- Forms in dialogs for create/edit operations

