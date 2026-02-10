
export interface IUserShared {
    _id: string;
    username: string;
    email: string;
    googleId?: string;
    password?: string;

    friends: any[];
    friendRequests: any[];

    profilePicture?: string;
    role?: string;

    isBanned?: boolean;
    banExpiresAt?: Date | string;
    banReason?: string;

    sportsElo: {
        sport: any;
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
    sport: any; 
}
