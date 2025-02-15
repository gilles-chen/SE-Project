import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import WaypointModal from '../components/Modal';
import DrawerButton from '../components/DrawerButton';

import firebase from '../config/firebaseConfig';

import GLOBAL from '../components/global.js';

class MapScreen extends Component {
  state = {
    isVisible: [],
  };

  componentDidMount() {
    //Define a global state used to (un)toggle categories
    GLOBAL.categories = this;
    GLOBAL.categories.setState({
      art: true,
      culture: true,
      science: true,
    });

    //Get the waypoints positions from the database
    firebase
      .database()
      .ref()
      .child('waypoints')
      .get()
      .then(snapshot => {
        if (snapshot.exists()) {
          var data = [];
          snapshot.forEach(entry => {

            //For each waypoint add its data to the data local variable
            data.push({
              key: entry.key,
              coordinates: snapshot.child(entry.key).child('coordinates').val(),
              modal: snapshot.child(entry.key).child('modal').val(),
              title: snapshot.child(entry.key).child('title').val(),
              category: snapshot.child(entry.key).child('category').val(),
            });

            //Define the default visible state of the modal to false
            this.setState({
              isVisible: [
                ...this.state.isVisible,
                { key: entry.key, value: false },
              ],
            });
          });
          this.setState({ waypoints: data });
          // console.log(this.state.waypoints);
        }
      });

    //Get intial region from the database
    firebase
      .database()
      .ref()
      .child('initialRegion')
      .get()
      .then(snapshot => {
        this.setState({ initialRegion: snapshot.val() });
      });
  }

  displayModal(state, componentKey) {
    var index = this.state.isVisible.findIndex(x => x.key === componentKey);

    //Update the state by switching the componentKey visibility to state
    this.setState({
      isVisible: [
        ...this.state.isVisible.slice(0, index),
        Object.assign({}, this.state.isVisible[index], {
          key: componentKey,
          value: state,
        }),
        ...this.state.isVisible.slice(index + 1),
      ],
    });
  }

  markerColor(category) {
    switch (category) {
      case "art":
        return "red";
        break;
      case "culture":
        return "orange";
        break;
      case "science":
        return "lightblue";
        break;
      default:
        return "#000000";
        break;
    }
  }

  render() {
    const waypoints = () => {
      if (this.state.waypoints) {
        return this.state.waypoints.map((waypoint, index) => {

          //If the waypoint category is toggled
          if (this.state[waypoint.category]) {
            return (
              <Marker
                key={index}
                pinColor={this.markerColor(waypoint.category)}
                coordinate={waypoint.coordinates}
                onPress={() => this.displayModal(true, waypoint.key)}>
                <Callout>
                  <WaypointModal
                    isVisible={this.state.isVisible.find(x => x.key === waypoint.key).value}
                    hideModal={() => this.displayModal(false, waypoint.key)}
                    title={waypoint.title}
                    modal={waypoint.modal}
                  />
                </Callout>
              </Marker>
            );
          }
        });
      }
    };
    return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={this.state.initialRegion}>
          {waypoints()}
        </MapView>
        <DrawerButton
          style={{ top: 20, left: 40 }}
          navigation={this.props.navigation}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapScreen;
