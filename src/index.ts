import {Platform} from 'react-native';
import type {CameraDeviceFormat, Frame} from 'react-native-vision-camera';

/**
 * Scans Faces.
 */

type Point = {x: number; y: number};
export interface Face {
  leftEyeOpenProbability: number;
  rollAngle: number;
  pitchAngle: number;
  yawAngle: number;
  rightEyeOpenProbability: number;
  smilingProbability: number;
  bounds: {
    /** the y coordinate in the center of the face bounds */
    y: number;
    /** the x coordinate in the center of the face bounds */
    x: number;
    /** the top of the face bounds */
    top: number;
    /** the left of the face bounds */
    left: number;
    /** the height of the face bounds */
    height: number;
    /** the width of the face bounds */
    width: number;
  };
  contours: {
    FACE: Point[];
    NOSE_BOTTOM: Point[];
    LOWER_LIP_TOP: Point[];
    RIGHT_EYEBROW_BOTTOM: Point[];
    LOWER_LIP_BOTTOM: Point[];
    NOSE_BRIDGE: Point[];
    RIGHT_CHEEK: Point[];
    RIGHT_EYEBROW_TOP: Point[];
    LEFT_EYEBROW_TOP: Point[];
    UPPER_LIP_BOTTOM: Point[];
    LEFT_EYEBROW_BOTTOM: Point[];
    UPPER_LIP_TOP: Point[];
    LEFT_EYE: Point[];
    RIGHT_EYE: Point[];
    LEFT_CHEEK: Point[];
  };
}

/**
 * It takes a frame, and returns an array of faces
 * @param {Frame} frame - The frame to scan for faces.
 * @returns The return value is an array of Face objects.
 */
export function scanFaces(frame: Frame): Face[] {
  'worklet';
  // @ts-ignore
  // eslint-disable-next-line no-undef
  return __scanFaces(frame);
}

/**
 * Dimensions is an object with a width property that is a number and a height property that is a
 * number.
 * @property {number} width - The width of the image in pixels.
 * @property {number} height - The height of the image in pixels.
 */
export type Dimensions = {width: number; height: number};

/**
 * Rect is an object with four properties: top, left, height, and width, all of which are numbers.
 * @property {number} top - The top position of the element.
 * @property {number} left - The x-coordinate of the top-left corner of the rectangle.
 * @property {number} height - The height of the element.
 * @property {number} width - The width of the element.
 */
export type Rect = {
  top: number;
  left: number;
  height: number;
  width: number;
};

/**
 * It takes a frame and a view, and returns an object with two functions: adjustPoint and adjustRect
 * @param {Dimensions} frame - Dimensions - the dimensions of the video frame
 * @param {Dimensions} view - Dimensions
 * @returns An object with two functions.
 * @resource https://github.com/bglgwyng/FrameProcessorExample/blob/e8e99d58c878d4dce9a8adf74a7447d253be93ab/adjustToView.ts#L21
 */
export const faceBoundsAdjustToView =
  Platform.OS === 'ios'
    ? (frame: Dimensions, view: Dimensions) => {
        const widthRatio = view.width / frame.width;
        const heightRatio = view.height / frame.height;
        return {
          adjustPoint: (point: {x: number; y: number}) => ({
            x: point.x * widthRatio,
            y: point.y * heightRatio,
          }),
          adjustRect(rect: Rect): Rect {
            return {
              left: rect.left * widthRatio,
              top: rect.top * heightRatio,
              width: rect.width * widthRatio,
              height: rect.height * heightRatio,
            };
          },
        };
      }
    : (
        frame: Dimensions,
        view: Dimensions,
        verticalCropPadding: number,
        horizontalCropPadding: number,
      ) => {
        'worklet';
        const {width, height} = view;
        /* Calculating the aspect ratio of the view. */
        const aspectRatio = width / height;

        const frameWidth = frame.width;
        const frameHeight = frame.height;
        const frameAspectRatio = frameWidth / frameHeight;

        /* Setting the widthRatio, heightRatio, offsetX, and offsetY to 0. */
        let widthRatio: number;
        let heightRatio: number;
        let offsetX = 0;
        let offsetY = 0;

        if (frameAspectRatio < aspectRatio) {
          widthRatio = width / frameWidth;
          const croppedFrameHeight = aspectRatio * frameWidth;
          offsetY = (frameHeight - croppedFrameHeight) / 2;
          heightRatio = height / croppedFrameHeight;
        } else {
          heightRatio = height / frameHeight;
          const croppedFrameWidth = aspectRatio * frameHeight;
          offsetX = (frameWidth - croppedFrameWidth) / 2;
          widthRatio = width / croppedFrameWidth;
        }

        // /* Calculating the ratio of the frame to the view. */

        // const croppedFrameWidth = aspectRatio * frameHeight;
        // const croppedFrameHeight = aspectRatio * frameWidth;
        // if (!landscape) {
        //   offsetX = (frameWidth - croppedFrameWidth) / 2;
        // } else {
        //   offsetY = (frameHeight - croppedFrameHeight) / 2;
        // }
        // heightRatio = height / frameHeight;
        // widthRatio = width / croppedFrameWidth;

        /* Returning an object with two functions. */
        return {
          adjustPoint: (point: {x: number; y: number}) => ({
            x: (point.x - offsetX) * widthRatio,
            y: (point.y - offsetY) * heightRatio,
          }),
          adjustRect: (rect: Rect) => ({
            top: (rect.top - offsetY - verticalCropPadding) * heightRatio,
            left: (rect.left - offsetX - horizontalCropPadding) * widthRatio,
            height: (rect.height + verticalCropPadding) * heightRatio,
            width: (rect.width + horizontalCropPadding) * widthRatio,
          }),
        };
      };

/**
 * Sort the camera formats by resolution, with the highest resolution first.
 * @param {CameraDeviceFormat} left - CameraDeviceFormat
 * @param {CameraDeviceFormat} right - CameraDeviceFormat - the right side of the comparison
 * @returns The difference between the two values.
 */
export const sortFormatsByResolution = (
  left: CameraDeviceFormat,
  right: CameraDeviceFormat,
): number => {
  //higher res first
  let leftPoints = left.photoHeight * left.photoWidth;
  let rightPoints = right.photoHeight * right.photoWidth;
  //lower fps for better timing between face rec and capture maybe?
  //leftPoints += left.frameRateRanges.
  return rightPoints - leftPoints;
};
