export interface IPlaceShared {
  _id: string;
  name: string;
  sport: any;
  position: {
    lat: number;
    lng: number;
  };
}
