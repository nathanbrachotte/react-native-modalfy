/* @flow */

import React, { Component } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  View,
} from 'react-native'

import type {
  ModalName,
  Stack,
  StackItem as StackItemType,
  TransitionOptions,
} from '../types'
import { vh, vw } from '../utils'

import StackItem from './StackItem'

const styles = StyleSheet.create({
  container: (opacity, translateY) => ({
    ...StyleSheet.absoluteFill,
    opacity,
    transform: [{ translateY }],
    zIndex: 0,
  }),
  backdrop: (opacity, backdropOpacity) => ({
    width: vw(100),
    height: vh(100),
    backgroundColor: 'black',
    opacity: opacity.interpolate({
      inputRange: [0, 1],
      outputRange: [0, backdropOpacity],
    }),
  }),
})

type Props = {
  closeModal: (modal?: ModalName) => void,
  currentModal: ?ModalName,
  getParams: (modalName: ModalName, fallback?: any) => any,
  openModal: ModalName => void,
  stack: Stack,
}

class ModalStack extends Component<Props> {
  animatedValue = new Animated.Value(0)
  translateYValue = new Animated.Value(vh(100))

  componentDidUpdate(prevProps: Props) {
    this._animateContent(prevProps)
  }

  _animateContent = (prevProps: Props) => {
    const hasOpenedItemsNow = this.props.stack.openedItems.length
    const hadOpenedItems = prevProps.stack.openedItems.length

    if (hasOpenedItemsNow) {
      this.translateYValue.setValue(0)
      Animated.timing(this.animatedValue, {
        toValue: 1,
        easing: Easing.in(Easing.ease),
        duration: 300,
        /**
         * It seems like when useNativeDriver is used with an interpolation,
         * upon opening a new activity (share sheet, alert, etc),
         * the backdropOpacity is set to 1. Until we find a fix/workaround
         * we're disabling native driver on Android only.
         */
        useNativeDriver: Platform.OS === 'ios',
      }).start()
    } else if (hadOpenedItems && !hasOpenedItemsNow) {
      Animated.timing(this.animatedValue, {
        toValue: 0,
        easing: Easing.inOut(Easing.ease),
        duration: 300,
        useNativeDriver: Platform.OS === 'ios',
      }).start()
      this.translateYValue.setValue(vh(100))
    }
  }

  renderStackItem = (
    stackItem: ?StackItemType,
    index: number
  ): React$Element<*> => (
    <StackItem
      {...this.props}
      // $FlowFixMe
      stackItem={stackItem}
      key={index}
      zIndex={index + 1}
      position={this.props.stack.openedItems.length - index}
    />
  )

  renderStack = (): ?Array<React$Element<*>> => {
    const { openedItems } = this.props.stack
    if (!openedItems.length) return null
    return openedItems.map(this.renderStackItem)
  }

  renderBackdrop = (): React$Element<*> => {
    const {
      stack: {
        defaultOptions: { backdropOpacity },
      },
    } = this.props
    return (
      <Animated.View
        style={styles.backdrop(this.animatedValue, backdropOpacity)}
      />
    )
  }

  render() {
    return (
      <Animated.View
        style={styles.container(this.animatedValue, this.translateYValue)}
      >
        {this.renderStack()}
        {this.renderBackdrop()}
      </Animated.View>
    )
  }
}

export default ModalStack
