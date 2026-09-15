const FRAME_COUNT = 300;
const FRAME_DIRECTORY = '/frames';
const FRAME_EXTENSION = 'png';

function getFramePath(index) {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `${FRAME_DIRECTORY}/ezgif-frame-${frameNumber}.${FRAME_EXTENSION}`;
}

module.exports = {
  FRAME_COUNT,
  FRAME_DIRECTORY,
  FRAME_EXTENSION,
  getFramePath,
};
