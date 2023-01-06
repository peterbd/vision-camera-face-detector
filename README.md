# @mat2718/vision-camera-face-detector

VisionCamera Frame Processor Plugin to detect faces using MLKit Vision Face Detector. This repo is an updated version of the original vision-camera-face-detector but with some necessary updates.

1. MLKit version is updated to align with other vision camera plugins such as the OCR plugin
2. Face bounds have been updated to include more options for end users to choose from such as top, and left rather than just the x and y axis for android.
3. A helper function has been added for those using headers or footers to adjust the bounding box parameters. A working example using React-native 0.70.6 and updated reanimated and vision camera packages is located here: [example](https://github.com/mat2718/vision-camera-face-detector/tree/master/example)

## Installation & Configuration

### Install

```sh
# install with npm
npm install @mat2718/vision-camera-face-detector

# or install with yarn
yarn add @mat2718/vision-camera-face-detector
```

### Configure

Add the below plugin to your babel config file

```js
// babel.config.js
module.exports = {
  plugins: [
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanFaces'],
      },
    ],
  ],
};
```

## Basic Usage

```ts
import * as React from 'react';
import {runOnJS} from 'react-native-reanimated';

import {StyleSheet} from 'react-native';
import {useCameraDevices, useFrameProcessor} from 'react-native-vision-camera';

import {Camera} from 'react-native-vision-camera';
import {scanFaces, Face} from 'vision-camera-face-detector';

export default function App() {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [faces, setFaces] = React.useState<Face[]>();

  const devices = useCameraDevices();
  const device = devices.front;

  React.useEffect(() => {
    console.log(faces);
  }, [faces]);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const scannedFaces = scanFaces(frame);
    runOnJS(setFaces)(scannedFaces);
  }, []);

  return device != null && hasPermission ? (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      frameProcessorFps={5}
    />
  ) : null;
}
```

## Advanced Example

[Advanced Example](https://github.com/mat2718/vision-camera-face-detector/tree/master/example)

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

## Credits

Please feel free to check out the original repo here [vision-camera-face-detector](https://github.com/rodgomesc/vision-camera-face-detector)

Also, the original bounding box creator's repo is here [bglgwyng/FrameProcessorExample](https://github.com/bglgwyng/FrameProcessorExample/tree/face-detection-bounding-box)
