/**
 * CNN Model for Noise Reduction
 * https://github.com/daitan-innovation/cnn-audio-denoiser/blob/master/SpeechDenoiserCNN.ipynb
 * Cascade Redundant Convolutional Encoder-Decoder Network, CR-CED
 */

'use strict';

function createNetwork_NR(width, height, nClasses) {
  const IMAGE_WIDTH = width; //number of rows
  const IMAGE_HEIGHT = height; //number of columns
  const NUM_OUTPUT_CLASSES = nClasses;

  /**
   * create the cnn
   */
  function getModel() {
    const model = tf.sequential();
    const IMAGE_CHANNELS = 1; // default

    model.add(
      tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        dataFormat: 'channelsLast',
        kernelSize: [8, 9],
        //padding: 'same', // TODO: check influence
        filters: 18,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      })
    );
    model.add(
      tf.layers.conv2d({
        kernelSize: [1, 5],
        padding: 'same', // TODO: check influence
        filters: 30,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      })
    );
    model.add(
      tf.layers.conv2d({
        kernelSize: [1, 9],
        padding: 'same', // TODO: check influence
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      })
    );
    model.add(
      tf.layers.conv2d({
        kernelSize: [1, 1],
        //padding: 'same', // TODO: check influence
        filters: 1,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      })
    );

    compile_model(model);

    return model;
  }

  function compile_model(model) {
    const optimizer = tf.train.adam();
    model.compile({
      optimizer: optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
  }

  // function freezeModelforTransferLearning(model) {
  //   console.log('Freezing feature layers of the model.');
  //   for (let i = 0; i < 5; ++i) {
  //     model.layers[i].trainable = false;
  //   }
  //   compile_model(model);
  // }

  async function train(xs, ys, model) {
    // mhh: Which batch size shall I choose?
    // https://machinelearningmastery.com/gentle-introduction-mini-batch-gradient-descent-configure-batch-size/
    const BATCH_SIZE = 8;
    const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
    const container = {
      name: 'Model Training NRed',
      styles: { height: '1000px' },
    };
    //const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);
    const onEpochEnd = tfvis.show.fitCallbacks(container, metrics);

    return model.fit(xs, ys, {
      batchSize: BATCH_SIZE,
      epochs: 15,
      shuffle: true,
      //validationSplit: 0.2,
      callbacks: onEpochEnd,
    });
  }

  return {
    getModel: getModel,
    train: train,
    // freezeModelforTransferLearning: freezeModelforTransferLearning,
    compile_model: compile_model,
  };
}