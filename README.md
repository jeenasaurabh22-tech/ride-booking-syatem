# Ride Booking System (Phase 2)

Full-stack ride booking app inspired by modern platforms like Ola and Rapido. **Phase 2 demo** with DAA algorithms, fare calculation, and dummy driver assignment.

## Technology Stack

### Frontend
- React 18 with Vite for fast development
- Real-time communication via Socket.IO
- JWT Token-based authentication
- Responsive UI with CSS3 animations

### Backend
- Node.js + Express.js REST API
- MongoDB Atlas database with Mongoose ORM
- Socket.IO for real-time driver tracking
- JWT middleware for secure authentication

### Core Algorithms
- **Dijkstra Algorithm** - Calculates shortest route between cities for accurate fare estimation
- **Trie Data Structure** - Enables fast city name suggestions (O(m) complexity)
- **Haversine Formula** - Computes real-world distances between GPS coordinates

## System Architecture

### Key Components
1. **Authentication Layer** - JWT-based role separation (User/Driver)
2. **Ride Matching Engine** - Real-time driver assignment using distance calculation
3. **Fare Engine** - Dynamic pricing based on route distance and base rates
4. **Location Tracking** - Live GPS updates for driver position and ETA
5. **Notification System** - WebSocket-based real-time event delivery

### Supported Features
- User registration and driver onboarding
- Real-time city search with autocomplete
- Route distance calculation and fare estimation
- Automatic nearest driver assignment
- Live driver location tracking and distance updates
- Ride status management (searching, assigned, ongoing, completed)
- Persistent ride history and driver metrics  

## Project Structure

```
RideBooking/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── CityAutocomplete.jsx       # Trie-based autocomplete
│   │   ├── lib/
│   │   │   ├── api.js                     # API client
│   │   │   ├── socket.js                  # Socket.IO client
│   │   │   └── storage.js                 # Auth token storage
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx               # Login/Register UI
│   │   │   ├── UserDashboard.jsx          # User booking flow
│   │   │   ├── UserDashboard.css          # Modern styling
│   │   │   └── DriverDashboard.jsx        # Driver panel
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── algorithms/
│   │   │   ├── dijkstra.js                # DAA shortest path
│   │   │   └── trie.js                    # City trie structure
│   │   ├── config/
│   │   │   └── db.js                      # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js          # Auth logic
│   │   │   ├── rideController.js          # Ride + fare calculation
│   │   │   ├── driverController.js        # Driver management
│   │   │   └── cityController.js          # City suggestions
│   │   ├── data/
│   │   │   ├── cityGraph.js               # Weighted city graph (edges)
│   │   │   └── cities.js                  # City coordinates & names
│   │   ├── middleware/
│   │   │   └── authMiddleware.js          # JWT verification
│   │   ├── models/
│   │   │   ├── User.js                    # User/Driver schema
│   │   │   └── Ride.js                    # Ride schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── cityRoutes.js
│   │   │   ├── driverRoutes.js
│   │   │   └── rideRoutes.js
│   │   ├── scripts/
│   │   │   └── seedDatabase.js            # Dummy data seeder
│   │   ├── services/
│   │   │   └── state.js                   # Online drivers state
│   │   ├── utils/
│   │   │   └── geo.js                     # Haversine distance
│   │   └── server.js                      # Express app + Socket.IO
│   ├── .env                               # MongoDB URI + config
│   └── package.json
│
└── package.json (root)
```

## Environment

`server/.env` is pre-configured with your MongoDB URI:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=ridebooking_super_secret_2026
MONGO_URI=mongodb+srv://root:root22@clustercoding.ieuzb3z.mongodb.net/ridebooking?appName=ClusterCoding
```

## Installation

```bash
# Root dependencies
npm install

# Install backend & frontend dependencies
npm install --prefix server
npm install --prefix client

# Seed the database with dummy data
npm --prefix server run seed
```

## Running the Project

### Development Mode (Both servers)
```bash
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

### Individual Servers
```bash
# Only backend
npm run dev:server

# Only frontend
npm run dev:client
```

### Build Frontend
```bash
npm run build
```

## Test Data

