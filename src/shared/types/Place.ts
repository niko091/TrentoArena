export interface IPlaceShared {
    _id: string;
    name: string;
    // sport can be an ID (string) or a populated object { name: string, ... }
    sport: any;
    position: {
        lat: number;
        lng: number;
    };
}
