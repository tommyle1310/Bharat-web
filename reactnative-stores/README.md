# User Store with Zustand

This directory contains the Zustand store implementation for user management in the React Native app.

## Files

- `userStore.ts` - Main Zustand store with user state and actions
- `index.ts` - Export file for clean imports

## Store Structure

### State Properties

- `businessVertical: string` - User's business vertical (INSURANCE/BANKING)
- `username: string` - User's username
- `email: string` - User's email address
- `password: string` - User's password (not persisted)
- `avatar: string` - User's avatar URL
- `watchList: Vehicle[]` - Array of vehicles in watchlist
- `wins: Vehicle[]` - Array of vehicles user has won
- `bids: Vehicle[]` - Array of vehicles user has bid on
- `wishlist: Vehicle[]` - Array of vehicles in wishlist
- `isAuthenticated: boolean` - Authentication status

### Actions

#### Profile Management
- `setBusinessVertical(vertical: string)` - Set business vertical
- `setUsername(username: string)` - Set username
- `setEmail(email: string)` - Set email
- `setPassword(password: string)` - Set password
- `setAvatar(avatar: string)` - Set avatar

#### List Management
- `addToWatchList(vehicle: Vehicle)` - Add vehicle to watchlist
- `removeFromWatchList(vehicleId: string)` - Remove vehicle from watchlist
- `addToWins(vehicle: Vehicle)` - Add vehicle to wins
- `removeFromWins(vehicleId: string)` - Remove vehicle from wins
- `addToBids(vehicle: Vehicle)` - Add vehicle to bids
- `removeFromBids(vehicleId: string)` - Remove vehicle from bids
- `addToWishlist(vehicle: Vehicle)` - Add vehicle to wishlist
- `removeFromWishlist(vehicleId: string)` - Remove vehicle from wishlist

#### Authentication
- `login(email: string, password: string)` - Login user
- `logout()` - Logout user and clear data
- `register(userData)` - Register new user

#### Utilities
- `clearAllData()` - Clear all user data
- `isVehicleInList(vehicleId: string, listType)` - Check if vehicle is in specific list

## Usage

### Basic Usage

```typescript
import { useUserStore } from '../stores/userStore';

const MyComponent = () => {
  const { username, email, isAuthenticated, login, logout } = useUserStore();
  
  return (
    // Your component JSX
  );
};
```

### Using the Custom Hook

```typescript
import { useUser } from '../hooks/useUser';

const MyComponent = () => {
  const {
    username,
    businessVertical,
    watchList,
    addToWatchList,
    removeFromWatchList,
    login,
    logout
  } = useUser();
  
  return (
    // Your component JSX
  );
};
```

## Persistence

The store uses AsyncStorage for persistence with the following configuration:

- **Persisted fields**: businessVertical, username, email, avatar, watchList, wins, bids, wishlist, isAuthenticated
- **Not persisted**: password (for security)
- **Storage key**: 'user-store'

## Integration

The store is integrated into the app through:

1. `StoreProvider` component in `src/providers/StoreProvider.tsx`
2. Wrapped around the entire app in `App.tsx`
3. Used in `RootNavigator.tsx` for authentication-based navigation

## Example Components

- `UserProfile.tsx` - Example component showing how to use the store
- Updated `HomeScreen.tsx` - Shows integration with existing screens

## Type Safety

The store is fully typed with TypeScript:

- `UserState` interface defines the complete state structure
- All actions are properly typed
- Vehicle type is imported from `../types/Vehicle`
