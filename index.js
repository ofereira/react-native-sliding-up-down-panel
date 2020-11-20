import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Platform,
  View,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
const { width, height } = Dimensions.get('window');
let sliderPosition = 0;

const TOP = 'TOP';
const MIDDLE = 'MIDDLE';
const BOTTOM = 'BOTTOM';

const SlidingPanelIOS = (props) => (
  <Animated.View style={props.panelPosition === 'bottom' ? {bottom: props.heightAnim, flex: 1, position: 'absolute',} : {top: props.heightAnim, flex: 1, position: 'absolute',}}>
    <Animated.View
      {...props.panResponder} style={{height: props.headerPanelHeight,}}>
      {props.headerView()}
    </Animated.View>
    <View 
      style={props.panelPosition === 'bottom' ? {top: props.headerPanelHeight, left: 0, position: 'absolute',} : {bottom: props.headerPanelHeight, left: 0, position: 'absolute',}}
      {...props.panResponder}>
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
    <Animated.View 
      style={props.panelPosition === 'bottom' ? {top: props.headerPanelHeight, left: 0, position: 'absolute',} : {bottom: props.headerPanelHeight, left: 0, position: 'absolute',}}
      {...props.panResponder}>
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
      previousStatus: BOTTOM,
    };

    sliderPosition = props.initialHeight != 0 ? props.initialHeight : 0;

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

          if(sliderPosition + a > ( this.props.maxHeight ? this.props.maxHeight : height )){
            this.state.heightAnim.setValue(this.props.maxHeight ? this.props.maxHeight : height);
          }else if(sliderPosition + a < this.props.minHeight){
            this.state.heightAnim.setValue(this.props.minHeight);
          }else{
            this.state.heightAnim.setValue(sliderPosition + a);
          }
        }
      },
      onPanResponderRelease: (e, gesture) => {
        const listenerPosition = sliderPosition + a; //to save real last position

        if(sliderPosition + a > ( this.props.maxHeight ? this.props.maxHeight : height )){
          sliderPosition = this.props.maxHeight ? this.props.maxHeight : height;
        }else if(sliderPosition + a < this.props.minHeight){
          sliderPosition = this.props.minHeight;
        }else{
          sliderPosition = sliderPosition + a;
        }

        if(a > 0){
          //going up (a is positive)
          if(a > this.props.maxHeight * 0.1){
            //MOVE
            if(sliderPosition >= (this.props.maxHeight * 0.6)){
              sliderPosition = this.goToTop();
              this.setState((prevState) => ({...prevState, status: TOP, previousStatus: MIDDLE}));
            }else{
              sliderPosition = this.goToMiddle();
              this.setState((prevState) => ({...prevState, status: MIDDLE, previousStatus: prevState.status}));
            }
          }else{
            //RETURN TO LAST POSITION
            if (this.state.status === BOTTOM) {
              sliderPosition = this.goToBottom();
              this.setState((prevState) => ({...prevState, status: BOTTOM,  previousStatus: MIDDLE }));
            } else if (this.state.status === MIDDLE) {
              sliderPosition = this.goToMiddle();
              this.setState((prevState) => ({...prevState, status: MIDDLE, previousStatus: prevState.status}));
            }
          }
        }else if(a < 0){
          //going down (a is negative)
          if(-a > this.props.maxHeight * 0.1){
            //MOVE
            if(sliderPosition <= (this.props.maxHeight * 0.4)){
              sliderPosition = this.goToBottom();
              this.setState((prevState) => ({...prevState, status: BOTTOM,  previousStatus: MIDDLE }));
            }else{
              sliderPosition = this.goToMiddle();
              this.setState((prevState) => ({...prevState, status: MIDDLE, previousStatus: prevState.status}));
            }
          }else{
            //RETURN TO LAST POSITION
            if (this.state.status === TOP) {
              sliderPosition = this.goToTop();
              this.setState((prevState) => ({...prevState, status: TOP, previousStatus: MIDDLE}));
            } else if (this.state.status === MIDDLE){
              sliderPosition = this.goToMiddle();
              this.setState((prevState) => ({...prevState, status: MIDDLE, previousStatus: prevState.status}));
            }
          }
        }else{
          //tap
          switch(true) {
            case (sliderPosition >= (this.props.maxHeight * 0.3) && sliderPosition <= (this.props.maxHeight * 0.7)): {
              if (this.state.previousStatus === TOP) {
                sliderPosition = this.goToBottom();
                this.setState((prevState) => ({...prevState, status: BOTTOM, previousStatus: MIDDLE}));
              } else {
                sliderPosition = this.goToTop();
                this.setState((prevState) => ({...prevState, status: TOP, previousStatus: MIDDLE}));
              }
              break;
            }
  
            default: {
              sliderPosition = this.goToMiddle();
              this.setState((prevState) => ({...prevState, status: MIDDLE, previousStatus: prevState.status}));
              break;
            }
          }
        }

        if(this.props.sliderLastPosition){
          this.props.sliderLastPosition(listenerPosition);
        }
      },
    });
  }

  goToMiddle = () => {
    const screenHeight = this.props.maxHeight ? this.props.maxHeight : height;
    const sliderPosition = screenHeight/2;

    this.props.onAnimationStart();
    Animated.timing(
      this.state.heightAnim,
      {
        toValue: sliderPosition,
        duration: this.props.AnimationSpeed,
        useNativeDriver: false,
      }
    ).start(() => this.props.onAnimationStop());

    return sliderPosition;
  };

  goToTop = () => {
    const screenHeight = this.props.maxHeight ? this.props.maxHeight : height;
    const sliderPosition = screenHeight;

    this.props.onAnimationStart();
    Animated.timing(
      this.state.heightAnim,
      {
        toValue: screenHeight,
        duration: this.props.AnimationSpeed,
        useNativeDriver: false,
      }
    ).start(() => this.props.onAnimationStop());

    return sliderPosition;
  };

  goToBottom = () => {
    const sliderPosition = this.props.minHeight;

    this.props.onAnimationStart();
    Animated.timing(
      this.state.heightAnim,
      {
        toValue: sliderPosition,
        duration: this.props.AnimationSpeed,
        useNativeDriver: false,
      }
    ).start(() => this.props.onAnimationStop());

    return sliderPosition;
  };

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
