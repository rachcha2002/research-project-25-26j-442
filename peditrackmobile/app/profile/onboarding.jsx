import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import Swiper from "react-native-swiper";
import Screen1 from "../../components/Onboarding/Screen1";
import Screen2 from "../../components/Onboarding/Screen2";
import Screen3 from "../../components/Onboarding/Screen3";
import Screen4 from "../../components/Onboarding/Screen4";
import { Colors } from "../../constants/colors";

const Onboarding = () => {
  return (
    <>
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
      <Swiper loop={false} showsButtons={true} activeDotColor="#ffffff">
        {/* Screen 1 */}
        <View style={styles.slide}>
          <Screen1 />
        </View>

        {/* Screen 2 */}
        <View style={styles.slide}>
          <Screen2 />
        </View>

        {/* Screen 3 */}
        <View style={styles.slide}>
          <Screen3 />
        </View>

        {/* Screen 4 */}
        <View style={styles.slide}>
          <Screen4 />
        </View>
      </Swiper>
    </>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
});

export default Onboarding;
