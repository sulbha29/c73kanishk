import React from 'react';
import { StyleSheet, Text, View, Image} from 'react-native';
import{ createAppContainer,createSwitchNavigator} from "react-navigation"
import{createBottomTabNavigator} from "react-navigation-tabs"
import Transactionscreen from "./Screens/transaction"
import Searchscreen from "./Screens/search"

export default class App extends React.Component {
  render(){

  
  return (
  <AppContainer/>
    
  );
}
}
const TabNavigator= createBottomTabNavigator({
  Transactionscreen:{screen:Transactionscreen},
  Searchscreen:{screen:Searchscreen}
},
{
  defaultNavigationOptions:({navigation })=>({
    tabBarIcon:()=>{
    const routeName= navigation.state.routeName;
   if(routeName==="Transactionscreen"){
     return(
       <Image source ={require("./assets/book.png")}
       style={{width:40,height:40}}/>
     )
   }
   else if(routeName==="Searchscreen"){
     return(
       <Image source ={require("./assets/searchingbook.png")}
       style={{width:40,height:40}}/>
     )
   }
    }
  })
})
const AppContainer= createAppContainer(TabNavigator)
const styles = StyleSheet.create({
  container: {
    flex: 1,                                                            
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
