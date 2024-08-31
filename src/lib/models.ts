const models: {
  [key: string]: {
    [key: string]: {
      width: number;
      height: number;
      COLOR_ON: [number, number, number];
      COLOR_OFF: [number, number, number];
    };
  };
} = {
  ili9xxx: {
    S3BOX: {
      width: 320,
      height: 240,
      COLOR_ON: [255, 255, 255],
      COLOR_OFF: [0, 0, 0],
    },
  },
};

export function getModel(platform: string, model: string) {
  return models[platform][model];
}
