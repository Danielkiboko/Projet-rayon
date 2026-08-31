import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface SwipeButtonProps {
  onConfirm: () => void;
  title?: string;
}

const BUTTON_HEIGHT = 60;
const BUTTON_WIDTH = Dimensions.get('window').width - 48; // Padding 24 on each side
const THUMB_SIZE = 52;
const THUMB_MARGIN = 4;
const MAX_TRANSLATE = BUTTON_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2;

export default function SwipeButton({ onConfirm, title = "Glissez pour valider" }: SwipeButtonProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [confirmed, setConfirmed] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !confirmed,
      onMoveShouldSetPanResponder: () => !confirmed,
      onPanResponderMove: (e, gesture) => {
        if (gesture.dx > 0 && gesture.dx <= MAX_TRANSLATE) {
          pan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > MAX_TRANSLATE * 0.75) {
          // Confirmed
          setConfirmed(true);
          Animated.spring(pan, {
            toValue: { x: MAX_TRANSLATE, y: 0 },
            useNativeDriver: false,
            bounciness: 0,
          }).start(() => {
            onConfirm();
          });
        } else {
          // Reset
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  // Change opacity based on translation
  const textOpacity = pan.x.interpolate({
    inputRange: [0, MAX_TRANSLATE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const bgInterpolation = pan.x.interpolate({
    inputRange: [0, MAX_TRANSLATE],
    outputRange: ['rgba(56, 189, 248, 0.1)', 'rgba(34, 197, 94, 0.2)'],
    extrapolate: 'clamp',
  });

  const borderInterpolation = pan.x.interpolate({
    inputRange: [0, MAX_TRANSLATE],
    outputRange: ['rgba(56, 189, 248, 0.3)', 'rgba(34, 197, 94, 0.5)'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgInterpolation, borderColor: borderInterpolation }]}>
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        {title}
      </Animated.Text>

      <Animated.View
        style={[
          styles.thumb,
          { transform: [{ translateX: pan.x }] },
          confirmed && styles.thumbConfirmed,
        ]}
        {...panResponder.panHandlers}
      >
        <FontAwesome5 
          name={confirmed ? "check" : "chevron-right"} 
          size={20} 
          color="#0b061c" 
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    width: BUTTON_WIDTH,
    borderRadius: BUTTON_HEIGHT / 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
    zIndex: 1,
  },
  thumb: {
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#38bdf8',
    position: 'absolute',
    left: THUMB_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 2,
  },
  thumbConfirmed: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
  }
});