### Supported Cities (20 total, interconnected graph)
Bengaluru, Mysuru, Chennai, Coimbatore, Hyderabad, Vijayawada, Pune, Mumbai, Nashik, Delhi, Noida, Gurugram, Jaipur, Ahmedabad, Surat, Kolkata, Bhubaneswar, Patna, Lucknow, Kanpur

### Driver Accounts
```
driver1@ridebooking.com - Rajesh Kumar (Bengaluru) - Password: Rider@123
driver2@ridebooking.com - Priya Singh (Bengaluru)
driver3@ridebooking.com - Amit Patel (Chennai)
driver4@ridebooking.com - Neha Verma (Chennai)
driver5@ridebooking.com - Vikram Menon (Mumbai)
driver6@ridebooking.com - Sneha Reddy (Hyderabad)
driver7@ridebooking.com - Arjun Kapoor (Delhi)
driver8@ridebooking.com - Zara Khan (Delhi)
driver9@ridebooking.com - Rohan Sharma (Pune)
driver10@ridebooking.com - Anjali Gupta (Ahmedabad)
```

### User Accounts
```
user1@ridebooking.com - Manish Jeena (Bengaluru) - Password: User@123
user2@ridebooking.com - Prateek Singh (Chennai)
user3@ridebooking.com - Divya Sharma (Mumbai)
user4@ridebooking.com - Karan Patel (Delhi)
user5@ridebooking.com - Sneha Kapoor (Hyderabad)
```

## How It Works

### Ride Booking Flow

User initiates booking → City selection with autocomplete (Trie) → Route calculation (Dijkstra) → Fare calculation → Driver search (Haversine) → Automatic assignment → Real-time tracking (Socket.IO)

### Ride Matching Engine

When a user books a ride:
1. **Input Validation** - Verify pickup and drop cities exist in the system
2. **Route Calculation** - Dijkstra algorithm finds shortest path using weighted city graph
3. **Fare Estimation** - Base fare + distance charge + platform fee
4. **Driver Search** - Scans all online drivers in real-time
5. **Distance Calculation** - Haversine formula computes GPS distance for each driver
6. **Optimal Selection** - Assigns the nearest available driver
7. **Live Tracking** - Driver location updates streamed via WebSocket

### Fare Calculation

```
Base Fare:           ₹50
Distance Charge:     Distance (km) × ₹12
Platform Fee:        8% of subtotal
Total:               Base + Distance + Platform Fee

Example (Bengaluru → Chennai = 350 km):
Base:                ₹50
Distance:            350 × ₹12 = ₹4,200
Platform Fee:        (50 + 4,200) × 0.08 = ₹340
Total:               ₹4,590
```

### Algorithm Performance

Dijkstra Algorithm: O((V+E) log V) - Calculates shortest path between cities for accurate fare
Trie Structure: O(m) where m is query length - Provides instant city suggestions
Haversine Formula: O(1) per pair - Computes real-time driver proximity

## API Endpoints

### Authentication
- `POST /api/auth/register` - User/driver account creation
- `POST /api/auth/login` - User authentication with JWT token

### City Services
- `GET /api/cities/suggest?q=ben` - Get city suggestions with prefix matching

### Ride Management
- `POST /api/rides/book` - Create new ride booking with fare calculation
- `GET /api/rides/my-latest` - Retrieve most recent user ride
- `PATCH /api/rides/:rideId/status` - Update ride status (ongoing, completed, cancelled)

### Driver Operations
- `PATCH /api/drivers/online` - Toggle driver availability status
- `PATCH /api/drivers/location` - Update driver GPS coordinates and compute distance to pickup

## User Interface

### User Application
- City autocomplete search with real-time suggestions
- Distance and fare estimation before booking
- Visual route representation
- Assigned driver details and contact information
- Booking confirmation and status tracking

### Driver Dashboard
- Online/offline status toggle
- Real-time location updates
- Incoming ride notifications
- Ride history and earnings

## Development Roadmap

### Phase 3 Enhancements
- Map integration for visual route display
- Real-time GPS tracking on interactive map
- Payment gateway integration
- User ratings and driver reviews
- Advanced search filters
- Push notifications for ride updates
