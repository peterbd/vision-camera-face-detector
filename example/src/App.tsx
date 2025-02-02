import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {
  Platform,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {
  Frame,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';

import {
  Dimensions,
  Face,
  faceBoundsAdjustToView,
  scanFaces,
  sortFormatsByResolution,
} from '@mat2718/vision-camera-face-detector';
import {runOnJS} from 'react-native-reanimated';
import {Camera} from 'react-native-vision-camera';

const App = () => {
  //*****************************************************************************************
  //  setting up the state
  //*****************************************************************************************
  // Permissions
  const [hasPermission, setHasPermission] = React.useState(false);
  // camera states
  const devices = useCameraDevices();
  let direction: 'front' | 'back' = 'back';
  const device = devices[direction];
  const camera = useRef<Camera>(null);
  const [faces, setFaces] = useState<Face[]>([]);
  const {height: screenHeight, width: screenWidth} = useWindowDimensions();
  const landscapeMode = screenWidth > screenHeight;
  const [frameDimensions, setFrameDimensions] = useState<Dimensions>();
  const [isActive, setIsActive] = useState(true);

  //*****************************************************************************************
  // Comp Logic
  //*****************************************************************************************

  /* A cleanup function that is called when the component is unmounted. */
  useEffect(() => {
    return () => {
      setIsActive(false);
    };
  }, []);

  // which format should we use
  const formats = useMemo(
    () => device?.formats.sort(sortFormatsByResolution),
    [device?.formats],
  );

  //figure our what happens if it is undefined?
  const [format, setFormat] = useState(
    formats && formats.length > 0 ? formats[0] : undefined,
  );

  /* Setting the frame dimensions and faces. */
  const handleScan = useCallback(
    (frame: Frame, newFaces: Face[]) => {
      const isRotated = !landscapeMode;
      setFrameDimensions(
        isRotated
          ? {
              width: frame.height,
              height: frame.width,
            }
          : {
              width: frame.width,
              height: frame.height,
            },
      );
      setFaces(newFaces);
    },
    [landscapeMode],
  );

  /* Setting the format to the first format in the formats array. */
  useEffect(() => {
    setFormat(formats && formats.length > 0 ? formats[0] : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  /* Using the useFrameProcessor hook to process the video frames. */
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      const scannedFaces = scanFaces(frame);
      runOnJS(handleScan)(frame, scannedFaces);
    },
    [handleScan],
  );

  // const frameProcessor = useFrameProcessor(frame => {
  //   'worklet';
  //   const scannedFaces = scanFaces(frame);
  //   runOnJS(setFaces)(scannedFaces);
  // }, []);

  /* Using the useMemo hook to create a style object. */
  const boundingStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: screenWidth,
      height: screenHeight,
    }),
    [screenWidth, screenHeight],
  );

  useEffect(() => {
    // console.log(faces);
  }, [faces]);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  //*****************************************************************************************
  // stylesheet
  //*****************************************************************************************

  const styles = StyleSheet.create({
    boundingBox: {
      borderRadius: 5,
      borderWidth: 3,
      borderColor: 'yellow',
      position: 'absolute',
    },
    crossSectionContainer: {
      height: 15,
      width: 15,
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      top: screenHeight / 2,
      left: screenWidth / 2,
    },
    verticalCrossHair: {
      height: '100%',
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: 'yellow',
      borderWidth: 1,
    },
    horizontalCrossHair: {
      width: '100%',
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: 'yellow',
      borderWidth: 1,
    },
  });

  //********************************************************************
  // Components
  //********************************************************************

  return device != null && hasPermission ? (
    <>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        torch={'off'}
        isActive={isActive}
        ref={camera}
        photo={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={10}
        audio={false}
        format={format}
      />
      <View style={styles.crossSectionContainer}>
        <View style={styles.verticalCrossHair} />
        <View style={styles.horizontalCrossHair} />
      </View>
      <View style={boundingStyle} testID="faceDetectionBoxView">
        {frameDimensions &&
          (() => {
            const mirrored = Platform.OS === 'android' && direction === 'front';
            const {adjustRect} = faceBoundsAdjustToView(
              frameDimensions,
              {
                width: screenWidth,
                height: screenHeight,
              },
              landscapeMode,
              50,
              50,
            );
            return faces
              ? faces.map((i, index) => {
                  const {left, ...others} = adjustRect(i.bounds);

                  return (
                    <View
                      key={index}
                      style={[
                        styles.boundingBox,
                        {
                          ...others,
                          [mirrored ? 'right' : 'left']: left,
                        },
                      ]}
                    />
                  );
                })
              : undefined;
          })()}
      </View>
    </>
  ) : undefined;
};

export default App;
