import firebase from "firebase";

export class Address {
  key: string;
  address: string;
  doorNumber: number;
  floor: string;
  postalCode: string;
  local: string;
  coordinates: firebase.firestore.GeoPoint;
}
