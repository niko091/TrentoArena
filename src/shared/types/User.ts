
export interface IUserShared {
    _id: string;
    username: string;
    email: string;
    googleId?: string;
    // Password is usually not shared to frontend, but exists on the model.
    // We can make it optional or omit it in specific frontend types if needed.
    password?: string;

    // Friends can be strings (IDs) or populated objects. 
    // For shared type, we can arguably use 'any' or a union if we had a pure interface for it.
    // Let's use any[] for maximum flexibility in this iteration to avoid deep recursion issues 
    // or explicit unions with backend types.
    friends: any[];
    friendRequests: any[];

    profilePicture?: string;
    role?: string;

    isBanned?: boolean;
    banExpiresAt?: Date | string;
    banReason?: string;

    sportsElo: {
        sport: any; // ID or Populated Sport
        elo: number;
        history: {
            elo: number;
            date: Date | string;
            change: number
        }[];
    }[];
}

export interface ILeaderboardEntry {
    _id: string;
    username: string;
    profilePicture?: string;
    elo: number;
    sport: any; // ID or object
}
