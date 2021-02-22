/**
 * Collection of some usefull functions
 */

'use strict';

const utils = (function () {
  const _grayscale = [];
  const _rainbow = [];

  for (let idx = 0; idx < 256; idx++) {
    _grayscale[idx] = `rgb(${idx}, ${idx}, ${idx})`;
    _rainbow[idx] = `hsl(${idx},100%,50%)`;
  }

  function map(value, x1, y1, x2, y2) {
    return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;
  }

  function constrain(value, min, max) {
    value = value < min ? min : value;
    value = value > max ? max : value;
    return value;
  }

  function assert(condition, message) {
    if (!condition) {
      message = message || 'Assertion failed';
      if (typeof Error !== 'undefined') {
        throw new Error(message);
      }
      throw message; // Fallback
    }
  }

  function rangeMap(val, min_exp, max_exp, map_x1, map_x2) {
    val = constrain(val, min_exp, max_exp);
    val = map(val, min_exp, max_exp, map_x1, map_x2);

    return val;
  }

  function logRangeMap(val, min_exp, max_exp, map_x1, map_x2) {
    val = Math.log10(val);
    val = rangeMap(val, min_exp, max_exp, map_x1, map_x2);

    return val;
  }

  function rangeMapBuffer(buffer, min_exp, max_exp, map_x1, map_x2) {
    let ret = [];

    for (let idx = 0; idx < buffer.length; idx++) {
      ret.push(rangeMap(buffer[idx], min_exp, max_exp, map_x1, map_x2));
    }

    return ret;
  }

  function logRangeMapBuffer(buffer, min_exp, max_exp, map_x1, map_x2) {
    let ret = [];

    for (let idx = 0; idx < buffer.length; idx++) {
      ret.push(logRangeMap(buffer[idx], min_exp, max_exp, map_x1, map_x2));
    }

    return ret;
  }

  function indexOfMax(arr) {
    if (arr.length === 0) {
      return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        maxIndex = i;
        max = arr[i];
      }
    }

    return maxIndex;
  }

  function decibelsToLinear(decibels) {
    return Math.pow(10, 0.05 * decibels);
  }

  function linearToDecibels(linear) {
    // It's not possible to calculate decibels for a zero linear value since it would be -Inf.
    // -1000.0 dB represents a very tiny linear value in case we ever reach this case.
    if (!linear) return -1000;
    return 20 * Math.log10(linear);
  }

  function getNumberOfFrames(total_size, frame_size, frame_stride) {
    return 1 + Math.floor((total_size - frame_size) / frame_stride);
  }

  function getSizeOfBuffer(n_frames, frame_size, frame_stride) {
    assert(n_frames > 1, 'number of frames too low');
    assert(frame_size > frame_stride, 'stride larger than frame size ...?');
    return frame_size + (n_frames - 1) * frame_stride;
  }

  // [-1, 1]
  function meanNormalize(buffer2D) {
    let nRow = buffer2D.length;
    let nCol = buffer2D[0].length;

    let mean = 0;
    let min = 1e6;
    let max = -1e6;
    for (let row = 0; row < nRow; row++) {
      for (let col = 0; col < nCol; col++) {
        let val = buffer2D[row][col];
        mean += val;
        min = val < min ? val : min;
        max = val > max ? val : max;
      }
    }
    mean /= nRow * nCol;

    // console.log(mean, min, max);

    for (let row = 0; row < nRow; row++) {
      for (let col = 0; col < nCol; col++) {
        buffer2D[row][col] = (buffer2D[row][col] - mean) / (max - min);
      }
    }
  }

  // [0, 1]
  function minMaxNormalize(buffer2D) {
    let nRow = buffer2D.length;
    let nCol = buffer2D[0].length;

    let mean = 0;
    let min = 1e6;
    let max = -1e6;
    for (let row = 0; row < nRow; row++) {
      for (let col = 0; col < nCol; col++) {
        let val = buffer2D[row][col];
        mean += val;
        min = val < min ? val : min;
        max = val > max ? val : max;
      }
    }
    mean /= nRow * nCol;

    // console.log(mean, min, max);

    for (let row = 0; row < nRow; row++) {
      for (let col = 0; col < nCol; col++) {
        buffer2D[row][col] = (buffer2D[row][col] - min) / (max - min);
      }
    }
  }

  function getMeanAndSigma2D(buffer2D) {
    let nRow = buffer2D.length;
    let nCol = buffer2D[0].length;

    console.log(nRow, nCol);

    let mean = 0;
    let sigma = 0;
    for (let row = 0; row < nRow; row++) {
      for (let col = 0; col < nCol; col++) {
        mean += buffer2D[row][col];
      }
    }
    mean /= nRow * nCol;

    for (let row = 0; row < nRow; row++) {
      for (let col = 0; col < nCol; col++) {
        sigma += Math.pow(buffer2D[row][col] - mean, 2);
      }
    }
    sigma /= nRow * nCol - 1;
    sigma = Math.sqrt(sigma);

    return { mean, sigma };
  }

  function standardize(buffer2D, mean, sigma) {
    let _mean = 0;
    let _sigma = 0;

    if (arguments.length === 1) {
      const { mean, sigma } = getMeanAndSigma2D(buffer2D);
      _mean = mean;
      _sigma = sigma;
    } else if (arguments.length === 3) {
      _mean = mean;
      _sigma = sigma;
    } else {
      assert(false, 'wrong argument list');
    }

    const nRow = buffer2D.length;
    const nCol = buffer2D[0].length;

    for (let row = 0; row < nRow; row++) {
      for (let col = 0; col < nCol; col++) {
        buffer2D[row][col] = (buffer2D[row][col] - _mean) / _sigma;
      }
    }
  }

  function de_standardize(buffer1D, mean, sigma) {
    assert(arguments.length === 3, 'wrong argument list');

    const nRow = buffer1D.length;

    for (let row = 0; row < nRow; row++) {
      buffer1D[row] = buffer1D[row] * sigma + mean;
    }
  }

  function checkTime(i) {
    return i < 10 ? '0' + i : i;
  }

  function getTime() {
    let today = new Date(),
      h = checkTime(today.getHours()),
      m = checkTime(today.getMinutes()),
      s = checkTime(today.getSeconds()),
      ms = checkTime(today.getMilliseconds());
    return `${h}:${m}:${s}:${ms}`;
  }

  function download(content, fileName, contentType) {
    let a = document.createElement('a');
    let file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  return {
    grayscale: _grayscale,
    rainbow: _rainbow,
    map: map,
    constrain: constrain,
    assert: assert,
    rangeMap: rangeMap,
    logRangeMap: logRangeMap,
    rangeMapBuffer: rangeMapBuffer,
    logRangeMapBuffer: logRangeMapBuffer,
    indexOfMax: indexOfMax,
    decibelsToLinear: decibelsToLinear,
    linearToDecibels: linearToDecibels,
    getNumberOfFrames: getNumberOfFrames,
    getSizeOfBuffer: getSizeOfBuffer,
    meanNormalize: meanNormalize,
    minMaxNormalize: minMaxNormalize,
    getMeanAndSigma2D: getMeanAndSigma2D,
    standardize: standardize,
    de_standardize,
    getTime: getTime,
    download: download,
  };
})();
