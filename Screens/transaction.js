import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Alert
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as firebase from "firebase";
import db from "../Config.js";

export default class Transactionscreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedBookId: "",
      scannedStudentId: "",
      buttonState: "normal",
      transactionMessage: ""
    };
  }

  getCameraPermissions = async id => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state;

    if (buttonState === "bookid") {
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: "normal"
      });
    } else if (buttonState === "Studentid") {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: "normal"
      });
    }
  };

  initiateBookIssue = async () => {
    //add a transaction
    db.collection("transactions").add({
      Studentid: this.state.scannedStudentId,
      bookid: this.state.scannedBookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Issue"
    });
    //change book status
    db.collection("Books")
      .doc(this.state.scannedBookId)
      .update({
        Bookavailablity: false
      });
    //change number  of issued books for student
    db.collection("Students")
      .doc(this.state.scannedStudentId)
      .update({
        Numberofbooksissues: firebase.firestore.FieldValue.increment(1)
      });

    this.setState({
      scannedStudentId: "",
      scannedBookId: ""
    });
  };

  initiateBookReturn = async () => {
    //add a transaction
    db.collection("transactions").add({
      Studentid: this.state.scannedStudentId,
      bookid: this.state.scannedBookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Return"
    });
    //change book status
    db.collection("books")
      .doc(this.state.scannedBookId)
      .update({
        Bookavailablity: true
      });
    //change number  of issued books for student
    db.collection("students")
      .doc(this.state.scannedStudentId)
      .update({
        Numberofbooksissues: firebase.firestore.FieldValue.increment(-1)
      });

    this.setState({
      scannedStudentId: "",
      scannedBookId: ""
    });
  };

  checkBookEligibility = async () => {
    const bookRef = await db .collection("Books").where("bookid", "==", this.state.scannedBookId).get();
    var transactionType = "";
    if (bookRef.docs.length == 0) {
      transactionType = false;
    } else {
      bookRef.docs.map(doc => {
        var book = doc.data();
        if (book.Bookavailablity) {
          transactionType = "Issue";
        } else {
          transactionType = "Return";
        }
      });
    }

    return transactionType;
  };

  checkStudentEligibilityForBookIssue = async () => {
    const studentRef = await db
      .collection("Students")
      .where("Studentid", "==", this.state.scannedStudentId)
      .get();
    var isStudentEligible = "";
    if (studentRef.docs.length == 0) {
      this.setState({
        scannedStudentId: "",
        scannedBookId: ""
      });
      isStudentEligible = false;
      Alert.alert("The student id doesn't exist in the database!");
    } else {
      studentRef.docs.map(doc => {
        var student = doc.data();
        if (student.  Numberofbooksissues < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          Alert.alert("The student has already issued 2 books!");
          this.setState({
            scannedStudentId: "",
            scannedBookId: ""
          });
        }
      });
    }

    return isStudentEligible;
  };

  checkStudentEligibilityForReturn = async () => {
    const transactionRef = await db.collection("transactions").where("bookid", "==", this.state.scannedBookId).limit(1).get();
    var isStudentEligible = "";
    transactionRef.docs.map(doc => {
      var lastBookTransaction = doc.data();
      if (lastBookTransaction.Studentid === this.state.scannedStudentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        Alert.alert("The book wasn't issued by this student!");
        this.setState({
          scannedStudentId: "",
          scannedBookId: ""
        });
      }
    });
    return isStudentEligible;
  };

  handleTransaction = async () => {
    //verify if the student is eligible for book issue or return or none
    //student id exists in the database
    //issue : number of book issued < 2
    //issue: verify book availability
    //return: last transaction -> book issued by the student id
    var transactionType = await this.checkBookEligibility();

    if (!transactionType) {
      Alert.alert("The book doesn't exist in the library database!");
      this.setState({
        scannedStudentId: "",
        scannedBookId: ""
      });
    } else if (transactionType === "Issue") {
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
      if (isStudentEligible) {
        this.initiateBookIssue();
        Alert.alert("Book issued to the student!");
      }
    } else {
      var isStudentEligible = await this.checkStudentEligibilityForReturn();
      if (isStudentEligible) {
        this.initiateBookReturn();
        Alert.alert("Book returned to the library!");
      }
    }
  };

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === "normal") {
      return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <View>
            <Image
              source={require("../assets/booklogo.jpg")}
              style={{ width: 200, height: 200 }}
            />
            <Text style={{ textAlign: "center", fontSize: 30 }}>Wily</Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText={text => {
                this.setState({
                  scannedBookId: text
                });
              }}
              value={this.state.scannedBookId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions("bookid");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText={text => {
                this.setState({
                  scannedStudentId: text
                });
              }}
              value={this.state.scannedStudentId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions("Studentid");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.transactionAlert}>
            {this.state.transactionMessage}
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async () => {
              var transactionMessage = this.handleTransaction();
            }}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: "underline"
  },
  scanButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    margin: 10
  },
  buttonText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10
  },
  inputView: {
    flexDirection: "row",
    margin: 20
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton: {
    backgroundColor: "#66BB6A",
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0
  },
  submitButton: {
    backgroundColor: "#FBC02D",
    width: 100,
    height: 50
  },
  submitButtonText: {
    padding: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "white"
  },
  transactionAlert: {
    margin: 10,
    color: "red"
  }
});