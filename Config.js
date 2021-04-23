import * as firebase from "firebase"
require("@firebase/firestore")
var firebaseConfig = {
  apiKey: "AIzaSyDK1sBmJCfZYqvDPM1xNUJd4hAzVRd1naI",
  authDomain: "knishkc73.firebaseapp.com",
  projectId: "knishkc73",
  storageBucket: "knishkc73.appspot.com",
  messagingSenderId: "286291493646",
  appId: "1:286291493646:web:30c29092ed4b6af9564d5f"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
  export default firebase.firestore();