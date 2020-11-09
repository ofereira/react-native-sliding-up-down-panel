import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
const { width, height } = Dimensions.get('window');
let sliderPosition = 0;

const styles = StyleSheet.create({
  headerPanelViewStyle: {
    width,
    backgroundColor: '#ff0032',
    position: 'absolute',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
});

const TOP = 'TOP';
const MIDDLE = 'MIDDLE';
const BOTTOM = 'BOTTOM';

const statuses = [TOP, MIDDLE, BOTTOM];


const SlidingPanelIOS = (props) => (
  <Animated.View style={props.panelPosition === 'bottom' ? {bottom: props.heightAnim, flex: 1, position: 'absolute',} : {top: props.heightAnim, flex: 1, position: 'absolute',}}>
    <Animated.View
      {...props.panResponder} style={{height: props.headerPanelHeight,}}>
      {props.headerView()}
    </Animated.View>
    <View style={props.panelPosition === 'bottom' ? {top: props.headerPanelHeight, left: 0, position: 'absolute',} : {bottom: props.headerPanelHeight, left: 0, position: 'absolute',}}>
      {props.slidingPanelView()}
    </View>
  </Animated.View>
);

const SlidingPanelAndroid = (props) => (
    <Animated.View style={props.panelPosition === 'bottom' ? {bottom: props.heightAnim, flex: 1, position: 'absolute',} : {top: props.heightAnim, flex: 1, position: 'absolute',}}>
    <Animated.View
      {...props.panResponder} style={{height: props.headerPanelHeight,}}>
      {props.headerView()}
    </Animated.View>
    <Animated.View style={props.panelPosition === 'bottom' ? {top: props.headerPanelHeight, left: 0, position: 'absolute',} : {bottom: props.headerPanelHeight, left: 0, position: 'absolute',}}>
      {props.slidingPanelView()}
    </Animated.View>
  </Animated.View>
);

export default class SlidingPanel extends Component {

  constructor(props) {
    super(props);
    this.state = {
      heightAnim: new Animated.Value(props.initialHeight),
      panResponder: {},
      status: MIDDLE,
    };

    sliderPosition = props.initialHeight != 0 ? props.initialHeight + props.maxHeight : 0;

    var a = 0;
    this.state.panResponder = PanResponder.create({
      onStartShouldSetPanResponder : () => true,
      onPanResponderGrant: (evt, gestureState) => {
        a = 0;
      },
      onPanResponderMove: (event, gestureState) => {
        if(this.props.allowDragging) {
          if(a === 0) {
            this.props.onDragStart(event, gestureState);
          } else {
            this.props.onDrag(event, gestureState);
          }
          if(this.props.panelPosition === 'bottom') {
            a = gestureState.dy * -1;
          }
          else {
            a = gestureState.dy * 1;
          }
          if((Platform.OS === 'android' ?
            sliderPosition + a - this.props.maxHeight < height - (this.props.headerLayoutHeight + 25) :
            sliderPosition + a - this.props.maxHeight < height - (this.props.headerLayoutHeight + ( this.props.maxHeight ? this.props.maxHeight : -2 ))) 
            && sliderPosition + a - this.props.maxHeight > -2){
            if(sliderPosition !== 0) {
              this.state.heightAnim.setValue(sliderPosition + a - this.props.maxHeight)
            }
            else {
              this.state.heightAnim.setValue(a - this.props.maxHeight)
            }
          }
        }
      },
      onPanResponderRelease: (e, gesture) => {
        // console.log('status', this.state.status);
        console.log('sliderPosition', sliderPosition);
        sliderPosition = sliderPosition + a;

        if(a !== 0) { 
          this.props.onDragStop(e, gesture)
        }
        
        if(this.props.allowAnimation) {
          if(a === 0 || (this.props.panelPosition === 'bottom' ? gesture.vy < -1 : gesture.vy > 1)) {
            if(sliderPosition < height-this.props.headerLayoutHeight) {
              sliderPosition = height-this.props.headerLayoutHeight
              this.props.onAnimationStart();
              Animated.timing(
                this.state.heightAnim,
                {
                  toValue: Platform.OS === 'android' ?
                    height-this.props.headerLayoutHeight - 25 :
                    height-this.props.headerLayoutHeight - this.props.maxHeight,
                  duration: this.props.AnimationSpeed,
                  useNativeDriver: false,
                }
              ).start(() => this.props.onAnimationStop());
              // this.setState((prevState) => ({...prevState, status: TOP}));
              // console.log('TOP');
            } else {
              sliderPosition = this.props.maxHeight
              this.props.onAnimationStart();
              Animated.timing(
                this.state.heightAnim,
                {
                  toValue: this.props.minHeight,
                  duration: this.props.AnimationSpeed,
                  useNativeDriver: false,
                }
              ).start(() => this.props.onAnimationStop()); 
            }
            // this.setState((prevState) => ({...prevState, status: BOTTOM}));
            // console.log('BOTTOM');
          }

          if(this.props.panelPosition === 'bottom' ? gesture.vy > 1 : gesture.vy < -1) {
            sliderPosition = 0
            this.props.onAnimationStart();
            Animated.timing(
              this.state.heightAnim,
              {
                toValue: this.props.minHeight,
                duration: this.props.AnimationSpeed,
                useNativeDriver: false,
              }
            ).start(() => this.props.onAnimationStop());
            console.log('undefined');
          }
        }

        switch(true) {
          case (sliderPosition < 180): {
            console.log('BOTTOM');
            this.setState((prevState) => ({...prevState, status: BOTTOM}));
            break;
          }
          case (sliderPosition >= 180 && sliderPosition <= 700): {
            console.log('MIDDLE');
            this.setState((prevState) => ({...prevState, status: MIDDLE}));
            break;
          }
          case (sliderPosition > 700): {
            console.log('TOP');
            this.setState((prevState) => ({...prevState, status: TOP}));
            break;
          }
        }

        if(this.props.sliderLastPosition){
          // console.log('last slider', this.props.sliderLastPosition);
          this.props.sliderLastPosition(sliderPosition);
        }
      },
    });
  }

  onRequestClose() {
    sliderPosition = 0
    Animated.timing(
      this.state.heightAnim,
      {
        toValue: 0,
        duration: this.props.AnimationSpeed,
        useNativeDriver: false,
      }
    ).start();
  }

  onRequestStart() {
    sliderPosition = height-this.props.headerLayoutHeight
    Animated.timing(
      this.state.heightAnim,
      {
        toValue: Platform.OS === 'android' ?
          height-this.props.headerLayoutHeight - 25 : height-this.props.headerLayoutHeight,
        duration: this.props.AnimationSpeed,
        useNativeDriver: false,
      }
    ).start();
  }

  render() {
    return (
      <View style={this.props.panelPosition === 'bottom' ? {position: 'absolute', bottom: 0} : {position: 'absolute', top: 0}}>
        {
          Platform.OS === 'ios' && this.props.visible === true ?
            <SlidingPanelIOS
                panResponder = {this.state.panResponder.panHandlers}
                panelPosition={this.props.panelPosition}
                headerPanelHeight={this.props.headerLayoutHeight}
                headerView = {() => this.props.headerLayout()}
                heightAnim={this.state.heightAnim}
                visible={this.props.visible}
                slidingPanelView={() => this.props.slidingPanelLayout()}
            /> : this.props.visible === true &&
            <SlidingPanelAndroid
                panResponder = {this.state.panResponder.panHandlers}
                panelPosition={this.props.panelPosition}
                headerPanelHeight={this.props.headerLayoutHeight}
                headerView = {() => this.props.headerLayout()}
                heightAnim={this.state.heightAnim}
                visible={this.props.visible}
                slidingPanelView={() => this.props.slidingPanelLayout()}
            />
        }
      </View>
    );
  }
}

SlidingPanel.propTypes = {
  headerLayoutHeight: PropTypes.number.isRequired,
  headerLayout: PropTypes.func.isRequired,
  slidingPanelLayout: PropTypes.func.isRequired,

  AnimationSpeed: PropTypes.number,
  slidingPanelLayoutHeight: PropTypes.number,
  panelPosition: PropTypes.string,
  visible: PropTypes.bool,
  allowDragging: PropTypes.bool,
  allowAnimation: PropTypes.bool,
  minHeight: PropTypes.number,
  onDragStart: (event, gestureState) => {},
  onDragStop: (event, gestureState) => {},
  onDrag: (event, gestureState) => {},
  onAnimationStart: () => {},
  onAnimationStop: () => {},
};

SlidingPanel.defaultProps = {
  panelPosition: 'bottom',
  headerLayoutHeight: 50,
  headerLayout: () => {},
  visible: true,
  onDragStart: (event, gestureState) => {},
  onDragStop: (event, gestureState) => {},
  onDrag: (event, gestureState) => {},
  onAnimationStart: () => {},
  onAnimationStop: () => {},
  slidingPanelLayout: () => {},
  allowDragging: true,
  allowAnimation: true,
  slidingPanelLayoutHeight: 0,
  AnimationSpeed: 1000,
  maxHeight: 0,
  initialHeight: 0,
  minHeight: 0,
};
