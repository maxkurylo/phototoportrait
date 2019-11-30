'''
Install the dependencies:
pip install "tensorflow>=2.0.0"
pip install "tensorflow_hub>=0.6.0"
pip install Pillow
pip install numpy

See https://www.tensorflow.org/tutorials/generative/style_transfer
'''

try:
    import sys
    import tensorflow_hub as hub
    import numpy as np
    import PIL.Image
    import tensorflow as tf

    hub_module = hub.load(
        'https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/1')

    def tensor_to_image(tensor):
        tensor = tensor*255
        tensor = np.array(tensor, dtype=np.uint8)
        if np.ndim(tensor) > 3:
            assert tensor.shape[0] == 1
            tensor = tensor[0]
        return PIL.Image.fromarray(tensor)

    def load_img(path_to_img):
        max_dim = 512
        img = tf.io.read_file(path_to_img)
        img = tf.image.decode_image(img, channels=3)
        img = tf.image.convert_image_dtype(img, tf.float32)

        shape = tf.cast(tf.shape(img)[:-1], tf.float32)
        long_dim = max(shape)
        scale = max_dim / long_dim

        new_shape = tf.cast(shape * scale, tf.int32)

        img = tf.image.resize(img, new_shape)
        img = img[tf.newaxis, :]
        return img

    if __name__ == '__main__':
        content_path = sys.argv[1]
        style_path = sys.argv[2]
        save_path = sys.argv[3]
        content_image = load_img(content_path)
        style_image = load_img(style_path)
        stylized_image = hub_module(tf.constant(
            content_image), tf.constant(style_image))[0]
        im = tensor_to_image(stylized_image)
        print("Ready!")
        im.save(save_path, "JPEG")
except Exception as e:
    print 'ERROR: ' + str(e)
